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
