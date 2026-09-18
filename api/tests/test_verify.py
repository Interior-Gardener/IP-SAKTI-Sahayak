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


def test_quote_matching_tolerates_dash_variants_and_ellipses_only():
    from app.guardrails.verify import quote_in

    src = "(a) Provide for legal certainty, clarity and transparency of their domestic access\nand benefit-sharing legislation or regulatory requirements;"
    assert quote_in("domestic access and benefit\u2011sharing legislation", src)
    assert quote_in(
        "...Provide for legal certainty, clarity and transparency…regulatory requirements", src
    )
    assert not quote_in("Provide for legal certainty … mandatory patent disclosure", src)
    assert not quote_in("...", src)
    assert not quote_in("sharing", src)  # too short to count as evidence


def test_correct_quote_on_wrong_chunk_is_moved():
    d = draft("TK is barred.", [("2", "an invention which, in effect, is traditional knowledge")])
    v = verify(d)
    assert [(c.locator, c.verified) for c in v.citations] == [("s.3", True)]
    assert not any("not found" in f for f in v.flags)


def test_ellipsis_fragments_must_all_be_present_in_order():
    from app.guardrails.verify import quote_in

    src = "Serial number Category of drug Safety study (A) Classical formulation As per text Not Required"
    assert quote_in("Serial number…Category of drug…As per text", src)
    assert not quote_in(
        "Serial number…Category of drug…Required by law", src
    )  # a fragment is invented
    assert not quote_in("As per text…Serial number", src)  # out of order
    assert not quote_in("(A)…As per text…Not", src)  # nothing long enough to be evidence


def test_long_chunk_keeps_its_last_clauses_and_is_labelled():
    from app.generate.answer import shorten, to_documents

    section = (
        "3. What are not inventions.—"
        + ("(a) filler clause text. " * 200)
        + "(p) an invention which, in effect, is traditional knowledge."
    )
    cut = shorten(section, 1000)
    assert cut.startswith("3. What are not inventions")
    assert cut.endswith("is traditional knowledge.")  # the tail survives the trim
    assert "[…]" in cut and len(cut) < len(section)
    assert to_documents([S3])[0].title.endswith("[primary law]")


def test_best_primary_law_hits_always_reach_the_model():
    from app.generate.answer import select_documents

    def hit(cid, doc_type, rank):
        h = chunk(cid, f"s.{cid}", "text " * 20)
        h.doc_type = doc_type
        h.signals = {"dense": rank}
        return h

    # Six guidance hits rank above the statute, which lands 7th.
    guidance = [hit(i, "manual", i) for i in range(1, 7)]
    statute = hit(9, "statute", 7)
    chosen = select_documents([*guidance, statute], top_k=6)
    assert statute in chosen
    assert chosen[0].doc_type == "statute"  # primary law is shown first
    assert len(chosen) == 6
