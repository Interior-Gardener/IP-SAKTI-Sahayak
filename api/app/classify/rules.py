"""Formulation classification (PLAN.md, "Routing across IP types and the classification flow")
and the ABS helper.

The branch is decided by this table, never by a model: first matching category wins.
Every requirement and posture line carries a citation (manifest source id + locator).
`verified=True` means a script found the point in that chunk of the ingested corpus on
the date in VERIFIED_ON; `verified=False` means the source is right but the exact
provision still has to be checked, and the UI must show it as "verify", not as a fact.
A legal correction is a one-line change here.
"""

from typing import Literal

from pydantic import BaseModel

VERIFIED_ON = "2026-09-17"

Category = Literal[
    "cosmetic", "ayurveda_aahar", "classical", "patent_proprietary", "phytopharmaceutical", "new_drug"
]  # fmt: skip


class Cite(BaseModel):
    source_id: str
    locator: str
    verified: bool


class Line(BaseModel):
    text: str
    cite: Cite


class Question(BaseModel):
    id: str
    text: str
    help: str = ""


def c(source_id: str, locator: str, verified: bool) -> Cite:
    return Cite(source_id=source_id, locator=locator, verified=verified)


# ------------------------------------------------------------------ questions

CATEGORY_QUESTIONS: list[Question] = [
    Question(id="external_no_claim", text="Is the product only applied externally to cleanse or beautify, with no therapeutic claim?"),
    Question(id="food_positioning", text="Is it taken by mouth and sold as a food, with health (not disease) claims?"),
    Question(id="exact_classical", text="Are both the formula and the method of preparation exactly as in an authoritative classical text?",
             help="The books listed in the First Schedule of the Drugs and Cosmetics Act."),
    Question(id="classical_ingredients", text="Are all ingredients from those classical texts, but combined, proportioned or formulated in a new way?"),
    Question(id="standardised_fraction", text="Is the active a purified, standardised fraction of a plant with defined bio-active markers?"),
]  # fmt: skip

ABS_QUESTIONS: list[Question] = [
    Question(id="foreign", text="Is the applicant a foreigner, a non-resident, or a company with foreign participation?"),
    Question(id="indian_bioresource", text="Does the product use a biological resource (plant, microbe or animal) obtained from India, or knowledge associated with it?"),
    Question(id="normally_traded", text="Is that resource notified as a normally traded commodity or a cultivated medicinal plant?"),
    Question(id="patent_intended", text="Do you intend to apply for a patent or other IP right on an invention based on it?"),
]  # fmt: skip


# ------------------------------------------------------------------ categories


class CategoryRule(BaseModel):
    category: Category
    label: str
    when: str  # question id that selects it; "" = the fallback
    requires: list[Line]
    ip_posture: list[Line]


TK_BAR = Line(
    text="Traditional knowledge, or aggregation or duplication of known properties of traditionally known components, is not an invention.",
    cite=c("in-patents-act-1970", "s.3(p)", True),
)
INVENTION = Line(
    text="An invention is a new product or process involving an inventive step and capable of industrial application.",
    cite=c("in-patents-act-1970", "s.2(1)(j)", True),
)
TRADE_MARK = Line(
    text="A brand name can be protected as a trade mark if it is distinctive and not merely descriptive.",
    cite=c("in-trade-marks-act-1999", "s.9", True),
)
TRADE_SECRET = Line(
    text="Undisclosed information (such as a secret formula) is protected under TRIPS. The corpus has no Indian statute on trade secrets; ask a facilitator how it is protected in India.",
    cite=c("intl-trips", "Art. 39", True),
)

RULES: list[CategoryRule] = [
    CategoryRule(
        category="cosmetic", label="Cosmetic", when="external_no_claim",
        requires=[
            Line(text="\"Cosmetic\" is defined in the Drugs and Cosmetics Act; confirm the product fits the definition.",
                 cite=c("in-dc-act-1940", "s.3(aaa)", True)),
            Line(text="Manufacture and labelling follow the Cosmetics Rules, 2020.", cite=c("in-cosmetics-rules-2020", "Rule 3", False)),
        ],
        ip_posture=[TRADE_MARK, TRADE_SECRET],
    ),
    CategoryRule(
        category="ayurveda_aahar", label="Ayurveda Aahara / nutraceutical food", when="food_positioning",
        requires=[
            Line(text="Foods for special dietary use, functional foods, nutraceuticals and health supplements are regulated under section 22 of the Food Safety and Standards Act.",
                 cite=c("in-fss-act-2006", "s.22", True)),
            Line(text="Ayurveda Aahara must be formulated in line with the categories and requirements in Schedule B of the Ayurveda Aahara Regulations, 2022.",
                 cite=c("in-fssai-ayurveda-aahara-2022", "Reg. 3", True)),
            Line(text="Its labelling, presentation and advertisement must not claim that it prevents, treats or cures a human disease.",
                 cite=c("in-fssai-ayurveda-aahara-2022", "Reg. 8", True)),
        ],
        ip_posture=[TRADE_MARK, TRADE_SECRET],
    ),
    CategoryRule(
        category="classical", label="Classical (generic) Ayurvedic medicine", when="exact_classical",
        requires=[
            Line(text="An Ayurvedic drug made exactly per the authoritative books in the First Schedule falls under the Act's definition of Ayurvedic drug.",
                 cite=c("in-dc-act-1940", "s.3(a)", False)),
            Line(text="A manufacturing licence under the ASU drug rules is needed (Rule 158B guidelines); verify the evidence required for this category.",
                 cite=c("in-dc-rules-1945", "Rule 158B", False)),
            Line(text="Manufacture must meet Good Manufacturing Practices under Schedule T.", cite=c("in-dc-rules-1945", "Rule 157", True)),
            Line(text="The label must list all ingredients with botanical names.", cite=c("in-dc-rules-1945", "Rule 161", True)),
        ],
        ip_posture=[TK_BAR, TRADE_MARK],
    ),
    CategoryRule(
        category="patent_proprietary", label="Patent or proprietary Ayurvedic medicine", when="classical_ingredients",
        requires=[
            Line(text="\"Patent or proprietary medicine\" means formulations containing only ingredients mentioned in the formulae of the authoritative books in the First Schedule, subject to the exclusions in the definition.",
                 cite=c("in-dc-act-1940", "s.3(h)", True)),
            Line(text="Licensing follows the Rule 158B guidelines; verify the proof-of-effectiveness requirement.",
                 cite=c("in-dc-rules-1945", "Rule 158B", False)),
            Line(text="Manufacture must meet Good Manufacturing Practices under Schedule T.", cite=c("in-dc-rules-1945", "Rule 157", True)),
        ],
        ip_posture=[INVENTION, TK_BAR, TRADE_MARK, TRADE_SECRET],
    ),
    CategoryRule(
        category="phytopharmaceutical", label="Phytopharmaceutical drug", when="standardised_fraction",
        requires=[
            Line(text="A phytopharmaceutical drug not used in India to a significant extent is a \"new drug\" under the New Drugs and Clinical Trials Rules.",
                 cite=c("in-ndct-rules-2019", "Rule 2(1)(w)", True)),
            Line(text="Approval by the Central Licencing Authority with clinical data is required; verify the specific data requirements.",
                 cite=c("in-ndct-rules-2019", "Rule 2", False)),
        ],
        ip_posture=[INVENTION, TK_BAR, TRADE_MARK],
    ),
    CategoryRule(
        category="new_drug", label="New or non-classical drug", when="",
        requires=[
            Line(text="A drug, including a phytopharmaceutical drug, not used in India to any significant extent is a \"new drug\".",
                 cite=c("in-ndct-rules-2019", "Rule 2(1)(w)", True)),
            Line(text="A new drug needs permission from the Central Licencing Authority; verify the safety and effectiveness data required.",
                 cite=c("in-ndct-rules-2019", "Rule 2", False)),
        ],
        ip_posture=[INVENTION, TK_BAR, TRADE_MARK],
    ),
]  # fmt: skip


class ClassifyRequest(BaseModel):
    answers: dict[str, bool] = {}


class ClassificationResult(BaseModel):
    category: Category
    label: str
    requires: list[Line]
    ip_posture: list[Line]
    decided_by: str
    verified_on: str = VERIFIED_ON
    disclaimer: str = (
        "This classification is information, not legal advice. Lines marked 'verify' point at "
        "the right law but the exact provision has not been checked yet."
    )


class ClassifyStep(BaseModel):
    next_question: Question | None = None
    result: ClassificationResult | None = None
    asked: int


def classify(req: ClassifyRequest) -> ClassifyStep:
    """Ask the category questions in order; stop at the first 'yes'. All 'no' = new drug."""
    for i, q in enumerate(CATEGORY_QUESTIONS):
        if q.id not in req.answers:
            return ClassifyStep(next_question=q, asked=i)
        if req.answers[q.id]:
            rule = next(r for r in RULES if r.when == q.id)
            return ClassifyStep(result=_result(rule, q.id), asked=i + 1)
    rule = next(r for r in RULES if r.when == "")
    return ClassifyStep(result=_result(rule, "all answers no"), asked=len(CATEGORY_QUESTIONS))


def _result(rule: CategoryRule, decided_by: str) -> ClassificationResult:
    return ClassificationResult(
        category=rule.category, label=rule.label, requires=rule.requires,
        ip_posture=rule.ip_posture, decided_by=decided_by,
    )  # fmt: skip


# ------------------------------------------------------------------ ABS helper


class AbsResult(BaseModel):
    route: Literal["nba_approval", "sbb_intimation", "exempt_check", "not_applicable"]
    summary: str
    steps: list[Line]
    ip_approval_needed: bool
    verified_on: str = VERIFIED_ON


class AbsStep(BaseModel):
    next_question: Question | None = None
    result: AbsResult | None = None


def abs_check(req: ClassifyRequest) -> AbsStep:
    a = req.answers
    for q in ABS_QUESTIONS:
        if q.id not in a:
            # Later questions only matter once a biological resource is involved.
            if (
                q.id in ("normally_traded", "patent_intended")
                and a.get("indian_bioresource") is False
            ):
                continue
            return AbsStep(next_question=q)

    if not a.get("indian_bioresource"):
        return AbsStep(result=AbsResult(
            route="not_applicable", ip_approval_needed=False,
            summary="No biological resource or associated knowledge from India is used, so the Biological Diversity Act's access rules do not appear to apply.",
            steps=[Line(text="Access rules attach to biological resources occurring in India and associated knowledge.",
                        cite=c("in-bd-act-2002", "s.3", True))],
        ))  # fmt: skip

    steps: list[Line] = []
    if a.get("normally_traded"):
        steps.append(Line(
            text="The Act does not apply to biological resources normally traded as commodities, or to cultivated medicinal plants and their products, as notified. Check the current notification before relying on this.",
            cite=c("in-bd-act-2002", "s.40", True),
        ))  # fmt: skip

    if a.get("foreign"):
        route = "nba_approval"
        steps.append(Line(
            text="Persons listed in section 3(2) need previous approval of the National Biodiversity Authority to obtain the resource or associated knowledge for research or commercial use.",
            cite=c("in-bd-act-2002", "s.3", True),
        ))  # fmt: skip
        summary = "Approval from the National Biodiversity Authority is needed before access."
    else:
        route = "sbb_intimation"
        steps.append(Line(
            text="Indian persons and entities give prior intimation to the State Biodiversity Board before obtaining a biological resource for commercial utilisation (with the exemptions in the section).",
            cite=c("in-bd-act-2002", "s.7", True),
        ))  # fmt: skip
        summary = "Prior intimation to the State Biodiversity Board is needed for commercial use."

    if a.get("normally_traded"):
        route = "exempt_check"
        summary = (
            "The resource may be exempt as a notified normally traded commodity; confirm it is on the notification, otherwise: "
            + summary
        )

    ip = bool(a.get("patent_intended"))
    if ip:
        steps.append(Line(
            text="Before applying for an IP right in or outside India on an invention based on the resource or associated knowledge, prior approval of the National Biodiversity Authority is required.",
            cite=c("in-bd-act-2002", "s.6", True),
        ))  # fmt: skip
    steps.append(Line(
        text="Forms, fees and benefit-sharing percentages are set by the Biological Diversity Rules, 2024; verify the current rule before filing.",
        cite=c("in-bd-rules-2024", "Rule 15", False),
    ))  # fmt: skip
    return AbsStep(
        result=AbsResult(route=route, summary=summary, steps=steps, ip_approval_needed=ip)
    )
