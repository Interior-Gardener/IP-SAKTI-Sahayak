"""BGE-M3 on CPU via sentence-transformers: multilingual, no key, no cost.
Install with `pip install -e ".[local]"`; the model downloads on first use."""

from app.embed.base import Embedder


class LocalEmbedder(Embedder):
    def __init__(self, model: str = "BAAI/bge-m3", encoder=None) -> None:
        if encoder is None:
            from sentence_transformers import SentenceTransformer

            encoder = SentenceTransformer(model)
        self.model = model
        self.encoder = encoder
        self.dim = encoder.get_sentence_embedding_dimension()

    def _encode(self, texts: list[str]) -> list[list[float]]:
        # Normalised so cosine distance in pgvector equals dot product.
        return self.encoder.encode(texts, normalize_embeddings=True).tolist()

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return self._encode(texts)

    def embed_query(self, text: str) -> list[float]:
        return self._encode([text])[0]
