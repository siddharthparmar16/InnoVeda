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
    GEMINI_DEFAULT_MODEL: str = "gemini-2.0-flash"

    # ── Retry & Fallback Configuration ───────────────────
    MAX_RETRIES_PER_KEY: int = 2
    KEY_COOLDOWN_SECONDS: int = 60
    REQUEST_TIMEOUT_MS: int = 30000  # milliseconds

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

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
    }


@lru_cache()
def get_settings() -> Settings:
    """Get cached application settings (singleton pattern)."""
    return Settings()
