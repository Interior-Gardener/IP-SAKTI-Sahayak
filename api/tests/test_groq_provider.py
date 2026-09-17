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


def test_parse_markers_accepts_missing_prefix():
    # gpt-oss-120b sometimes drops the "c:" prefix (seen in a live call).
    prose, cites = parse_markers('Bees make it. [[c-1|"Honey is collected by bees"]]')
    assert prose == "Bees make it."
    assert [(c.chunk_id, c.cited_text) for c in cites] == [("c-1", "Honey is collected by bees")]


def test_parse_markers_accepts_single_closing_bracket():
    prose, cites = parse_markers(
        'Barred [[c:39|"(p) an invention which is traditional knowledge.]"]. Next.'
    )
    assert [c.chunk_id for c in cites] == ["39"] and "[[" not in prose


def test_parse_markers_accepts_fullwidth_brackets():
    prose, cites = parse_markers(
        'It is barred【c:39|"traditional knowledge"】. Also “curly” [[c:40|“known properties”]].'
    )
    assert [(c.chunk_id, c.cited_text) for c in cites] == [
        ("39", "traditional knowledge"),
        ("40", "known properties"),
    ]
    assert "【" not in prose and "[[" not in prose


def test_retries_once_when_the_model_uses_its_own_citation_style():
    replies = iter(
        [
            "Micro-organisms are patentable【1†Patents Act】.",  # unusable style
            'Micro-organisms are patentable [[c:c-2|"other than micro-organisms"]].',
        ]
    )
    sent = []

    def create(**kw):
        sent.append(kw["messages"])
        return NS(choices=[NS(message=NS(content=next(replies)))])

    client = NS(chat=NS(completions=NS(create=create)))
    docs = [Document("c-2", "Patents Act s.3", "plants and animals other than micro-organisms")]
    answer = GroqProvider("gpt-oss", client).answer_with_citations("sys", "q?", docs)
    assert [c.chunk_id for c in answer.citations] == ["c-2"]
    assert len(sent) == 2 and "c-2" in sent[1][-1]["content"]  # the retry names the allowed ids
