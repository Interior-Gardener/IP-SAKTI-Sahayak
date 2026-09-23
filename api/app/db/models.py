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
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, TSVECTOR
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
    # PDF page the unit starts on, for "#page=N" deep links in citations.
    page: Mapped[int | None] = mapped_column()
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


# --- Assistant: consent, audit, escalation, registries (stage 1) -------------------------
# Sessions are anonymous ids from the browser; nothing here needs an account. Rows tied
# to a session are deleted by DELETE /me.


class ConsentGrant(Base):
    __tablename__ = "consent_grants"

    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[str] = mapped_column(String(64), index=True)
    scope: Mapped[str] = mapped_column(String(80))  # assistant | transcript | connector:<name>
    granted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class AuditEvent(Base):
    """No raw personal data: questions are stored as hashes (docs/dpdp-and-security.md §4)."""

    __tablename__ = "audit_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[str] = mapped_column(String(64), index=True)
    kind: Mapped[str] = mapped_column(String(40))  # ask | tool_call | connector | escalate | purge
    payload: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class StoredAnswer(Base):
    """Kept only when the session granted `transcript` consent (needed for escalation)."""

    __tablename__ = "answers"

    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    session_id: Mapped[str] = mapped_column(String(64), index=True)
    envelope: Mapped[dict] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Facilitator(Base):
    """Only bodies from official listings, with the page they were verified from."""

    __tablename__ = "facilitators"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(Text)
    body: Mapped[str] = mapped_column(Text)
    contact: Mapped[str] = mapped_column(Text)
    source_url: Mapped[str] = mapped_column(Text)
    verified_at: Mapped[date] = mapped_column(Date)


class Escalation(Base):
    __tablename__ = "escalations"

    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    session_id: Mapped[str] = mapped_column(String(64), index=True)
    answer_id: Mapped[str | None] = mapped_column(String(40))
    message: Mapped[str] = mapped_column(Text, default="")
    contact: Mapped[str | None] = mapped_column(Text)
    facilitator_id: Mapped[int | None] = mapped_column(ForeignKey("facilitators.id"))
    status: Mapped[str] = mapped_column(String(20), default="open")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Registry(Base):
    """Where a user goes next. `cite_chunk_id` must point at the provision that requires it."""

    __tablename__ = "registries"

    id: Mapped[str] = mapped_column(String(60), primary_key=True)
    name: Mapped[str] = mapped_column(Text)
    jurisdiction: Mapped[str] = mapped_column(String(4))
    regime: Mapped[list[str]] = mapped_column(ARRAY(String(40)), default=list)
    url: Mapped[str] = mapped_column(Text)
    forms: Mapped[list] = mapped_column(JSONB, default=list)
    fee_note: Mapped[str | None] = mapped_column(Text)
    cite_chunk_id: Mapped[int | None] = mapped_column(ForeignKey("chunks.id", ondelete="SET NULL"))


class MaterialIpr(Base):
    __tablename__ = "material_ipr"

    kind: Mapped[str] = mapped_column(String(10), primary_key=True)
    material_id: Mapped[str] = mapped_column(String(60), primary_key=True)
    profile: Mapped[dict] = mapped_column(JSONB)
    last_verified: Mapped[date | None] = mapped_column(Date)


# --- Knowledge graph (stage 2) -----------------------------------------------------------
# Relational on purpose: the problem statement asks for a relational knowledge graph, and
# one join is cheaper to run and easier to audit than a second database. Every edge that
# asserts a legal relation carries the provision it rests on, and app/graph/seed.py is
# checked against corpus/normalised/ by the tests.


class KgEntity(Base):
    __tablename__ = "kg_entity"

    id: Mapped[int] = mapped_column(primary_key=True)
    # 'concept' | 'regime' | 'source' | later: 'material'
    kind: Mapped[str] = mapped_column(String(20))
    key: Mapped[str] = mapped_column(String(80))
    label: Mapped[str] = mapped_column(Text)
    # Words that should reach this entity from a question, lowercase.
    aliases: Mapped[list[str]] = mapped_column(ARRAY(Text), default=list)

    __table_args__ = (Index("ux_kg_entity_kind_key", "kind", "key", unique=True),)


class KgEdge(Base):
    __tablename__ = "kg_relation"

    id: Mapped[int] = mapped_column(primary_key=True)
    subject_id: Mapped[int] = mapped_column(ForeignKey("kg_entity.id", ondelete="CASCADE"))
    predicate: Mapped[str] = mapped_column(String(60))
    object_id: Mapped[int] = mapped_column(ForeignKey("kg_entity.id", ondelete="CASCADE"))
    # The evidence, and what retrieval expansion pulls in: a manifest source id
    # and a locator within it. A null locator means the source as a whole, which
    # is all a manual can be pointed at.
    cite_source_id: Mapped[str | None] = mapped_column(String(60))
    cite_locator: Mapped[str | None] = mapped_column(Text)
    note: Mapped[str] = mapped_column(Text, default="")

    subject: Mapped[KgEntity] = relationship(foreign_keys=[subject_id])
    object: Mapped[KgEntity] = relationship(foreign_keys=[object_id])

    __table_args__ = (
        Index("ix_kg_relation_subject", "subject_id"),
        Index("ix_kg_relation_object", "object_id"),
    )
