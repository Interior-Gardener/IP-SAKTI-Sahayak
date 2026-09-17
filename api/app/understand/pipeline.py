"""Step 2 of /ask: work out what the question is about before retrieving.

- language: from script, or the language the user picked
- translation: questions not in English are translated for retrieval (the corpus
  is English); the original is kept and the answer is written in the user's language.
  Bhashini NMT replaces the LLM translation in stage 3.
- routing: regimes, material kinds and whether classification / ABS help is needed,
  from the fast model, with a keyword fallback so routing never blocks an answer
- statutes named in the question, linked to manifest ids
- one rewrite of the question into search terms
"""

import re
from dataclasses import dataclass, field

from pydantic import BaseModel, Field

from app.ingest.manifest import Regime, load_manifest
from app.llm.base import LLMProvider

SCRIPTS = [
    (re.compile(r"[஀-௿]"), "ta"),
    (re.compile(r"[ఀ-౿]"), "te"),
    (re.compile(r"[ಀ-೿]"), "kn"),
    (re.compile(r"[ঀ-৿]"), "bn"),
    (re.compile(r"[઀-૿]"), "gu"),
    (re.compile(r"[ऀ-ॿ]"), "hi"),  # also Marathi; the picker disambiguates
]

KEYWORD_REGIMES: dict[str, list[str]] = {
    "patent": ["patent", "invention", "prior art", "tkdl", "3(p)", "novelty", "pct"],
    "gi": ["geographical indication", " gi ", "gi tag", "gi registry"],
    "trademark": ["trade mark", "trademark", "brand", "logo name"],
    "copyright": ["copyright", "book", "text of", "manuscript"],
    "design": ["design registration", "packaging design", "industrial design"],
    "trade_secret": ["trade secret", "confidential", "secret formula", "know-how"],
    "pvp": ["plant variety", "farmers' rights", "farmers rights", "ppvfr", "seed variety"],
    "abs": ["biodiversity", "benefit sharing", "nba", "state biodiversity board", "nagoya",
            "access and benefit", "biological resource"],
    "drug_licensing": ["licence", "license", "classical", "proprietary", "ayush", "asu drug",
                       "phytopharmaceutical", "new drug", "clinical trial", "rule 158"],
    "advertising": ["advertis", "claim", "magic remed", "promotion"],
    "labelling": ["label", "packaging", "pack"],
    "food": ["fssai", "aahar", "nutraceutical", "food", "supplement"],
    "cosmetic": ["cosmetic", "skin care", "shampoo", "soap"],
    "treaty": ["trips", "treaty", "wipo", "convention", "gratk", "budapest"],
    "market_access": ["export", "eu ", "europe", "usfda", "fda", "canada", "australia", "uk "],
    "wildlife": ["wildlife", "cites", "musk", "animal part", "coral", "shankha"],
}  # fmt: skip
MATERIAL_WORDS = {
    "microbe": ["microbe", "micro-organism", "microorganism", "bacteria", "yeast", "strain",
                "ferment", "probiotic", "fungus", "culture"],
    "animal": ["honey", "ghee", "milk", "pearl", "conch", "coral", "musk", "animal", "shilajit"],
    "mineral": ["bhasma", "mineral", "metal", "mercury", "gold", "iron", "mica", "rasa"],
    "plant": ["plant", "herb", "leaf", "root", "bark", "seed", "flower", "fruit", "extract"],
}  # fmt: skip


def detect_language(text: str, chosen: str | None = None) -> str:
    if chosen and chosen != "auto":
        return chosen
    for rx, code in SCRIPTS:
        if len(rx.findall(text)) >= 3:
            return code
    return "en"


class Routing(BaseModel):
    regimes: list[Regime] = Field(description="IP or regulatory regimes the question touches")
    material_kinds: list[str] = Field(description="subset of plant, microbe, animal, mineral")
    needs_classification: bool = Field(
        description="true if the answer depends on classifying a formulation "
        "(classical, proprietary, new drug, phytopharmaceutical, food, cosmetic)"
    )
    needs_abs: bool = Field(description="true if biodiversity access/benefit-sharing applies")
    search_query: str = Field(description="the question rewritten as English search terms")


ROUTER_SYSTEM = (
    "You route questions for an assistant on IP and regulatory law for Ayurvedic and related "
    "products. Tag only regimes the question actually touches. Rewrite the question as a "
    "short English search query that keeps statute names and section numbers."
)
TRANSLATE_SYSTEM = (
    "Translate the user's question into English for a legal search. Keep names of laws, "
    "section numbers, plant and product names exactly. Reply with the translation only."
)


@dataclass
class Understanding:
    question: str
    language: str
    english: str
    search_query: str
    regimes: list[str]
    material_kinds: list[str]
    needs_classification: bool
    needs_abs: bool
    statutes: list[str] = field(default_factory=list)
    notes: list[str] = field(default_factory=list)


def keyword_routing(english: str) -> Routing:
    low = f" {english.lower()} "
    regimes = [r for r, words in KEYWORD_REGIMES.items() if any(w in low for w in words)]
    kinds = [k for k, words in MATERIAL_WORDS.items() if any(w in low for w in words)]
    return Routing(
        regimes=regimes,
        material_kinds=kinds,
        needs_classification="drug_licensing" in regimes,
        needs_abs="abs" in regimes,
        search_query=english,
    )


def link_statutes(english: str) -> list[str]:
    """Manifest ids whose short title ("Patents Act", "Biological Diversity Act") appears."""
    low = english.lower()
    found = []
    for s in load_manifest().sources:
        short = re.sub(r"^the\s+|,?\s*\d{4}$|\s*\(.*?\)", "", s.title, flags=re.IGNORECASE).lower()
        if len(short) > 6 and short in low:
            found.append(s.id)
    return found


def understand(
    question: str, fast: LLMProvider | None, language: str | None = None
) -> Understanding:
    lang = detect_language(question, language)
    notes: list[str] = []
    english = question
    if lang != "en" and fast is not None:
        try:
            english = fast.complete(TRANSLATE_SYSTEM, question, max_tokens=400).strip() or question
        except Exception:  # noqa: BLE001
            notes.append("translation unavailable; searched with the original text")

    routing = None
    if fast is not None:
        try:
            routing = fast.complete_structured(ROUTER_SYSTEM, english, Routing)
        except Exception:  # noqa: BLE001
            notes.append("router unavailable; used keyword routing")
    routing = routing or keyword_routing(english)

    return Understanding(
        question=question,
        language=lang,
        english=english,
        search_query=routing.search_query or english,
        regimes=list(routing.regimes),
        material_kinds=[k for k in routing.material_kinds if k in MATERIAL_WORDS],
        needs_classification=routing.needs_classification,
        needs_abs=routing.needs_abs,
        statutes=link_statutes(english),
        notes=notes,
    )
