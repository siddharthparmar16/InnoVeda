"""
Gemini Fallback Chain — Multilayer API key fallback with automatic rotation.

Uses the modern `google-genai` SDK (NOT the legacy `google-generativeai`).

Exception Hierarchy (google-genai):
  google.genai.errors.APIError          ← base class
  ├── google.genai.errors.ClientError   ← all 4xx errors (check e.code)
  │   ├── 401 Unauthenticated           → PERMANENT (bad key)
  │   ├── 403 Permission Denied         → PERMANENT (invalid key / disabled)
  │   ├── 429 Resource Exhausted        → RETRIABLE (rate limit / quota)
  │   └── 400 Invalid Argument          → NOT retriable (bad request)
  └── google.genai.errors.ServerError   ← all 5xx errors (check e.code)
      ├── 500 Internal Server Error     → RETRIABLE
      └── 503 Service Unavailable       → RETRIABLE

  httpx.TimeoutException                → RETRIABLE (network timeout)
  ConnectionError / OSError             → RETRIABLE (network failure)

Flow:
  1. Get next available key from KeyManager
  2. Create/reuse a genai.Client for that key
  3. Call the Gemini API (native async via client.aio)
  4. On success → report_success(), return result
  5. On permanent error (401/403) → mark key EXHAUSTED, try next key
  6. On retriable error (429/500/503/timeout) → report_failure(), try next key
  7. If all keys exhausted → raise AllKeysExhaustedError
"""

import asyncio
import time
import logging
from typing import Optional, AsyncGenerator

import httpx
from google import genai
from google.genai import types
from google.genai import errors as genai_errors

from key_manager import KeyManager, KeyState
from config import get_settings

logger = logging.getLogger(__name__)


class AllKeysExhaustedError(Exception):
    """Raised when all API keys in the chain have been exhausted."""

    def __init__(
        self,
        message: str,
        errors: list = None,
        attempts: int = 0,
        latency_ms: float = 0,
    ):
        super().__init__(message)
        self.errors = errors or []
        self.attempts = attempts
        self.latency_ms = latency_ms


def _classify_error(e: Exception) -> tuple[str, bool, bool]:
    """Classify an exception into (error_msg, is_permanent, is_retriable).

    Returns:
        (error_message, is_permanent, is_retriable)
        - is_permanent=True  → key should be marked EXHAUSTED
        - is_retriable=True  → should try the next key
        - both False         → unexpected error, still try next key
    """
    error_msg = f"{type(e).__name__}: {str(e)[:500]}"

    # ── google-genai SDK errors ──────────────────────────
    if isinstance(e, genai_errors.ClientError):
        code = getattr(e, "code", None)
        if code in (401, 403):
            # Bad or revoked API key — permanent failure
            return error_msg, True, False
        elif code == 429:
            # Rate limit / quota exhausted — retriable with next key
            return error_msg, False, True
        elif code == 400:
            # Invalid request (bad prompt, unsupported model) — NOT retriable
            # This is a user error, not a key error
            return error_msg, False, False
        else:
            # Other 4xx — treat as retriable to be safe
            return error_msg, False, True

    if isinstance(e, genai_errors.ServerError):
        # All 5xx errors are retriable (500, 503, etc.)
        return error_msg, False, True

    if isinstance(e, genai_errors.APIError):
        # Catch-all for any other API errors
        return error_msg, False, True

    # ── Network / timeout errors ─────────────────────────
    if isinstance(e, httpx.TimeoutException):
        return error_msg, False, True

    if isinstance(e, (ConnectionError, TimeoutError, OSError)):
        return error_msg, False, True

    # ── Unexpected errors ────────────────────────────────
    return error_msg, False, True


class GeminiFallbackChain:
    """Multilayer fallback chain for Gemini API calls.

    Tries each available API key in sequence. If a key fails with a retriable
    error, it falls back to the next key. If a key fails permanently (auth error),
    it's marked as exhausted and never used again.

    Uses native async via `client.aio.models` for maximum performance.
    """

    def __init__(self, key_manager: KeyManager):
        self._key_manager = key_manager
        self._clients: dict[str, genai.Client] = {}
        self._settings = get_settings()

    def _get_client(self, key_state: KeyState) -> genai.Client:
        """Get or create a Gemini client for a specific key."""
        if key_state.key not in self._clients:
            self._clients[key_state.key] = genai.Client(
                api_key=key_state.key,
                http_options=types.HttpOptions(
                    timeout=self._settings.REQUEST_TIMEOUT_MS,
                ),
            )
            logger.info(f"Created Gemini client for key {key_state.masked_key}")
        return self._clients[key_state.key]

    def _build_config(
        self,
        system_instruction: Optional[str] = None,
        temperature: Optional[float] = None,
        max_output_tokens: Optional[int] = None,
        top_p: Optional[float] = None,
        top_k: Optional[int] = None,
    ) -> Optional[types.GenerateContentConfig]:
        """Build a GenerateContentConfig from optional parameters."""
        kwargs = {}
        if system_instruction is not None:
            kwargs["system_instruction"] = system_instruction
        if temperature is not None:
            kwargs["temperature"] = temperature
        if max_output_tokens is not None:
            kwargs["max_output_tokens"] = max_output_tokens
        if top_p is not None:
            kwargs["top_p"] = top_p
        if top_k is not None:
            kwargs["top_k"] = top_k
        return types.GenerateContentConfig(**kwargs) if kwargs else None

    async def generate_content(
        self,
        prompt: str,
        model: Optional[str] = None,
        system_instruction: Optional[str] = None,
        temperature: Optional[float] = None,
        max_output_tokens: Optional[int] = None,
        top_p: Optional[float] = None,
        top_k: Optional[int] = None,
    ) -> dict:
        """Generate content with automatic key fallback.

        Returns a dict with:
        - text: the generated text
        - model: the model used
        - key_used: masked key identifier
        - attempts: number of attempts made
        - latency_ms: total latency in milliseconds
        - finish_reason: why generation stopped
        - usage: token usage statistics
        """
        model_name = model or self._settings.GEMINI_DEFAULT_MODEL
        config = self._build_config(
            system_instruction=system_instruction,
            temperature=temperature,
            max_output_tokens=max_output_tokens,
            top_p=top_p,
            top_k=top_k,
        )
        start_time = time.time()
        attempts = 0
        errors_log = []

        max_total_attempts = (
            self._key_manager.total_keys * self._settings.MAX_RETRIES_PER_KEY
        )

        while attempts < max_total_attempts:
            key_state = self._key_manager.get_next_available_key()
            if key_state is None:
                break

            attempts += 1
            client = self._get_client(key_state)

            try:
                logger.info(
                    f"[Attempt {attempts}/{max_total_attempts}] "
                    f"Key {key_state.masked_key} → {model_name}"
                )

                # Native async call via client.aio
                response = await client.aio.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=config,
                )

                # Success!
                self._key_manager.report_success(key_state)
                latency = (time.time() - start_time) * 1000

                logger.info(
                    f"✅ Success | Key {key_state.masked_key} | "
                    f"Attempt {attempts} | {latency:.0f}ms"
                )

                # Extract usage metadata safely
                usage = None
                if response.usage_metadata:
                    um = response.usage_metadata
                    usage = {
                        "prompt_tokens": getattr(um, "prompt_token_count", None),
                        "completion_tokens": getattr(um, "candidates_token_count", None),
                        "total_tokens": getattr(um, "total_token_count", None),
                    }

                # Extract finish reason safely
                finish_reason = None
                if response.candidates and len(response.candidates) > 0:
                    fr = getattr(response.candidates[0], "finish_reason", None)
                    finish_reason = str(fr) if fr else None

                return {
                    "text": response.text or "",
                    "model": model_name,
                    "key_used": key_state.masked_key,
                    "attempts": attempts,
                    "latency_ms": round(latency, 2),
                    "finish_reason": finish_reason,
                    "usage": usage,
                }

            except Exception as e:
                error_msg, is_permanent, is_retriable = _classify_error(e)

                if is_permanent:
                    logger.error(
                        f"🚫 PERMANENT failure | Key {key_state.masked_key}: {error_msg}"
                    )
                    self._key_manager.report_failure(
                        key_state, error_msg, is_permanent=True
                    )
                    errors_log.append(
                        {"key": key_state.masked_key, "error": error_msg, "permanent": True}
                    )
                    # Remove cached client for bad key
                    self._clients.pop(key_state.key, None)
                else:
                    log_fn = logger.warning if is_retriable else logger.error
                    log_fn(
                        f"⚡ {'Retriable' if is_retriable else 'Unexpected'} failure | "
                        f"Key {key_state.masked_key}: {error_msg}"
                    )
                    self._key_manager.report_failure(
                        key_state, error_msg, is_permanent=False
                    )
                    errors_log.append(
                        {"key": key_state.masked_key, "error": error_msg, "permanent": False}
                    )

                # Small backoff before trying next key
                await asyncio.sleep(0.5)
                continue

        # All keys exhausted
        latency = (time.time() - start_time) * 1000
        raise AllKeysExhaustedError(
            f"All {self._key_manager.total_keys} API keys failed after "
            f"{attempts} attempt(s) ({latency:.0f}ms)",
            errors=errors_log,
            attempts=attempts,
            latency_ms=round(latency, 2),
        )

    async def generate_content_stream(
        self,
        prompt: str,
        model: Optional[str] = None,
        system_instruction: Optional[str] = None,
        temperature: Optional[float] = None,
        max_output_tokens: Optional[int] = None,
        top_p: Optional[float] = None,
        top_k: Optional[int] = None,
    ) -> AsyncGenerator[dict, None]:
        """Stream generated content with automatic key fallback.

        Yields dicts with:
        - text: the chunk text
        - key_used: masked key identifier
        - chunk_index: sequential chunk number
        - is_final: True for the last chunk
        """
        model_name = model or self._settings.GEMINI_DEFAULT_MODEL
        config = self._build_config(
            system_instruction=system_instruction,
            temperature=temperature,
            max_output_tokens=max_output_tokens,
            top_p=top_p,
            top_k=top_k,
        )
        attempts = 0
        errors_log = []
        max_total_attempts = (
            self._key_manager.total_keys * self._settings.MAX_RETRIES_PER_KEY
        )

        while attempts < max_total_attempts:
            key_state = self._key_manager.get_next_available_key()
            if key_state is None:
                break

            attempts += 1
            client = self._get_client(key_state)

            try:
                logger.info(
                    f"[Stream Attempt {attempts}/{max_total_attempts}] "
                    f"Key {key_state.masked_key} → {model_name}"
                )

                # Native async streaming via client.aio
                response_stream = await client.aio.models.generate_content_stream(
                    model=model_name,
                    contents=prompt,
                    config=config,
                )

                chunk_count = 0
                async for chunk in response_stream:
                    chunk_count += 1
                    if chunk.text:
                        yield {
                            "text": chunk.text,
                            "key_used": key_state.masked_key,
                            "chunk_index": chunk_count,
                            "is_final": False,
                        }

                # Stream completed successfully
                yield {
                    "text": "",
                    "key_used": key_state.masked_key,
                    "chunk_index": chunk_count + 1,
                    "is_final": True,
                    "total_chunks": chunk_count,
                }
                self._key_manager.report_success(key_state)
                logger.info(
                    f"✅ Stream complete | Key {key_state.masked_key} | "
                    f"{chunk_count} chunks"
                )
                return  # Success — stop trying other keys

            except Exception as e:
                error_msg, is_permanent, _ = _classify_error(e)

                if is_permanent:
                    self._key_manager.report_failure(
                        key_state, error_msg, is_permanent=True
                    )
                    self._clients.pop(key_state.key, None)
                else:
                    self._key_manager.report_failure(
                        key_state, error_msg, is_permanent=False
                    )

                errors_log.append(
                    {"key": key_state.masked_key, "error": error_msg}
                )
                logger.warning(
                    f"⚡ Stream failure | Key {key_state.masked_key}: {error_msg}"
                )
                await asyncio.sleep(0.5)
                continue

        raise AllKeysExhaustedError(
            f"All keys failed for streaming after {attempts} attempt(s)",
            errors=errors_log,
            attempts=attempts,
        )
