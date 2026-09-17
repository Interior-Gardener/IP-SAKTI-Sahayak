"""Cross-encoder rerank with bge-reranker-v2-m3 (local, no key). Toggle with
RERANK_PROVIDER=none to skip it."""

from dataclasses import dataclass


@dataclass(frozen=True)
class Scored:
    index: int
    score: float


class LocalReranker:
    def __init__(self, model: str = "BAAI/bge-reranker-v2-m3", encoder=None) -> None:
        if encoder is None:
            from sentence_transformers import CrossEncoder

            from app.embed.local import pick_device

            device = pick_device()
            encoder = CrossEncoder(model, device=device)
            if device == "cuda":
                encoder.model.half()
        self.model = model
        self.encoder = encoder

    def rerank(self, query: str, passages: list[str], top_k: int = 8) -> list[Scored]:
        if not passages:
            return []
        scores = self.encoder.predict([(query, p) for p in passages])
        ranked = sorted(
            (Scored(i, float(s)) for i, s in enumerate(scores)), key=lambda s: s.score, reverse=True
        )
        return ranked[:top_k]


def get_reranker() -> "LocalReranker | None":
    """RERANK_PROVIDER=local (default) or none."""
    import os

    if os.environ.get("RERANK_PROVIDER", "local").lower() == "none":
        return None
    return LocalReranker(os.environ.get("RERANK_MODEL", "BAAI/bge-reranker-v2-m3"))
