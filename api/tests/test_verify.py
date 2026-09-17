from app.generate.answer import DraftAnswer, generate, user_turn
from app.guardrails.verify import provisions_in, score_confidence, verify
from app.llm.base import CitedAnswer, RawCitation
from app.retrieval.hybrid import Retrieved


def chunk(cid, locator, text, jurisdiction="IN", signals=None):
    r = Retrieved(
        cid,
        "in-patents-act-1970",
        "The Patents Act, 1970",
        "https://indiacode.gov.in/items/x",
        "India Code consolidated text",
        jurisdiction,
        "statute",
        ["patent"],
        locator,
        "",
        12,
        text,
        f"The Patents Act, 1970 — {locator}",
    )
    r.signals = signals or {"dense": 1, "lexical": 2}
    return r


S3 = chunk(
    1,
    "s.3",
    "(p) an invention which, in effect, is traditional knowledge or which is an aggregation",
)
S10 = chunk(
    2, "s.10", "Every specification, whether provisional or complete, shall describe the invention"
)


def draft(markdown, cites, retrieved=(S3, S10)):
    return DraftAnswer(
        "IN", CitedAnswer(markdown, [RawCitation(c, t) for c, t in cites], "m"), list(retrieved)
    )


def test_good_answer_verifies_with_high_confidence():
    d = draft(
        "Traditional knowledge is not an invention under section 3(p).",
        [("1", "an invention which, in effect, is traditional knowledge")],
    )
    v = verify(d)
    assert v.flags == [] and [c.verified for c in v.citations] == [True]
    assert v.citations[0].locator == "s.3"
    conf = score_confidence(v, d)
    assert conf.band == "high"


def test_fabricated_quote_and_section_are_flagged():
    d = draft(
        "Under section 3(z) all herbal inventions are barred.",
        [("1", "all herbal inventions are barred")],
    )
    v = verify(d)
    assert [c.verified for c in v.citations] == [False]
    assert any("provision 3" not in f and "quoted text not found" in f for f in v.flags)
    assert score_confidence(v, d).score < 0.25


def test_unbacked_provision_is_flagged():
    d = draft("Rule 158B requires a licence.", [("1", "traditional knowledge")])
    assert any("158B" in f for f in verify(d).flags)


def test_other_jurisdiction_law_in_india_pane_is_a_leak():
    d = draft(
        "Traditional knowledge is excluded, and TRIPS agrees.",
        [("1", "an invention which, in effect, is traditional knowledge")],
    )
    v = verify(d)
    assert v.leaked and any("TRIPS" in f for f in v.flags)


def test_foreign_name_is_fine_when_the_cited_indian_text_mentions_it():
    pct = chunk(
        3,
        "s.7",
        "an international application under the Patent Cooperation Treaty designating India",
    )
    d = draft(
        "An application under the PCT designating India counts.",
        [("3", "international application under the Patent Cooperation Treaty")],
        retrieved=(pct,),
    )
    assert not verify(d).leaked


def test_uncited_legal_assertion():
    d = draft("You must obtain approval before filing.", [])
    assert "states legal rules without any verified citation" in verify(d).flags


def test_provisions_in():
    assert provisions_in("section 3(p), Rule 158B(1)(b) and Article 27.3(b)") == {"3", "158B", "27"}


class EchoProvider:
    def answer_with_citations(self, system, question, documents):
        self.system, self.question, self.documents = system, question, documents
        return CitedAnswer("ok", [], "m")


def test_generate_keeps_varying_parts_out_of_system_prompt():
    p = EchoProvider()
    generate(p, "Can I patent Triphala?", "IN", [S3], language="hi", persona="startup")
    first_system = p.system
    generate(p, "Other question", "INTL", [S10], language="en")
    assert p.system == first_system  # frozen, cacheable
    assert "Hindi" in user_turn("q", "IN", "hi", None) and p.documents[0].chunk_id == "2"


def test_brackets_in_quote_do_not_fail_verification():
    d = draft(
        "TK is barred.", [("1", "(p) an invention which, in effect, is traditional knowledge]")]
    )
    assert [c.verified for c in verify(d).citations] == [True]
