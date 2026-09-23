from types import SimpleNamespace as NS

import httpx
import pytest

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


def test_switches_key_on_a_daily_limit_but_not_a_minute_limit(monkeypatch):
    import app.llm.groq_provider as gp

    monkeypatch.setenv("GROQ_API_KEYS", "key-one,key-two,key-three")
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    assert gp.groq_keys() == ["key-one", "key-two", "key-three"]

    made = []

    def fake_groq(max_retries, api_key):
        made.append(api_key)
        return NS(chat=NS(completions=NS(create=lambda **_: next(behaviour)())))

    def limit_error(message):
        response = httpx.Response(429, request=httpx.Request("POST", "https://api.groq.com/x"))
        return gp.RateLimitError(message, response=response, body=None)

    def daily():
        raise limit_error("429 rate limit reached ... on tokens per day (TPD)")

    def minute():
        raise limit_error("429 ... on tokens per minute (TPM)")

    behaviour = iter([daily, lambda: NS(choices=[NS(message=NS(content="second key answered"))])])
    monkeypatch.setattr(gp, "Groq", fake_groq)
    p = gp.GroqProvider("gpt-oss")
    assert p.complete("s", "q") == "second key answered"
    assert made == ["key-one", "key-two"]  # switched once, in order

    behaviour = iter([minute])
    p2 = gp.GroqProvider("gpt-oss")
    with pytest.raises(gp.RateLimitError):
        p2.complete("s", "q")  # a per-minute limit is the SDK's job, not a key switch


def test_a_capped_tool_loop_ends_with_a_plain_request():
    """The live bug of 2026-09-23: at the cap, the wrap-up replayed the tool
    transcript without declaring tools, and Groq refused it the moment the model
    reached for a tool again. The wrap-up must carry no tool shape at all."""
    from app.llm.base import ToolSpec

    sent = []

    def create(**kw):
        sent.append(kw)
        if "tools" in kw:
            call = NS(id="t1", function=NS(name="search_corpus", arguments='{"query": "coral"}'))
            return NS(choices=[NS(message=NS(content="", tool_calls=[call]))])
        return NS(choices=[NS(message=NS(content="Coral export needs a permit."))])

    client = NS(chat=NS(completions=NS(create=create)))
    spec = ToolSpec("search_corpus", "search", {"type": "object", "properties": {}})
    run = GroqProvider("gpt-oss", client).tool_loop(
        "sys", "Is coral export restricted?", [spec], lambda n, a: "Schedule I Part K", 2
    )
    assert run.truncated and run.text == "Coral export needs a permit."
    final = sent[-1]
    assert "tools" not in final and "tool_choice" not in final
    assert all(m["role"] in ("system", "user") for m in final["messages"])
    assert "Schedule I Part K" in final["messages"][-1]["content"]


def test_a_wrap_up_that_keeps_calling_tools_is_cut_short_not_raised():
    """gpt-oss can answer even a tool-free request with a tool call, which Groq
    returns as a 400. One retry, then an honest refusal — never a stack trace."""
    import app.llm.groq_provider as gp
    from app.llm.base import CUT_SHORT, ToolSpec

    def create(**kw):
        if "tools" in kw:
            call = NS(id="t1", function=NS(name="search_corpus", arguments="{}"))
            return NS(choices=[NS(message=NS(content="", tool_calls=[call]))])
        response = httpx.Response(400, request=httpx.Request("POST", "https://api.groq.com/x"))
        raise gp.BadRequestError("tool_use_failed", response=response, body=None)

    client = NS(chat=NS(completions=NS(create=create)))
    spec = ToolSpec("search_corpus", "search", {"type": "object", "properties": {}})
    run = GroqProvider("gpt-oss", client).tool_loop("sys", "q?", [spec], lambda n, a: "r", 1)
    assert run.truncated and run.text == CUT_SHORT
