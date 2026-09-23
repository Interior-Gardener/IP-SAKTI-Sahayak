"""The registries a user is sent to.

The first test is the one that matters: every registry's cite, and every form
it lists, is re-read from the chunk it names in corpus/normalised/. A form name
typed from memory — "Form TM-A", say, when the Trade Marks Rules are not in the
corpus — has no quote to match and fails here.
"""

import re

from fastapi.testclient import TestClient

from app.ingest.chunk import chunk_units
from app.ingest.manifest import REPO, load_manifest
from app.ingest.structure import parse_units
from app.main import app
from app.registry import REGISTRIES, seed_registries
from app.retrieval.hybrid import locator_matches


def _flat(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip()


_cache: dict[str, list] = {}


def _chunks(source_id: str):
    if source_id not in _cache:
        source = load_manifest().get(source_id)
        path = REPO / "corpus" / "normalised" / f"{source_id}.txt"
        units = parse_units(path.read_text(encoding="utf-8"), source.doc_type, source.language)
        _cache[source_id] = chunk_units(units, source.title)
    return _cache[source_id]


def _quoted_in(source_id: str, locator: str, quote: str) -> bool:
    return any(
        locator_matches(locator, c.locator) and _flat(quote) in _flat(c.text)
        for c in _chunks(source_id)
    )


def test_every_cite_and_every_form_is_in_the_corpus():
    ids = {s.id for s in load_manifest().sources}
    problems = []
    for r in REGISTRIES:
        if r.cite_source not in ids:
            problems.append(f"{r.id}: {r.cite_source} is not a manifest source")
        elif not _quoted_in(r.cite_source, r.cite_locator, r.cite_quote):
            problems.append(
                f"{r.id}: {r.cite_source} {r.cite_locator} does not say {r.cite_quote!r}"
            )
        for f in r.forms:
            if not _quoted_in(f.cite_source, f.cite_locator, f.quote):
                problems.append(
                    f"{r.id} {f.name}: {f.cite_source} {f.cite_locator} does not say {f.quote!r}"
                )
    assert not problems, "\n".join(problems)


def test_entries_are_complete_and_honest_about_gaps():
    assert len({r.id for r in REGISTRIES}) == len(REGISTRIES)
    for r in REGISTRIES:
        assert r.url.startswith("https://") and r.action
        # No listed form means the entry must say why, not stay silent.
        assert r.forms or r.forms_note, f"{r.id} lists no form and gives no reason"


def test_registry_route_serves_the_seed(db_session):
    counts = seed_registries(db_session)
    assert counts["registries"] == len(REGISTRIES)
    body = TestClient(app).get("/registry?regime=abs").json()
    nba = next(r for r in body if r["id"] == "in-nba")
    assert nba["cite_source_id"] == "in-bd-rules-2024" and nba["cite_locator"].startswith("Rule 13")
    assert [f["name"] for f in nba["forms"]] == ["Form 1", "Form 2"]
