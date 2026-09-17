"""voyage-law-2: stronger on English legal text; needs VOYAGE_API_KEY.
Queries are translated to English before retrieval, so English-only is fine."""

from app.embed.base import Embedder

_DIMS = {"voyage-law-2": 1024}


class VoyageEmbedder(Embedder):
    def __init__(self, model: str = "voyage-law-2", client=None) -> None:
        if client is None:
            import voyageai

            client = voyageai.Client()
        self.model = model
        self.client = client
        self.dim = _DIMS.get(model, 1024)

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return self.client.embed(texts, model=self.model, input_type="document").embeddings

    def embed_query(self, text: str) -> list[float]:
        return self.client.embed([text], model=self.model, input_type="query").embeddings[0]
