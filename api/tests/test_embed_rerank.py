from types import SimpleNamespace as NS

import numpy as np

from app.embed import base
from app.embed.local import LocalEmbedder
from app.embed.voyage import VoyageEmbedder
from app.rerank.local import LocalReranker


class FakeEncoder:
    def get_sentence_embedding_dimension(self):
        return 3

    def encode(self, texts, normalize_embeddings, batch_size=16):
        assert normalize_embeddings
        return np.array([[len(t), 0.0, 1.0] for t in texts])

    def predict(self, pairs):
        # Longer passages score higher, so the order is easy to predict.
        return [len(p) for _, p in pairs]


def test_local_embedder_shapes():
    e = LocalEmbedder("fake", FakeEncoder())
    assert e.dim == 3
    assert len(e.embed_documents(["a", "bb", "ccc"])) == 3
    assert e.embed_query("abcd") == [4.0, 0.0, 1.0]


def test_voyage_uses_input_types():
    seen = []

    def embed(texts, model, input_type):
        seen.append(input_type)
        return NS(embeddings=[[0.1] * 4 for _ in texts])

    v = VoyageEmbedder("voyage-law-2", NS(embed=embed))
    v.embed_documents(["x", "y"])
    v.embed_query("q")
    assert seen == ["document", "query"]


def test_rerank_orders_and_truncates():
    r = LocalReranker("fake", FakeEncoder())
    out = r.rerank("q", ["a", "ccc", "bb"], top_k=2)
    assert [s.index for s in out] == [1, 2]


def test_unknown_embed_provider(monkeypatch):
    monkeypatch.setenv("EMBED_PROVIDER", "nope")
    try:
        base.get_embedder()
    except RuntimeError:
        return
    raise AssertionError("expected RuntimeError")
