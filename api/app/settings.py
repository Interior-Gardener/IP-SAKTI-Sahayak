"""Runtime configuration, read from the environment (and `.env` locally).

Provider keys live here and nowhere else: the web app never receives them.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=("../.env", ".env"), extra="ignore")

    app_name: str = "IP-SAKTI Sahayak API"
    database_url: str = "postgresql+psycopg://sahayak:sahayak@localhost:5432/sahayak"
    cors_origins: list[str] = ["http://localhost:5173"]

    llm_provider_answer: str = "anthropic"
    llm_model_answer: str = "claude-opus-5"
    embed_provider: str = "local"
    embed_model: str = "BAAI/bge-m3"

    # Bumped by ingest once the corpus exists; 'none' until then.
    corpus_version: str = "none"


@lru_cache
def get_settings() -> Settings:
    return Settings()
