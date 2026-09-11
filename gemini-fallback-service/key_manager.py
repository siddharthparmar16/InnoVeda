"""
Key Manager — Thread-safe API key rotation with cooldown and health tracking.

This is the core brain of the fallback chain. It manages a pool of API keys,
tracks their health (success/failure rates, cooldowns), and provides the
next available key for API calls.

Key States:
  ACTIVE    → Ready to use for API calls
  COOLDOWN  → Temporarily disabled after consecutive failures (auto-recovers)
  EXHAUSTED → Permanently disabled (e.g. invalid/revoked key)
"""

import time
import threading
from dataclasses import dataclass
from enum import Enum
from typing import Optional, List, Dict
import logging

logger = logging.getLogger(__name__)


class KeyStatus(Enum):
    """Possible states for an API key."""
    ACTIVE = "active"
    COOLDOWN = "cooldown"
    EXHAUSTED = "exhausted"


@dataclass
class KeyState:
    """Mutable state tracking for a single API key."""

    key: str
    masked_key: str  # For safe logging (e.g., "...xY4z")
    status: KeyStatus = KeyStatus.ACTIVE
    consecutive_failures: int = 0
    total_requests: int = 0
    total_failures: int = 0
    total_successes: int = 0
    last_failure_time: Optional[float] = None
    last_success_time: Optional[float] = None
    last_error: Optional[str] = None
    cooldown_until: Optional[float] = None


class KeyManager:
    """Thread-safe API key rotation manager with cooldown and health tracking.

    Workflow:
    1. Call `get_next_available_key()` to get an active key
    2. Use the key for an API call
    3. Call `report_success()` or `report_failure()` based on the result
    4. On failure, the manager tracks consecutive failures per key
    5. After `max_retries_per_key` consecutive failures, the key enters cooldown
    6. After `cooldown_seconds`, the key auto-recovers to ACTIVE
    7. Permanently bad keys (auth errors) are marked EXHAUSTED forever
    """

    def __init__(
        self,
        api_keys: List[str],
        max_retries_per_key: int = 2,
        cooldown_seconds: int = 60,
    ):
        if not api_keys:
            raise ValueError("At least one API key must be provided")

        self._lock = threading.Lock()
        self._keys: List[KeyState] = []
        self._current_index: int = 0
        self._max_retries: int = max_retries_per_key
        self._cooldown_seconds: int = cooldown_seconds

        for key in api_keys:
            masked = f"...{key[-4:]}" if len(key) > 4 else "****"
            self._keys.append(KeyState(key=key, masked_key=masked))

        logger.info(
            f"KeyManager initialized with {len(self._keys)} key(s) | "
            f"max_retries={max_retries_per_key} | cooldown={cooldown_seconds}s"
        )

    def get_next_available_key(self) -> Optional[KeyState]:
        """Get the next available API key, skipping cooldown/exhausted keys.

        Automatically recovers keys whose cooldown period has elapsed.
        Returns None if ALL keys are unavailable.
        """
        with self._lock:
            now = time.time()

            # Phase 1: Recover any keys whose cooldown has expired
            for ks in self._keys:
                if (
                    ks.status == KeyStatus.COOLDOWN
                    and ks.cooldown_until is not None
                    and now >= ks.cooldown_until
                ):
                    ks.status = KeyStatus.ACTIVE
                    ks.consecutive_failures = 0
                    ks.cooldown_until = None
                    logger.info(f"🔄 Key {ks.masked_key} recovered from cooldown")

            # Phase 2: Find an active key via round-robin starting from current index
            tried = 0
            while tried < len(self._keys):
                ks = self._keys[self._current_index]
                if ks.status == KeyStatus.ACTIVE:
                    return ks
                self._current_index = (self._current_index + 1) % len(self._keys)
                tried += 1

            # Phase 3: No active keys — log which are in cooldown
            cooldown_keys = [
                k for k in self._keys if k.status == KeyStatus.COOLDOWN
            ]
            if cooldown_keys:
                soonest = min(
                    cooldown_keys,
                    key=lambda k: k.cooldown_until or float("inf"),
                )
                wait_time = max(0, (soonest.cooldown_until or now) - now)
                logger.warning(
                    f"⚠️  All keys unavailable. Nearest recovery: "
                    f"{soonest.masked_key} in {wait_time:.1f}s"
                )
            else:
                logger.error("❌ All keys are permanently exhausted. No recovery possible.")

            return None

    def report_success(self, key_state: KeyState) -> None:
        """Report a successful API call for the given key."""
        with self._lock:
            key_state.consecutive_failures = 0
            key_state.total_successes += 1
            key_state.total_requests += 1
            key_state.last_success_time = time.time()
            key_state.last_error = None

    def report_failure(
        self,
        key_state: KeyState,
        error: str,
        is_permanent: bool = False,
    ) -> None:
        """Report a failed API call. Handles cooldown transitions and exhaustion.

        Args:
            key_state: The key that failed.
            error: Human-readable error description.
            is_permanent: If True, key is marked EXHAUSTED (never auto-recovers).
        """
        with self._lock:
            key_state.consecutive_failures += 1
            key_state.total_failures += 1
            key_state.total_requests += 1
            key_state.last_failure_time = time.time()
            key_state.last_error = error

            if is_permanent:
                key_state.status = KeyStatus.EXHAUSTED
                logger.error(
                    f"🚫 Key {key_state.masked_key} PERMANENTLY exhausted: {error}"
                )
            elif key_state.consecutive_failures >= self._max_retries:
                key_state.status = KeyStatus.COOLDOWN
                key_state.cooldown_until = time.time() + self._cooldown_seconds
                logger.warning(
                    f"⏸️  Key {key_state.masked_key} → COOLDOWN for "
                    f"{self._cooldown_seconds}s (failed {key_state.consecutive_failures}x)"
                )
                # Advance index to next key for future requests
                self._current_index = (self._current_index + 1) % len(self._keys)

    def reset_key_for_model_retry(self, key_state: KeyState) -> None:
        """Clear cooldown for a key when retrying with a different model.

        A 503/overload failure is model-capacity exhaustion, not key fault —
        the same key will usually work fine against a fallback model, so don't
        let cooldown block the immediate retry.
        """
        with self._lock:
            key_state.consecutive_failures = 0
            if key_state.status == KeyStatus.COOLDOWN:
                key_state.status = KeyStatus.ACTIVE
                key_state.cooldown_until = None

    def get_all_key_stats(self) -> List[Dict]:
        """Return health/status stats for all keys (for monitoring/dashboard)."""
        with self._lock:
            now = time.time()
            stats = []
            for i, ks in enumerate(self._keys):
                remaining_cooldown = None
                if ks.status == KeyStatus.COOLDOWN and ks.cooldown_until:
                    remaining_cooldown = round(max(0, ks.cooldown_until - now), 1)

                success_rate = (
                    round(ks.total_successes / ks.total_requests * 100, 1)
                    if ks.total_requests > 0
                    else 100.0
                )

                stats.append({
                    "index": i,
                    "masked_key": ks.masked_key,
                    "status": ks.status.value,
                    "consecutive_failures": ks.consecutive_failures,
                    "total_requests": ks.total_requests,
                    "total_successes": ks.total_successes,
                    "total_failures": ks.total_failures,
                    "success_rate_pct": success_rate,
                    "last_error": ks.last_error,
                    "remaining_cooldown_seconds": remaining_cooldown,
                })
            return stats

    @property
    def total_keys(self) -> int:
        """Total number of keys in the pool."""
        return len(self._keys)

    @property
    def active_keys_count(self) -> int:
        """Number of currently usable keys (ACTIVE or recovered from cooldown)."""
        with self._lock:
            now = time.time()
            count = 0
            for ks in self._keys:
                if ks.status == KeyStatus.ACTIVE:
                    count += 1
                elif (
                    ks.status == KeyStatus.COOLDOWN
                    and ks.cooldown_until is not None
                    and now >= ks.cooldown_until
                ):
                    count += 1
            return count
