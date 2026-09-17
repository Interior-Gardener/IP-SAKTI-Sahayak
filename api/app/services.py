"""Long-lived objects shared by requests. Model-backed ones load lazily: the embedder
and reranker take minutes to load on CPU, and /health must answer before that."""

import hashlib
import re
import threading
from functools import lru_cache

from fastapi import Header, HTTPException
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from app.db import SessionLocal, engine
from app.db.models import AuditEvent, ConsentGrant

SESSION_ID_RE = re.compile(r"^[A-Za-z0-9-]{8,64}$")
_lock = threading.Lock()


def db() -> Session:
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def session_id(x_session_id: str = Header(..., description="anonymous id from the browser")) -> str:
    if not SESSION_ID_RE.match(x_session_id):
        raise HTTPException(400, "invalid X-Session-Id")
    return x_session_id


@lru_cache
def answer_llm():
    from app.llm import anthropic_provider, groq_provider  # noqa: F401 - registers providers
    from app.llm.router import get_provider

    return get_provider("answer")


@lru_cache
def fast_llm():
    from app.llm import anthropic_provider, groq_provider  # noqa: F401
    from app.llm.router import get_provider

    try:
        return get_provider("fast")
    except Exception:  # noqa: BLE001 - fast model is optional; fallbacks exist
        return None


@lru_cache
def embedder():
    with _lock:
        from app.embed.base import get_embedder

        return get_embedder()


@lru_cache
def reranker():
    with _lock:
        from app.rerank.local import get_reranker

        return get_reranker()


def corpus_version(session: Session) -> str:
    """Short hash over the current (not superseded) source versions."""
    try:
        hashes = session.execute(
            text("SELECT sha256 FROM source_versions WHERE NOT superseded ORDER BY sha256")
        ).scalars()
        joined = "".join(hashes)
    except Exception:  # noqa: BLE001
        return "unavailable"
    return hashlib.sha256(joined.encode()).hexdigest()[:12] if joined else "empty"


def database_ok() -> bool:
    try:
        with engine.connect() as conn:
            conn.execute(text("select 1"))
        return True
    except Exception:  # noqa: BLE001
        return False


def has_consent(session: Session, sid: str, scope: str) -> bool:
    grant = session.scalar(
        select(ConsentGrant)
        .where(ConsentGrant.session_id == sid, ConsentGrant.scope == scope)
        .order_by(ConsentGrant.granted_at.desc(), ConsentGrant.id.desc())
        .limit(1)
    )
    return grant is not None and grant.revoked_at is None


def audit(session: Session, sid: str, kind: str, payload: dict) -> None:
    session.add(AuditEvent(session_id=sid, kind=kind, payload=payload))
    session.commit()
