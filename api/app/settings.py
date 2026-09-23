"""Runtime configuration, read from the environment (and `.env` locally).

Provider keys live here and nowhere else: the web app never receives them.
"""

import os
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=("../.env", ".env"), extra="ignore")

    app_name: str = "IP-SAKTI Sahayak API"
    database_url: str = "postgresql+psycopg://sahayak:sahayak@localhost:5432/sahayak"
    #: Seconds to wait for a database connection before giving up. Low on
    #: purpose: a missing database should fail fast, not hang.
    db_connect_timeout: int = 5
    cors_origins: list[str] = ["http://localhost:5173"]

    llm_provider_answer: str = "groq"
    llm_model_answer: str = "openai/gpt-oss-120b"
    embed_provider: str = "local"
    embed_model: str = "BAAI/bge-m3"

    # Bumped by ingest once the corpus exists; 'none' until then.
    corpus_version: str = "none"


@lru_cache
def get_settings() -> Settings:
    return Settings()


def load_env_file() -> None:
    """Vendor SDKs (anthropic, groq) read keys from os.environ, not from Settings, so the
    repo-root .env is copied into the environment. Variables already set win, which keeps
    Docker and CI configuration authoritative."""
    for path in (Path(__file__).resolve().parents[2] / ".env", Path.cwd() / ".env"):
        if not path.is_file():
            continue
        for line in path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            value = value.strip().strip('"').strip("'")
            if key.strip() and value:
                os.environ.setdefault(key.strip(), value)


load_env_file()
