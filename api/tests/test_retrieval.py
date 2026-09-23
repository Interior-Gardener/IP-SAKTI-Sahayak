import pytest
from sqlalchemy import delete

from app.db.models import Source
from app.ingest.chunk import Chunk as Draft
from app.ingest.manifest import ManifestSource
from app.ingest.upsert import upsert_source
from app.retrieval.hybrid import fuse, locators_in, search
from tests.test_upsert import FakeEmbedder


def test_locators_in_questions():
    assert locators_in("Can I patent it under section 3(p)?") == ["s.3(p)", "s.3"]
    assert locators_in("TRIPS Article 27.3(b)") == ["Art. 27.3", "Art. 27"]
    assert locators_in("Rule 158B licence") == ["Rule 158B"]
    assert locators_in("no provision named here") == []


def _source(sid, jurisdiction, doc_type="statute"):
    return ManifestSource(
        id=sid, title=sid, jurisdiction=jurisdiction, regime=["patent"], doc_type=doc_type,
        issuer="x", url="https://example.org/", fetch="manual", format="pdf", licence="x",
        version_label="v1",
    )  # fmt: skip


IN_SRC = _source("in-test-retrieval", "IN")
INTL_SRC = _source("intl-test-retrieval", "INTL", "treaty")


@pytest.fixture
def seeded(db_session):
    ids = [IN_SRC.id, INTL_SRC.id]
    db_session.execute(delete(Source).where(Source.id.in_(ids)))
    db_session.commit()
    e = FakeEmbedder()
    upsert_source(db_session, IN_SRC, "1" * 64, [
        Draft("s.3(p)", "s.3", "an invention which, in effect, is traditional knowledge zzqtest", "Act — s.3(p)", 1),
        Draft("s.10", "s.10", "contents of specifications zzqtest", "Act — s.10", 2),
    ], e)  # fmt: skip
    upsert_source(db_session, INTL_SRC, "2" * 64, [
        Draft("Art. 27", "Art. 27", "patentable subject matter traditional knowledge zzqtest", "TRIPS — Art. 27", 1),
    ], e)  # fmt: skip
    yield db_session, e
    db_session.rollback()
    db_session.execute(delete(Source).where(Source.id.in_(ids)))
    db_session.commit()


def test_jurisdiction_is_a_hard_filter(seeded):
    session, e = seeded
    india = search(session, "traditional knowledge zzqtest", "IN", e, top_k=50)
    intl = search(session, "traditional knowledge zzqtest", "INTL", e, top_k=50)
    assert india and all(h.jurisdiction == "IN" for h in india)
    assert intl and all(h.jurisdiction == "INTL" for h in intl)
    assert "intl-test-retrieval" not in {h.source_id for h in india}


def test_named_section_is_found_and_ranked_first(seeded):
    session, e = seeded
    hits = [h for h in search(session, "what does section 3(p) say zzqtest", "IN", e, top_k=50)
            if h.source_id == "in-test-retrieval"]  # fmt: skip
    assert hits[0].locator == "s.3(p)" and "locator" in hits[0].signals


def test_superseded_versions_are_skipped(seeded):
    session, e = seeded
    upsert_source(session, IN_SRC, "3" * 64, [
        Draft("s.10", "s.10", "new text of section ten zzqtest", "Act — s.10", 2),
    ], e)  # fmt: skip
    hits = [h for h in search(session, "zzqtest", "IN", e, top_k=50) if h.source_id == IN_SRC.id]
    assert [h.locator for h in hits] == ["s.10"]
    assert search(session, "zzqtest", "IN", e, top_k=50, historical=True)


def test_fuse_rewards_agreement_across_lists():
    from app.retrieval.hybrid import Retrieved

    def r(i):
        return Retrieved(
            i, "s", "t", "u", "v", "IN", "statute", ["patent"], f"s.{i}", "", 1, "", ""
        )

    fused = fuse({"dense": [r(1), r(2)], "lexical": [r(2), r(3)]})
    assert fused[0].chunk_id == 2


def _hit(n: int, rerank: float, *signals: str):
    from app.retrieval.hybrid import Retrieved

    hit = Retrieved(n, "src", "Src", "u", "v", "IN", "act", [], f"s.{n}", "", None, "t", "")
    hit.signals = {"rerank": rerank, **{s: 1.0 for s in signals}}
    return hit


def test_a_graph_hit_takes_a_slot_when_the_reranker_is_unsure():
    """The musk case: every result is weak, so the cited graph provision gets in."""
    from app.retrieval.hybrid import reserve_graph_slots

    ranked = [_hit(i, 0.009) for i in range(8)] + [_hit(99, 0.002, "graph")]
    top = reserve_graph_slots(ranked, 8)
    assert [h.chunk_id for h in top][-1] == 99 and len(top) == 8


def test_a_graph_hit_steps_aside_when_the_reranker_is_sure():
    """The "patent or proprietary medicine" case: a D&C term that links the
    patent regime must not push confident D&C results out of the top 8."""
    from app.retrieval.hybrid import reserve_graph_slots

    ranked = [_hit(i, 0.95) for i in range(8)] + [_hit(99, 0.005, "graph")]
    assert 99 not in [h.chunk_id for h in reserve_graph_slots(ranked, 8)]


def test_a_graph_hit_never_displaces_a_named_provision():
    from app.retrieval.hybrid import reserve_graph_slots

    ranked = [_hit(i, 0.001, "locator") for i in range(8)] + [_hit(99, 0.5, "graph")]
    assert 99 not in [h.chunk_id for h in reserve_graph_slots(ranked, 8)]
