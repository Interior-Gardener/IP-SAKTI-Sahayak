"""Wire contracts shared with the web app (see docs/architecture.md §5).

`npm run gen:api` turns these into `src/types/sahayak.ts`, so a change here
is a change to the web's types too.
"""

from typing import Literal

from pydantic import BaseModel, Field

Jurisdiction = Literal["IN", "INTL"]
JurisdictionMode = Literal["IN", "INTL", "BOTH"]
Persona = Literal["practitioner", "researcher", "startup", "cultivator"]
MaterialKind = Literal["plant", "microbe", "animal", "mineral"]
Unknown = Literal["unknown"]

DISCLAIMER = (
    "This is information, not legal advice. Verify with the cited source or a "
    "qualified IP facilitator before acting on it."
)


class Citation(BaseModel):
    source_id: str
    source_title: str
    version_label: str
    locator: str = Field(description="e.g. 's.3(p)', 'Rule 158B(1)(b)', 'Art. 27.3(b)'")
    cited_text: str
    url: str
    jurisdiction: Jurisdiction
    doc_type: str
    verified: bool


class Confidence(BaseModel):
    score: float = Field(ge=0, le=1)
    band: Literal["high", "medium", "low"]
    reasons: list[str] = []


class JurisdictionAnswer(BaseModel):
    """One pane. Answers for different jurisdictions are never merged."""

    jurisdiction: Jurisdiction
    markdown: str
    citations: list[Citation]
    confidence: Confidence


class Abstention(BaseModel):
    reason: Literal["out_of_scope", "insufficient_sources", "medical_advice", "unsafe"]
    suggestion: str


class RegistryPointer(BaseModel):
    registry: str
    action: str
    form: str | None = None
    url: str
    fee_note: str | None = None
    cite: Citation


class Escalation(BaseModel):
    available: Literal[True] = True
    ticket_id: str | None = None


class ProviderInfo(BaseModel):
    name: Literal["anthropic", "groq"]
    model: str


class SahayakAnswer(BaseModel):
    id: str
    question: str
    language: str = Field(description="BCP-47, e.g. 'hi', 'mr', 'ta', 'en'")
    persona: Persona | None = None
    jurisdiction_mode: JurisdictionMode
    answers: list[JurisdictionAnswer]
    abstained: Abstention | None = None
    # Shapes are fixed in stage 2 when /classify and /abs land.
    classification: dict | None = None
    abs: dict | None = None
    next_steps: list[RegistryPointer] = []
    escalation: Escalation = Escalation()
    provider: ProviderInfo
    disclaimer: str = DISCLAIMER


# --- Source-material IP profile. Every legal value carries a cite id into
# corpus/manifest.yaml or is 'unknown'; nothing is asserted without one. ---


class TraditionalKnowledge(BaseModel):
    tkdl: Literal["documented", "unknown"]
    classicalTexts: list[str] = []
    cite: str


class Patentability(BaseModel):
    note: str
    cites: list[str] = []


class LandmarkPatent(BaseModel):
    title: str
    number: str
    office: str
    outcome: str
    year: int
    cite: str


class PatentSearch(BaseModel):
    inpass: str
    patentscope: str
    googlePatents: str


class Patents(BaseModel):
    landmark: list[LandmarkPatent] = []
    search: PatentSearch


class Deposit(BaseModel):
    budapest: bool
    indianIDAs: list[str] = []
    cite: str


class GITag(BaseModel):
    name: str
    regNo: str
    cite: str


class GI(BaseModel):
    tags: list[GITag] = []


class Biodiversity(BaseModel):
    indianBioResource: bool
    normallyTradedCommodity: bool | Unknown
    cites: list[str] = []


class Wildlife(BaseModel):
    protectedSchedule: str | None = None
    citesListed: bool | Unknown | None = None
    cites: list[str] = []


class Export(BaseModel):
    restricted: bool | Unknown
    cite: str


class DrugSchedules(BaseModel):
    scheduleE1: bool | Unknown
    heavyMetalTesting: bool | None = None
    cite: str


class ApiMonograph(BaseModel):
    volume: str
    part: str


class Monographs(BaseModel):
    api: ApiMonograph | None = None
    cite: str


class MaterialIPProfile(BaseModel):
    """`cite` fields hold a manifest source id, or 'unknown' when unverified."""

    kind: MaterialKind
    tk: TraditionalKnowledge
    patentability: Patentability
    patents: Patents
    deposit: Deposit | None = None
    gi: GI
    biodiversity: Biodiversity
    wildlife: Wildlife | None = None
    export: Export
    drugSchedules: DrugSchedules
    monographs: Monographs
    lastVerified: str = Field(description="ISO date")


CONTRACTS = (SahayakAnswer, RegistryPointer, MaterialIPProfile)
