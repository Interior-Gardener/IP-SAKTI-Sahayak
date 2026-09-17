import pytest
from pydantic import ValidationError

from app.ingest.manifest import Manifest, load_manifest


def test_repo_manifest_is_valid():
    m = load_manifest()
    assert len(m.sources) >= 30
    assert {s.jurisdiction for s in m.sources} == {"IN", "INTL"}


BASE = {
    "id": "in-x",
    "title": "X",
    "jurisdiction": "IN",
    "regime": ["patent"],
    "doc_type": "statute",
    "issuer": "Y",
    "url": "https://example.gov.in/x",
    "fetch": "manual",
    "format": "pdf",
    "licence": "Z",
    "version_label": "v",
}


def test_rejects_auto_without_fetch_url():
    with pytest.raises(ValidationError):
        Manifest.model_validate({"version": 1, "sources": [{**BASE, "fetch": "auto"}]})


def test_rejects_wrong_prefix_and_duplicates():
    with pytest.raises(ValidationError):
        Manifest.model_validate({"version": 1, "sources": [{**BASE, "jurisdiction": "INTL"}]})
    with pytest.raises(ValidationError):
        Manifest.model_validate({"version": 1, "sources": [BASE, BASE]})


def test_rejects_unknown_keys():
    with pytest.raises(ValidationError):
        Manifest.model_validate({"version": 1, "sources": [{**BASE, "sha": "abc"}]})
