"""BGE-M3 on CPU via sentence-transformers: multilingual, no key, no cost.
Install with `pip install -e ".[local]"`; the model downloads on first use."""

import os

from app.embed.base import Embedder


class LocalEmbedder(Embedder):
    def __init__(self, model: str = "BAAI/bge-m3", encoder=None) -> None:
        if encoder is None:
            from sentence_transformers import SentenceTransformer

            encoder = SentenceTransformer(model)
        self.model = model
        self.encoder = encoder
        # BGE-M3 accepts 8192 tokens, but CPU time grows fast with length. Chunks are
        # ~600 tokens with the contextual header first, so 512 keeps what matters.
        max_tokens = int(os.environ.get("EMBED_MAX_TOKENS", "512"))
        if hasattr(encoder, "max_seq_length"):
            encoder.max_seq_length = max_tokens
        # Newer sentence-transformers renamed the dimension getter.
        dim_of = getattr(encoder, "get_embedding_dimension", None)
        self.dim = dim_of() if dim_of else encoder.get_sentence_embedding_dimension()

    def _encode(self, texts: list[str]) -> list[list[float]]:
        # Normalised so cosine distance in pgvector equals dot product.
        return self.encoder.encode(texts, normalize_embeddings=True).tolist()

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return self._encode(texts)

    def embed_query(self, text: str) -> list[float]:
        return self._encode([text])[0]
