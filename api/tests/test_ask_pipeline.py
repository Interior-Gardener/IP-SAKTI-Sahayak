from app.ask import pipeline
from app.ask.pipeline import AnswerCache, AskRequest, Services, run
from app.llm.base import CitedAnswer, RawCitation
from app.retrieval.hybrid import Retrieved


def hit(cid, jurisdiction, locator, text):
    r = Retrieved(
        cid,
        f"{jurisdiction.lower()}-src",
        "Source",
        "https://example.org/",
        "v1",
        jurisdiction,
        "statute",
        ["patent"],
        locator,
        "",
        1,
        text,
        f"Source — {locator}",
    )
    r.signals = {"dense": 1, "lexical": 1}
    return r


CORPUS = {
    "IN": [hit(1, "IN", "s.3", "(p) an invention which, in effect, is traditional knowledge")],
    "INTL": [
        hit(2, "INTL", "Art. 27", "Members may also exclude from patentability plants and animals")
    ],
}


class FakeLLM:
    name, model = "groq", "fake"

    def answer_with_citations(self, system, question, documents):
        d = documents[0]
        quote = (
            "traditional knowledge" if d.chunk_id == "1" else "exclude from patentability plants"
        )
        return CitedAnswer(f"Per the source, {quote}.", [RawCitation(d.chunk_id, quote)], "fake")


def services():
    return Services(
        session_factory=lambda: _NullSession(),
        answer_llm=FakeLLM(),
        fast_llm=None,
        embedder=None,
        reranker=None,
        corpus_version="t",
    )


class _NullSession:
    def close(self):
        pass


def test_both_mode_streams_two_separate_panes(monkeypatch):
    monkeypatch.setattr(pipeline, "search", lambda s, q, j, *a, **k: CORPUS[j])
    events = list(
        run(
            AskRequest(question="Can I patent a traditional remedy?", jurisdiction_mode="BOTH"),
            services(),
        )
    )
    answers = [e.data for e in events if e.name == "answer"]
    assert [a.jurisdiction for a in answers] == ["IN", "INTL"]
    assert all(c.jurisdiction == a.jurisdiction for a in answers for c in a.citations)
    done = events[-1].data
    assert done.abstained is None and len(done.answers) == 2 and done.disclaimer


def test_medical_question_abstains_before_retrieval(monkeypatch):
    monkeypatch.setattr(
        pipeline, "search", lambda *a, **k: (_ for _ in ()).throw(AssertionError("searched"))
    )
    done = list(run(AskRequest(question="How much neem should I take daily?"), services()))[-1].data
    assert done.abstained.reason == "medical_advice" and done.answers == [] and done.disclaimer


def test_no_sources_means_insufficient_and_withheld(monkeypatch):
    monkeypatch.setattr(pipeline, "search", lambda *a, **k: [])
    done = list(
        run(AskRequest(question="Patent rules for moon rocks?", jurisdiction_mode="IN"), services())
    )[-1].data
    assert done.abstained.reason == "insufficient_sources"
    assert done.answers[0].citations == [] and "not enough" in done.answers[0].markdown


def test_cache_returns_same_envelope(monkeypatch):
    monkeypatch.setattr(pipeline, "search", lambda s, q, j, *a, **k: CORPUS[j])
    cache = AnswerCache()
    req = AskRequest(question="Can I patent a traditional remedy?", jurisdiction_mode="IN")
    first = list(run(req, services(), cache))[-1].data
    again = list(run(req, services(), cache))
    assert len(again) == 1 and again[0].data.id == first.id
