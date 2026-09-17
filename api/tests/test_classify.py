import pytest

from app.classify.rules import RULES, ClassifyRequest, abs_check, classify
from app.ingest.manifest import load_manifest


def run(answers):
    return classify(ClassifyRequest(answers=answers))


def test_asks_questions_in_order_until_a_yes():
    assert run({}).next_question.id == "external_no_claim"
    assert run({"external_no_claim": False}).next_question.id == "food_positioning"
    r = run({"external_no_claim": False, "food_positioning": False, "exact_classical": True}).result
    assert r.category == "classical"
    assert any(line.cite.locator == "s.3(p)" for line in r.ip_posture)


@pytest.mark.parametrize(
    ("yes", "category"),
    [("external_no_claim", "cosmetic"), ("food_positioning", "ayurveda_aahar"),
     ("classical_ingredients", "patent_proprietary"), ("standardised_fraction", "phytopharmaceutical")],
)  # fmt: skip
def test_each_branch(yes, category):
    order = [
        "external_no_claim",
        "food_positioning",
        "exact_classical",
        "classical_ingredients",
        "standardised_fraction",
    ]
    answers = {q: False for q in order[: order.index(yes)]} | {yes: True}
    assert run(answers).result.category == category


def test_all_no_is_new_drug():
    order = [
        "external_no_claim",
        "food_positioning",
        "exact_classical",
        "classical_ingredients",
        "standardised_fraction",
    ]
    assert run({q: False for q in order}).result.category == "new_drug"


def test_every_cite_points_at_a_manifest_source():
    ids = {s.id for s in load_manifest().sources}
    for rule in RULES:
        for line in rule.requires + rule.ip_posture:
            assert line.cite.source_id in ids, line.cite


def test_abs_routes():
    q = abs_check(ClassifyRequest(answers={}))
    assert q.next_question.id == "foreign"
    none = abs_check(ClassifyRequest(answers={"foreign": True, "indian_bioresource": False})).result
    assert none.route == "not_applicable"
    foreign = abs_check(
        ClassifyRequest(
            answers={
                "foreign": True,
                "indian_bioresource": True,
                "normally_traded": False,
                "patent_intended": True,
            }
        )
    ).result
    assert foreign.route == "nba_approval" and foreign.ip_approval_needed
    assert {s.cite.locator for s in foreign.steps} >= {"s.3", "s.6"}
    indian = abs_check(
        ClassifyRequest(
            answers={
                "foreign": False,
                "indian_bioresource": True,
                "normally_traded": False,
                "patent_intended": False,
            }
        )
    ).result
    assert indian.route == "sbb_intimation" and "s.7" in {s.cite.locator for s in indian.steps}
