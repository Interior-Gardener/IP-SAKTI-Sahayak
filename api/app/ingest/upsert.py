"""Chunks + embeddings -> Postgres, versioned by file hash.

- Same sha256 as a stored version: nothing changes (re-running ingest is safe),
  except chunks embedded with a different model are re-embedded.
- New sha256: a new source_version is written and every older version of the
  source is marked superseded. Old chunks stay for traceability; retrieval skips
  them unless the question is historical.
"""

from collections.abc import Callable
from dataclasses import dataclass
from typing import Literal

from sqlalchemy import delete, select, update
from sqlalchemy.orm import Session

from app.db.models import EMBED_DIM, Chunk, Source, SourceVersion
from app.embed.base import Embedder
from app.ingest.chunk import Chunk as ChunkDraft
from app.ingest.manifest import ManifestSource

Outcome = Literal["new_version", "unchanged", "re_embedded", "rechunked"]
BATCH = 256  # rows per DB write; the encoder batches internally


@dataclass(frozen=True)
class UpsertResult:
    source_id: str
    outcome: Outcome
    version_id: int
    chunks: int


def embedding_text(context_header: str, text: str) -> str:
    """What gets embedded: the header gives a bare clause its document and section."""
    return f"{context_header}\n{text}" if context_header else text


def _embed_all(
    embedder: Embedder, texts: list[str], progress: Callable[[int, int], None] | None
) -> list[list[float]]:
    vectors: list[list[float]] = []
    for start in range(0, len(texts), BATCH):
        vectors.extend(embedder.embed_documents(texts[start : start + BATCH]))
        if progress:
            progress(min(start + BATCH, len(texts)), len(texts))
    for v in vectors:
        if len(v) != EMBED_DIM:
            raise ValueError(f"{embedder.model} gives {len(v)} dims; the schema stores {EMBED_DIM}")
    return vectors


def _rows(version_id, source, drafts, vectors, model):
    return [
        Chunk(
            source_version_id=version_id,
            locator=d.locator,
            heading_path=d.heading_path,
            page=d.page,
            text=d.text,
            context_header=d.context_header,
            embedding=vector,
            embed_model=model,
            jurisdiction=source.jurisdiction,
            regime=list(source.regime),
            doc_type=source.doc_type,
        )
        for d, vector in zip(drafts, vectors, strict=True)
    ]


def upsert_source(
    session: Session,
    source: ManifestSource,
    sha256: str,
    drafts: list[ChunkDraft],
    embedder: Embedder,
    progress: Callable[[int, int], None] | None = None,
    rechunk: bool = False,
) -> UpsertResult:
    row = session.get(Source, source.id) or Source(id=source.id)
    row.title = source.title
    row.jurisdiction = source.jurisdiction
    row.regime = list(source.regime)
    row.doc_type = source.doc_type
    row.issuer = source.issuer
    row.url = str(source.url)
    row.licence = source.licence
    row.language = source.language
    session.add(row)
    session.flush()

    existing = session.scalar(select(SourceVersion).where(SourceVersion.sha256 == sha256))
    if existing is not None and rechunk:
        # Same file, better parser: replace this version's chunks in place.
        session.execute(delete(Chunk).where(Chunk.source_version_id == existing.id))
        vectors = _embed_all(
            embedder, [embedding_text(d.context_header, d.text) for d in drafts], progress
        )
        session.add_all(_rows(existing.id, source, drafts, vectors, embedder.model))
        session.commit()
        return UpsertResult(source.id, "rechunked", existing.id, len(drafts))
    if existing is not None:
        stale = session.scalars(
            select(Chunk).where(
                Chunk.source_version_id == existing.id,
                (Chunk.embed_model != embedder.model) | Chunk.embed_model.is_(None),
            )
        ).all()
        if not stale:
            return UpsertResult(source.id, "unchanged", existing.id, 0)
        vectors = _embed_all(
            embedder, [embedding_text(c.context_header, c.text) for c in stale], progress
        )
        for chunk, vector in zip(stale, vectors, strict=True):
            chunk.embedding = vector
            chunk.embed_model = embedder.model
        session.commit()
        return UpsertResult(source.id, "re_embedded", existing.id, len(stale))

    session.execute(
        update(SourceVersion).where(SourceVersion.source_id == source.id).values(superseded=True)
    )
    version = SourceVersion(
        source_id=source.id,
        version_label=source.version_label,
        sha256=sha256,
        effective_from=source.effective_from,
        effective_to=source.effective_to,
        superseded=False,
    )
    session.add(version)
    session.flush()

    vectors = _embed_all(
        embedder, [embedding_text(d.context_header, d.text) for d in drafts], progress
    )
    session.add_all(_rows(version.id, source, drafts, vectors, embedder.model))
    session.commit()
    return UpsertResult(source.id, "new_version", version.id, len(drafts))
