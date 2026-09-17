from types import SimpleNamespace as NS

from app.llm.base import Document
from app.llm.groq_provider import GroqProvider, parse_markers


def test_parse_markers_strips_and_collects():
    text = (
        'TK is barred [[c:c-2|"traditional knowledge"]]. '
        'Microbes differ [[c:c-9|"micro-organisms"]].'
    )
    prose, cites = parse_markers(text)
    assert prose == "TK is barred. Microbes differ."
    assert [(c.chunk_id, c.cited_text) for c in cites] == [
        ("c-2", "traditional knowledge"),
        ("c-9", "micro-organisms"),
    ]


def test_parse_markers_without_markers():
    assert parse_markers("plain answer") == ("plain answer", [])


def test_answer_drops_unknown_chunk_ids():
    reply = 'Barred [[c:c-2|"traditional knowledge"]] and [[c:made-up|"anything"]].'
    client = NS(
        chat=NS(completions=NS(create=lambda **_: NS(choices=[NS(message=NS(content=reply))])))
    )
    docs = [Document("c-2", "Patents Act s.3(p)", "traditional knowledge text")]
    answer = GroqProvider("llama", client).answer_with_citations("sys", "q?", docs)
    assert [c.chunk_id for c in answer.citations] == ["c-2"]
    assert "[[" not in answer.markdown
