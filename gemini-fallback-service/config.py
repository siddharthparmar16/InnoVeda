"""
Configuration module for the Gemini Fallback Chain service.

Loads settings from environment variables / .env file using Pydantic Settings.
All configuration is centralized here for easy management.
"""

from functools import lru_cache
from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # ── API Keys ─────────────────────────────────────────
    GEMINI_API_KEYS: List[str] = []

    # ── Model Configuration ──────────────────────────────
    GEMINI_DEFAULT_MODEL: str = "gemini-3.6-flash"
    # Models to try when the primary is overloaded (503 / high demand).
    # NOTE: kept as plain str (not List[str]) because pydantic-settings
    # requires JSON syntax for List fields in .env and crashes otherwise.
    GEMINI_FALLBACK_MODELS: str = "gemini-3.5-flash,gemini-3.7-flash,gemini-3.5-flash-lite"

    # ── Retry & Fallback Configuration ───────────────────
    MAX_RETRIES_PER_KEY: int = 1
    KEY_COOLDOWN_SECONDS: int = 30
    REQUEST_TIMEOUT_MS: int = 45000  # milliseconds
    DEFAULT_MAX_OUTPUT_TOKENS: int = 4096  # ample headroom for reasoning thoughts + output

    # ── Server Configuration ─────────────────────────────
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    @field_validator("GEMINI_API_KEYS", mode="before")
    @classmethod
    def parse_api_keys(cls, v):
        """Parse comma-separated API keys from env var string."""
        if isinstance(v, str):
            keys = [k.strip() for k in v.split(",") if k.strip()]
            return keys
        return v

    @property
    def fallback_models_list(self) -> List[str]:
        """GEMINI_FALLBACK_MODELS as a clean list.

        Tolerates plain (`a,b`), quoted, or JSON-array (`["a","b"]`) syntax
        so .env formatting can never crash startup.
        """
        raw = self.GEMINI_FALLBACK_MODELS.strip().strip("'\"")
        if raw.startswith("[") and raw.endswith("]"):
            raw = raw[1:-1]
        models = [m.strip().strip("'\"") for m in raw.split(",")]
        return [m for m in models if m]

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
    }


@lru_cache()
def get_settings() -> Settings:
    """Get cached application settings (singleton pattern)."""
    return Settings()
