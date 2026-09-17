import pytest
from sqlalchemy import delete, select

from app.db.models import Chunk, Source, SourceVersion
from app.embed.base import Embedder
from app.ingest.chunk import Chunk as Draft
from app.ingest.manifest import ManifestSource
from app.ingest.upsert import upsert_source

SOURCE = ManifestSource(
    id="in-test-upsert",
    title="Test Act",
    jurisdiction="IN",
    regime=["patent"],
    doc_type="statute",
    issuer="x",
    url="https://example.gov.in/a",
    fetch="manual",
    format="pdf",
    licence="x",
    version_label="v1",
)
DRAFTS = [
    Draft("s.3", "s.3 What are not inventions", "traditional knowledge", "Test Act — s.3", 12),
    Draft("s.4", "s.4 Atomic energy", "atomic energy", "Test Act — s.4", 13),
]


class FakeEmbedder(Embedder):
    dim = 1024

    def __init__(self, model="fake-1"):
        self.model = model
        self.calls = 0

    def embed_documents(self, texts):
        self.calls += len(texts)
        return [[0.001 * (i + 1)] * 1024 for i in range(len(texts))]

    def embed_query(self, text):
        return [0.001] * 1024


@pytest.fixture
def session(db_session):
    db_session.execute(delete(Source).where(Source.id == SOURCE.id))
    db_session.commit()
    yield db_session
    db_session.rollback()
    db_session.execute(delete(Source).where(Source.id == SOURCE.id))
    db_session.commit()


def test_same_hash_is_unchanged(session):
    e = FakeEmbedder()
    first = upsert_source(session, SOURCE, "a" * 64, DRAFTS, e)
    again = upsert_source(session, SOURCE, "a" * 64, DRAFTS, e)
    assert (first.outcome, first.chunks) == ("new_version", 2)
    assert again.outcome == "unchanged" and e.calls == 2
    stored = session.scalars(select(Chunk).where(Chunk.source_version_id == first.version_id)).all()
    assert {c.locator for c in stored} == {"s.3", "s.4"}
    assert all(c.jurisdiction == "IN" and c.embed_model == "fake-1" and c.page for c in stored)


def test_new_hash_supersedes_old_version(session):
    e = FakeEmbedder()
    v1 = upsert_source(session, SOURCE, "b" * 64, DRAFTS, e)
    v2 = upsert_source(session, SOURCE, "c" * 64, DRAFTS[:1], e)
    versions = {
        v.id: v.superseded
        for v in session.scalars(select(SourceVersion).where(SourceVersion.source_id == SOURCE.id))
    }
    assert versions == {v1.version_id: True, v2.version_id: False}


def test_embedder_change_re_embeds(session):
    upsert_source(session, SOURCE, "d" * 64, DRAFTS, FakeEmbedder("fake-1"))
    r = upsert_source(session, SOURCE, "d" * 64, DRAFTS, FakeEmbedder("fake-2"))
    assert (r.outcome, r.chunks) == ("re_embedded", 2)
    models = set(
        session.scalars(select(Chunk.embed_model).where(Chunk.source_version_id == r.version_id))
    )
    assert models == {"fake-2"}


def test_rechunk_replaces_chunks_of_same_file(session):
    e = FakeEmbedder()
    first = upsert_source(session, SOURCE, "e" * 64, DRAFTS, e)
    r = upsert_source(session, SOURCE, "e" * 64, DRAFTS[:1], e, rechunk=True)
    assert (r.outcome, r.version_id, r.chunks) == ("rechunked", first.version_id, 1)
    assert [
        c.locator
        for c in session.scalars(select(Chunk).where(Chunk.source_version_id == r.version_id))
    ] == ["s.3"]
