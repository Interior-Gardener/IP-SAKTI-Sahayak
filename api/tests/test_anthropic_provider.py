from types import SimpleNamespace as NS

import pytest

from app.llm.anthropic_provider import AnthropicProvider, RefusedError
from app.llm.base import Document


class FakeClient:
    def __init__(self, response):
        self.response = response
        self.calls = []
        self.beta = NS(messages=NS(create=self._create))

    def _create(self, **kwargs):
        self.calls.append(kwargs)
        return self.response


DOCS = [
    Document("c-1", "Patents Act s.2", "definitions text"),
    Document("c-2", "Patents Act s.3(p)", "traditional knowledge text"),
]


def test_citations_map_to_chunk_ids():
    response = NS(
        stop_reason="end_turn",
        model="claude-opus-5",
        content=[
            NS(type="thinking"),
            NS(type="text", text="Not patentable ", citations=None),
            NS(
                type="text",
                text="as TK.",
                citations=[NS(document_index=1, cited_text="traditional knowledge")],
            ),
        ],
    )
    client = FakeClient(response)
    answer = AnthropicProvider("claude-opus-5", client).answer_with_citations("sys", "q?", DOCS)

    assert answer.markdown == "Not patentable as TK."
    assert [(c.chunk_id, c.cited_text) for c in answer.citations] == [
        ("c-2", "traditional knowledge")
    ]
    sent = client.calls[0]["messages"][0]["content"]
    assert all(b["citations"] == {"enabled": True} for b in sent[:2])
    assert client.calls[0]["fallbacks"] == "default"


def test_refusal_raises():
    client = FakeClient(NS(stop_reason="refusal", content=[], model="m"))
    with pytest.raises(RefusedError):
        AnthropicProvider("claude-opus-5", client).complete("sys", "hi")
