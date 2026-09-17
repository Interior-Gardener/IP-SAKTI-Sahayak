"""Corpus tables (docs/architecture.md §3). Later stages add the knowledge graph,
conversations, consent and audit tables in their own migrations."""

from datetime import date, datetime

from pgvector.sqlalchemy import Vector
from sqlalchemy import (
    Boolean,
    Computed,
    Date,
    DateTime,
    ForeignKey,
    Index,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import ARRAY, TSVECTOR
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

# BGE-M3 and voyage-law-2 both emit 1024 dimensions. A model with another size
# needs a migration and a full re-embed; chunks never mix models.
EMBED_DIM = 1024


class Base(DeclarativeBase):
    pass


class Source(Base):
    """One document in corpus/manifest.yaml; `id` is the manifest id."""

    __tablename__ = "sources"

    id: Mapped[str] = mapped_column(String(120), primary_key=True)
    title: Mapped[str] = mapped_column(Text)
    jurisdiction: Mapped[str] = mapped_column(String(4))  # IN | INTL
    regime: Mapped[list[str]] = mapped_column(ARRAY(String(40)), default=list)
    doc_type: Mapped[str] = mapped_column(String(40))
    issuer: Mapped[str] = mapped_column(Text)
    url: Mapped[str] = mapped_column(Text)
    licence: Mapped[str] = mapped_column(Text)
    language: Mapped[str] = mapped_column(String(12), default="en")

    versions: Mapped[list["SourceVersion"]] = relationship(back_populates="source")


class SourceVersion(Base):
    __tablename__ = "source_versions"

    id: Mapped[int] = mapped_column(primary_key=True)
    source_id: Mapped[str] = mapped_column(ForeignKey("sources.id", ondelete="CASCADE"))
    version_label: Mapped[str] = mapped_column(Text)
    sha256: Mapped[str] = mapped_column(String(64), unique=True)
    retrieved_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    effective_from: Mapped[date | None] = mapped_column(Date)
    effective_to: Mapped[date | None] = mapped_column(Date)
    # Old versions stay for traceability; retrieval skips them unless historical.
    superseded: Mapped[bool] = mapped_column(Boolean, default=False)

    source: Mapped[Source] = relationship(back_populates="versions")
    chunks: Mapped[list["Chunk"]] = relationship(back_populates="version")


class Chunk(Base):
    __tablename__ = "chunks"

    id: Mapped[int] = mapped_column(primary_key=True)
    source_version_id: Mapped[int] = mapped_column(
        ForeignKey("source_versions.id", ondelete="CASCADE")
    )
    locator: Mapped[str] = mapped_column(Text)  # 's.3(p)', 'Rule 158B(1)(b)', 'Art. 27.3(b)'
    heading_path: Mapped[str] = mapped_column(Text, default="")
    text: Mapped[str] = mapped_column(Text)
    context_header: Mapped[str] = mapped_column(Text, default="")
    embedding: Mapped[list[float] | None] = mapped_column(Vector(EMBED_DIM))
    embed_model: Mapped[str | None] = mapped_column(String(80))
    tsv: Mapped[str] = mapped_column(
        TSVECTOR,
        Computed(
            "to_tsvector('english', coalesce(context_header, '') || ' ' || text)", persisted=True
        ),
    )
    # Copied from the source so filters don't need a join.
    jurisdiction: Mapped[str] = mapped_column(String(4))
    regime: Mapped[list[str]] = mapped_column(ARRAY(String(40)), default=list)
    doc_type: Mapped[str] = mapped_column(String(40))

    version: Mapped[SourceVersion] = relationship(back_populates="chunks")

    __table_args__ = (
        Index(
            "ix_chunks_embedding_hnsw",
            "embedding",
            postgresql_using="hnsw",
            postgresql_ops={"embedding": "vector_cosine_ops"},
        ),
        Index("ix_chunks_tsv", "tsv", postgresql_using="gin"),
        Index("ix_chunks_jurisdiction_doc_type", "jurisdiction", "doc_type"),
    )
