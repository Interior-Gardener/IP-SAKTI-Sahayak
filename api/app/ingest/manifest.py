"""Schema for corpus/manifest.yaml. The manifest is the only way a document
enters the corpus, so it is validated strictly: unknown keys are errors."""

from datetime import date
from pathlib import Path
from typing import Literal

import yaml
from pydantic import BaseModel, ConfigDict, HttpUrl, model_validator

REPO = Path(__file__).resolve().parents[3]
MANIFEST = REPO / "corpus" / "manifest.yaml"

Regime = Literal[
    "patent", "gi", "trademark", "copyright", "design", "trade_secret", "pvp", "abs",
    "drug_licensing", "advertising", "labelling", "food", "cosmetic", "treaty",
    "market_access", "wildlife", "privacy",
]  # fmt: skip
DocType = Literal[
    "statute", "rules", "regulations", "regulation", "treaty", "manual", "guideline",
    "notification", "monograph", "registry_record", "case_law",
]  # fmt: skip


class ManifestSource(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    id: str
    title: str
    jurisdiction: Literal["IN", "INTL"]
    regime: list[Regime]
    doc_type: DocType
    issuer: str
    url: HttpUrl
    fetch_url: HttpUrl | None = None
    fetch: Literal["auto", "manual"]
    format: Literal["pdf", "html"]
    language: str = "en"
    licence: str
    version_label: str
    issued: date | None = None
    effective_from: date | None = None
    effective_to: date | None = None
    notes: str | None = None

    @model_validator(mode="after")
    def _check(self) -> "ManifestSource":
        prefix = "in-" if self.jurisdiction == "IN" else "intl-"
        if not self.id.startswith(prefix):
            raise ValueError(f"{self.id}: id must start with '{prefix}'")
        if self.fetch == "auto" and self.fetch_url is None:
            raise ValueError(f"{self.id}: fetch=auto needs fetch_url")
        if not self.regime:
            raise ValueError(f"{self.id}: at least one regime")
        return self

    def raw_path(self, root: Path = REPO) -> Path:
        return root / "corpus" / "raw" / f"{self.id}.{self.format}"


class Manifest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    version: int
    sources: list[ManifestSource]

    @model_validator(mode="after")
    def _unique(self) -> "Manifest":
        ids = [s.id for s in self.sources]
        dupes = {i for i in ids if ids.count(i) > 1}
        if dupes:
            raise ValueError(f"duplicate source ids: {sorted(dupes)}")
        return self

    def get(self, source_id: str) -> ManifestSource:
        for s in self.sources:
            if s.id == source_id:
                return s
        raise KeyError(source_id)


def load_manifest(path: Path = MANIFEST) -> Manifest:
    return Manifest.model_validate(yaml.safe_load(path.read_text(encoding="utf-8")))
