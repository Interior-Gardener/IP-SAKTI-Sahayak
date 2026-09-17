"""BGE-M3 via sentence-transformers: multilingual, no key, no cost.
Install with `pip install -e ".[local]"`; the model downloads on first use.

Runs on an NVIDIA GPU when PyTorch was installed with CUDA, otherwise on the CPU.
The default PyTorch wheel is CPU-only; for a GPU install the CUDA build, e.g.
`pip install torch --index-url https://download.pytorch.org/whl/cu128` (RTX 50xx needs cu128+).
"""

import os

from app.embed.base import Embedder


def pick_device() -> str:
    """EMBED_DEVICE=cuda|cpu overrides; otherwise CUDA if available."""
    chosen = os.environ.get("EMBED_DEVICE")
    if chosen:
        return chosen
    try:
        import torch

        return "cuda" if torch.cuda.is_available() else "cpu"
    except ImportError:
        return "cpu"


class LocalEmbedder(Embedder):
    def __init__(self, model: str = "BAAI/bge-m3", encoder=None) -> None:
        self.device = "cpu"
        if encoder is None:
            from sentence_transformers import SentenceTransformer

            self.device = pick_device()
            encoder = SentenceTransformer(model, device=self.device)
            if self.device == "cuda":
                encoder.half()  # half precision: ~2x faster, same retrieval quality
        self.model = model
        self.encoder = encoder
        # BGE-M3 accepts 8192 tokens. Chunks are ~600 tokens with the contextual header
        # first; a GPU handles 1024 easily, a CPU is kept to 512 for speed.
        default_tokens = "1024" if self.device == "cuda" else "512"
        max_tokens = int(os.environ.get("EMBED_MAX_TOKENS", default_tokens))
        if hasattr(encoder, "max_seq_length"):
            encoder.max_seq_length = max_tokens
        self.batch_size = 64 if self.device == "cuda" else 16
        # Newer sentence-transformers renamed the dimension getter.
        dim_of = getattr(encoder, "get_embedding_dimension", None)
        self.dim = dim_of() if dim_of else encoder.get_sentence_embedding_dimension()

    def _encode(self, texts: list[str]) -> list[list[float]]:
        # Normalised so cosine distance in pgvector equals dot product.
        return self.encoder.encode(
            texts, normalize_embeddings=True, batch_size=self.batch_size
        ).tolist()

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return self._encode(texts)

    def embed_query(self, text: str) -> list[float]:
        return self._encode([text])[0]
