"""The knowledge graph.

The important test here is the first one: every edge that asserts a legal
relation is re-read out of the corpus text. An edge is a claim about the law,
and a claim about the law that points at a provision which is not there is the
thing this project must never ship.

The rest need Postgres and skip without it (CI runs one).
"""

import pytest
from sqlalchemy import text as sql_text

from app.graph.expand import edges_for, graph_chunks, link_entities, linked_entities, neighbourhood
from app.graph.seed import EDGES, entities, seed_graph
from app.ingest.chunk import chunk_units
from app.ingest.manifest import REPO, load_manifest
from app.ingest.structure import parse_units
from app.retrieval.hybrid import locator_matches


def _locators(source_id: str) -> list[str]:
    """What the chunker calls the pieces of a source, straight from the text."""
    source = load_manifest().get(source_id)
    path = REPO / "corpus" / "normalised" / f"{source_id}.txt"
    units = parse_units(path.read_text(encoding="utf-8"), source.doc_type, source.language)
    return [c.locator for c in chunk_units(units, source.title)]


def test_every_edge_cites_a_provision_that_is_in_the_corpus():
    manifest_ids = {s.id for s in load_manifest().sources}
    cached: dict[str, list[str]] = {}
    problems = []
    for edge in EDGES:
        if edge.cite_source is None:
            # Only a structural edge (X belongs to regime Y) may go uncited.
            if edge.predicate != "belongs_to_regime":
                problems.append(f"{edge.subject} -{edge.predicate}-> {edge.obj}: no citation")
            continue
        if edge.cite_source not in manifest_ids:
            problems.append(f"{edge.subject}: '{edge.cite_source}' is not a manifest source id")
            continue
        if edge.cite_locator is None:
            continue  # points at the source as a whole
        locators = cached.setdefault(edge.cite_source, _locators(edge.cite_source))
        if not any(locator_matches(edge.cite_locator, actual) for actual in locators):
            problems.append(
                f"{edge.subject} -{edge.predicate}-> {edge.obj}: "
                f"{edge.cite_source} has no chunk matching {edge.cite_locator!r}"
            )
    assert not problems, "\n".join(problems)


def test_every_edge_names_entities_that_exist():
    refs = {e.ref for e in entities()}
    for edge in EDGES:
        assert edge.subject in refs, f"unknown subject {edge.subject}"
        assert edge.obj in refs, f"unknown object {edge.obj}"


def test_alias_linking_is_by_word_not_by_substring():
    class FakeEntity:
        def __init__(self, kind, key, aliases):
            self.kind, self.key, self.aliases = kind, key, aliases

    microbe = FakeEntity("concept", "micro-organism", ["culture", "strain"])
    mineral = FakeEntity("concept", "mineral", ["mercury"])
    pool = [microbe, mineral]

    assert link_entities("Do I deposit the culture?", pool) == ["concept:micro-organism"]
    # "agriculture" contains "culture" and must not reach the microbe entity.
    assert link_entities("A method of agriculture", pool) == []
    assert link_entities("mercury in a bhasma", pool) == ["concept:mineral"]


def test_seed_and_expand_round_trip(db_session):
    """Seeding is idempotent, and expansion returns chunks for a linked entity."""
    counts = seed_graph(db_session)
    assert counts["entities"] >= 0  # first run inserts, later runs update
    again = seed_graph(db_session)
    assert again == {"entities": 0, "edges": 0}, "seeding twice must not duplicate rows"

    refs = linked_entities(db_session, "Can I use musk from a musk deer in an Ayurvedic medicine?")
    assert "concept:animal-derived" in refs

    edges = edges_for(db_session, ["concept:animal-derived"])
    assert edges, "the animal-derived concept should have edges"
    assert any(e.cite_source_id == "in-wlpa-1972" for e in edges)

    has_chunks = db_session.execute(sql_text("select count(*) from chunks")).scalar_one()
    if not has_chunks:
        pytest.skip("corpus not ingested in this database")
    hits = graph_chunks(db_session, ["concept:animal-derived"], "IN")
    assert hits, "expansion should reach the Wild Life Act chunks"
    assert any(h.source_id == "in-wlpa-1972" for h in hits)
    assert all(h.signals.get("graph") == 1.0 for h in hits)


def test_neighbourhood_reports_edges_with_their_cites(db_session):
    seed_graph(db_session)
    out = neighbourhood(db_session, "concept:micro-organism")
    assert out["entity"]["label"] == "Micro-organism"
    predicates = {e["predicate"] for e in out["edges"]}
    assert "deposit_required_by" in predicates
    deposit = next(e for e in out["edges"] if e["predicate"] == "deposit_required_by")
    assert deposit["cite_source_id"] == "in-patents-act-1970"
    assert deposit["cite_locator"] == "s.10"
    assert neighbourhood(db_session, "concept:nothing-like-this") == {}
