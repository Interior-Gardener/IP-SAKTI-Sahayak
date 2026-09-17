"""Embedding seam. Every chunk stores `embed_model`, and search refuses to mix
vectors from different models, so switching provider means a full re-embed."""

import os
from abc import ABC, abstractmethod


class Embedder(ABC):
    model: str
    dim: int

    @abstractmethod
    def embed_documents(self, texts: list[str]) -> list[list[float]]: ...

    @abstractmethod
    def embed_query(self, text: str) -> list[float]: ...


def get_embedder() -> Embedder:
    provider = os.environ.get("EMBED_PROVIDER", "local").lower()
    if provider == "local":
        from app.embed.local import LocalEmbedder

        return LocalEmbedder(os.environ.get("EMBED_MODEL", "BAAI/bge-m3"))
    if provider == "voyage":
        from app.embed.voyage import VoyageEmbedder

        return VoyageEmbedder(os.environ.get("EMBED_MODEL", "voyage-law-2"))
    raise RuntimeError(f"unknown EMBED_PROVIDER '{provider}'")
