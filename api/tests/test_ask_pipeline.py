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


def test_regenerates_when_the_named_provision_is_not_cited(monkeypatch):
    """The question names s.3, the section was retrieved, but the answer cites the manual."""
    from app.ask.pipeline import missing_primary_citation
    from app.generate.answer import DraftAnswer
    from app.guardrails.verify import verify

    act = hit(1, "IN", "s.3", "(p) an invention which, in effect, is traditional knowledge")
    manual = hit(2, "IN", "p.98", "Traditional knowledge is not patentable, says the manual")
    manual.doc_type = "manual"
    draft = DraftAnswer(
        "IN",
        CitedAnswer(
            "Not patentable.", [RawCitation("2", "Traditional knowledge is not patentable")], "m"
        ),
        [act, manual],
    )
    checked = verify(draft)
    instruction = missing_primary_citation("What does section 3(p) say?", draft, checked)
    assert "s.3" in instruction

    # Citing the section itself needs no retry.
    ok = DraftAnswer(
        "IN",
        CitedAnswer(
            "Not patentable.",
            [RawCitation("1", "an invention which, in effect, is traditional knowledge")],
            "m",
        ),
        [act, manual],
    )
    assert missing_primary_citation("What does section 3(p) say?", ok, verify(ok)) == ""


def test_regenerates_when_only_guidance_is_cited(monkeypatch):
    from app.ask.pipeline import missing_primary_citation
    from app.generate.answer import DraftAnswer
    from app.guardrails.verify import verify

    act = hit(1, "IN", "s.3", "(j) plants and animals other than micro-organisms")
    manual = hit(2, "IN", "p.95", "Microorganisms may be patentable, says the manual")
    manual.doc_type = "manual"
    draft = DraftAnswer(
        "IN",
        CitedAnswer("Yes.", [RawCitation("2", "Microorganisms may be patentable")], "m"),
        [act, manual],
    )
    assert "law itself" in missing_primary_citation(
        "Can microbes be patented?", draft, verify(draft)
    )


class TooLargeOnceLLM(FakeLLM):
    """Rejects a request with many documents, the way Groq rejects an oversized prompt."""

    def __init__(self):
        self.sizes = []

    def answer_with_citations(self, system, question, documents):
        self.sizes.append(len(documents))
        if len(documents) > 4:
            raise RuntimeError("Error code: 413 - Request too large for model")
        return super().answer_with_citations(system, question, documents)


def test_oversized_request_is_retried_with_fewer_documents():
    llm = TooLargeOnceLLM()
    many = [
        hit(i, "IN", f"s.{i}", "(p) an invention which, in effect, is traditional knowledge")
        for i in range(1, 9)
    ]
    draft = pipeline._generate_within_limits(
        Services(lambda: _NullSession(), llm, None, None, None, "t"),
        "what is excluded?",
        "IN",
        many,
        "en",
        None,
    )
    assert llm.sizes == [8, 4]
    assert draft.answer.citations


def test_best_matches_are_named_in_the_prompt():
    from app.generate.answer import user_turn

    turn = user_turn("q", "IN", "en", None, ["Patents Act s.3"])
    assert "Patents Act s.3" in turn and "Search ranked" in turn
