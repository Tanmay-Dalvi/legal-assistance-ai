"""
Application configuration management.

Loads settings from environment variables (and an optional .env file).
All configuration is centralized here — never import os.environ directly
elsewhere in the application.
"""

from functools import lru_cache
from typing import Literal

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    All fields have sensible defaults for local development where possible.
    Required fields (no default) will raise a clear ValidationError on startup
    if missing.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ------------------------------------------------------------------ #
    # Application
    # ------------------------------------------------------------------ #
    APP_NAME: str = "Legal Assistance AI"
    APP_VERSION: str = "0.1.0"
    ENVIRONMENT: Literal["development", "staging", "production"] = "development"
    DEBUG: bool = False

    # ------------------------------------------------------------------ #
    # Server
    # ------------------------------------------------------------------ #
    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000
    BACKEND_URL: str = "http://localhost:8000"
    FRONTEND_URL: str = "http://localhost:5173"

    # ------------------------------------------------------------------ #
    # AI / Gemini
    # ------------------------------------------------------------------ #
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-pro"
    GEMINI_EMBEDDING_MODEL: str = "models/text-embedding-004"
    GEMINI_TIMEOUT_SECONDS: float = 60.0
    GEMINI_MAX_RETRIES: int = 2
    MAX_ANALYSIS_CHARACTERS: int = 100_000
    RAG_CHUNK_SIZE: int = 1_200
    RAG_CHUNK_OVERLAP: int = 200
    RAG_EMBEDDING_BATCH_SIZE: int = 16
    RAG_TOP_K: int = 5
    RAG_MIN_SIMILARITY: float = 0.35
    MAX_COMPARISON_CHARACTERS: int = 150_000
    MAX_COMPARISON_SECTIONS: int = 100

    # ------------------------------------------------------------------ #
    # Database
    # ------------------------------------------------------------------ #
    DATABASE_URL: str = "sqlite+aiosqlite:///./data/legal_ai.db"

    # ------------------------------------------------------------------ #
    # File Uploads
    # ------------------------------------------------------------------ #
    MAX_UPLOAD_SIZE_MB: int = 20
    ALLOWED_EXTENSIONS: list[str] = ["pdf", "docx", "txt"]

    # ------------------------------------------------------------------ #
    # Security
    # ------------------------------------------------------------------ #
    SECRET_KEY: str = "change-me-in-production-use-a-long-random-secret"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # ------------------------------------------------------------------ #
    # CORS
    # ------------------------------------------------------------------ #
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]
    CORS_ALLOW_CREDENTIALS: bool = True

    # ------------------------------------------------------------------ #
    # Computed helpers
    # ------------------------------------------------------------------ #
    @property
    def max_upload_size_bytes(self) -> int:
        return self.MAX_UPLOAD_SIZE_MB * 1024 * 1024

    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT == "development"

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    @field_validator("SECRET_KEY")
    @classmethod
    def warn_default_secret(cls, v: str) -> str:
        if v == "change-me-in-production-use-a-long-random-secret":
            import warnings

            warnings.warn(
                "SECRET_KEY is using the default value. "
                "Set a strong SECRET_KEY in production.",
                stacklevel=2,
            )
        return v

    @model_validator(mode="after")
    def validate_production_settings(self) -> "Settings":
        if self.ENVIRONMENT == "production":
            if not self.GEMINI_API_KEY:
                raise ValueError("GEMINI_API_KEY must be set in production.")
            if self.SECRET_KEY == "change-me-in-production-use-a-long-random-secret":
                raise ValueError("SECRET_KEY must be changed from default in production.")
        return self

    @field_validator("GEMINI_TIMEOUT_SECONDS")
    @classmethod
    def validate_gemini_timeout(cls, value: float) -> float:
        if value <= 0:
            raise ValueError("GEMINI_TIMEOUT_SECONDS must be greater than zero.")
        return value

    @field_validator("GEMINI_MAX_RETRIES", "MAX_ANALYSIS_CHARACTERS", "MAX_COMPARISON_CHARACTERS", "MAX_COMPARISON_SECTIONS")
    @classmethod
    def validate_positive_limits(cls, value: int) -> int:
        if value < 0:
            raise ValueError("Configured limits must not be negative.")
        return value

    @field_validator("RAG_CHUNK_SIZE", "RAG_EMBEDDING_BATCH_SIZE", "RAG_TOP_K")
    @classmethod
    def validate_rag_positive_limits(cls, value: int) -> int:
        if value <= 0:
            raise ValueError("RAG limits must be greater than zero.")
        return value

    @field_validator("RAG_CHUNK_OVERLAP")
    @classmethod
    def validate_rag_overlap(cls, value: int) -> int:
        if value < 0:
            raise ValueError("RAG_CHUNK_OVERLAP must not be negative.")
        return value

    @field_validator("RAG_MIN_SIMILARITY")
    @classmethod
    def validate_similarity(cls, value: float) -> float:
        if not 0 <= value <= 1:
            raise ValueError("RAG_MIN_SIMILARITY must be between zero and one.")
        return value

    @model_validator(mode="after")
    def validate_rag_settings(self) -> "Settings":
        if self.RAG_CHUNK_OVERLAP >= self.RAG_CHUNK_SIZE:
            raise ValueError("RAG_CHUNK_OVERLAP must be smaller than RAG_CHUNK_SIZE.")
        return self


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """
    Return the cached application settings singleton.
    Use this function (not Settings() directly) to access configuration
    throughout the application.
    """
    return Settings()

