"""Stage-1 endpoints (docs/architecture.md §4)."""

import json
import uuid
from datetime import UTC, datetime
from pathlib import Path
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app import services
from app.ask.pipeline import AnswerCache, AskRequest, Services, question_hash, run
from app.db import SessionLocal
from app.db.models import (
    AuditEvent,
    Chunk,
    ConsentGrant,
    Escalation,
    Facilitator,
    MaterialIpr,
    Registry,
    Source,
    SourceVersion,
    StoredAnswer,
)
from app.guardrails.guard_in import QuestionTooLong, RateLimited, RateLimiter
from app.ingest.manifest import REPO
from app.schemas import MaterialIPProfile, MaterialKind, ProviderInfo, SahayakAnswer

router = APIRouter()
limiter = RateLimiter(per_minute=10, burst=5)
cache = AnswerCache()

ConsentScope = Literal["assistant", "transcript"]


# ------------------------------------------------------------------ consent and privacy


class ConsentRequest(BaseModel):
    scope: ConsentScope
    granted: bool


class ConsentState(BaseModel):
    assistant: bool
    transcript: bool


@router.post("/consent", response_model=ConsentState, tags=["privacy"])
def set_consent(
    body: ConsentRequest,
    sid: str = Depends(services.session_id),
    db: Session = Depends(services.db),
) -> ConsentState:
    if body.granted:
        db.add(ConsentGrant(session_id=sid, scope=body.scope))
    else:
        for grant in db.scalars(
            select(ConsentGrant).where(
                ConsentGrant.session_id == sid,
                ConsentGrant.scope == body.scope,
                ConsentGrant.revoked_at.is_(None),
            )
        ):
            grant.revoked_at = datetime.now(UTC)
    db.commit()
    return get_consent(sid, db)


@router.get("/consent", response_model=ConsentState, tags=["privacy"])
def get_consent(
    sid: str = Depends(services.session_id), db: Session = Depends(services.db)
) -> ConsentState:
    return ConsentState(
        assistant=services.has_consent(db, sid, "assistant"),
        transcript=services.has_consent(db, sid, "transcript"),
    )


class PurgeResult(BaseModel):
    deleted: dict[str, int]


@router.delete("/me", response_model=PurgeResult, tags=["privacy"])
def delete_me(
    sid: str = Depends(services.session_id), db: Session = Depends(services.db)
) -> PurgeResult:
    deleted = {}
    for model in (StoredAnswer, Escalation, ConsentGrant, AuditEvent):
        result = db.execute(delete(model).where(model.session_id == sid))
        deleted[model.__tablename__] = result.rowcount
    # The purge itself is recorded without the session id it erased.
    db.add(AuditEvent(session_id="purged", kind="purge", payload={"rows": deleted}))
    db.commit()
    return PurgeResult(deleted=deleted)


# ------------------------------------------------------------------ ask


def _sse(name: str, data) -> str:
    if hasattr(data, "model_dump"):
        data = data.model_dump(mode="json")
    elif hasattr(data, "__dataclass_fields__"):
        from dataclasses import asdict

        data = asdict(data)
    return f"event: {name}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


@router.post(
    "/ask",
    tags=["assistant"],
    response_class=StreamingResponse,
    responses={200: {"content": {"text/event-stream": {}}, "description": "status, answer, done"}},
)
def ask(
    body: AskRequest, sid: str = Depends(services.session_id), db: Session = Depends(services.db)
):
    if not services.has_consent(db, sid, "assistant"):
        raise HTTPException(403, "consent_required")
    try:
        limiter.check(sid)
    except RateLimited as e:
        raise HTTPException(429, str(e)) from e
    keep_transcript = services.has_consent(db, sid, "transcript")
    version = services.corpus_version(db)

    svc = Services(
        session_factory=SessionLocal,
        answer_llm=services.answer_llm(),
        fast_llm=services.fast_llm(),
        embedder=services.embedder(),
        reranker=services.reranker(),
        corpus_version=version,
    )

    def stream():
        trace = None
        try:
            for event in run(body, svc, cache):
                if event.name == "trace":
                    trace = event.data
                    continue
                if event.name == "done":
                    _record(sid, body, event.data, trace, keep_transcript, version)
                yield _sse(event.name, event.data)
        except QuestionTooLong as e:
            yield _sse("error", {"message": str(e)})
        except Exception as e:  # noqa: BLE001 - the stream must end with a message, not a hang
            yield _sse(
                "error",
                {"message": "Sahayak could not answer right now.", "kind": type(e).__name__},
            )

    return StreamingResponse(stream(), media_type="text/event-stream")


def _record(sid, body: AskRequest, env: SahayakAnswer, trace, keep_transcript: bool, version: str):
    session = SessionLocal()
    try:
        payload = {
            "question_hash": question_hash(body.question),
            "answer_id": env.id,
            "language": env.language,
            "mode": env.jurisdiction_mode,
            "persona": env.persona,
            "provider": env.provider.model_dump(),
            "corpus_version": version,
            "abstained": env.abstained.reason if env.abstained else None,
            "bands": {a.jurisdiction: a.confidence.band for a in env.answers},
        }
        if trace is not None:
            payload |= {
                "timings": trace.timings,
                "chunk_ids": trace.chunk_ids,
                "flags": trace.flags,
            }
        services.audit(session, sid, "ask", payload)
        if keep_transcript:
            session.merge(
                StoredAnswer(id=env.id, session_id=sid, envelope=env.model_dump(mode="json"))
            )
            session.commit()
    finally:
        session.close()


# ------------------------------------------------------------------ escalation


class EscalateRequest(BaseModel):
    answer_id: str | None = Field(default=None, max_length=40)
    message: str = Field(default="", max_length=2000)
    contact: str | None = Field(default=None, max_length=200)


class FacilitatorOut(BaseModel):
    name: str
    body: str
    contact: str
    source_url: str


class EscalateResult(BaseModel):
    ticket_id: str
    status: str
    facilitators: list[FacilitatorOut]
    note: str


@router.post("/escalate", response_model=EscalateResult, tags=["assistant"])
def escalate(
    body: EscalateRequest,
    sid: str = Depends(services.session_id),
    db: Session = Depends(services.db),
) -> EscalateResult:
    ticket = Escalation(
        id=uuid.uuid4().hex[:12], session_id=sid, answer_id=body.answer_id,
        message=body.message, contact=body.contact,
    )  # fmt: skip
    db.add(ticket)
    db.commit()
    services.audit(db, sid, "escalate", {"ticket_id": ticket.id, "has_contact": bool(body.contact)})
    facilitators = [
        FacilitatorOut(name=f.name, body=f.body, contact=f.contact, source_url=f.source_url)
        for f in db.scalars(select(Facilitator).order_by(Facilitator.name))
    ]
    note = (
        "Your question has been logged for a human IP facilitator."
        if facilitators
        else "Your question has been logged. The facilitator directory is still being verified "
        "against official listings, so no contacts are shown yet."
    )
    return EscalateResult(
        ticket_id=ticket.id, status=ticket.status, facilitators=facilitators, note=note
    )


# ------------------------------------------------------------------ corpus and registries


class SourceVersionOut(BaseModel):
    version_label: str
    sha256: str
    retrieved_at: datetime
    superseded: bool
    chunks: int


class SourceOut(BaseModel):
    id: str
    title: str
    jurisdiction: str
    regime: list[str]
    doc_type: str
    issuer: str
    url: str
    versions: list[SourceVersionOut]


class SourcesOut(BaseModel):
    corpus_version: str
    sources: list[SourceOut]
    changelog_markdown: str


@router.get("/sources", response_model=SourcesOut, tags=["corpus"])
def list_sources(db: Session = Depends(services.db)) -> SourcesOut:
    counts = dict(
        db.execute(
            select(Chunk.source_version_id, func.count()).group_by(Chunk.source_version_id)
        ).all()
    )
    out = []
    for s in db.scalars(select(Source).order_by(Source.jurisdiction, Source.id)):
        versions = sorted(s.versions, key=lambda v: v.retrieved_at, reverse=True)
        out.append(
            SourceOut(
                id=s.id,
                title=s.title,
                jurisdiction=s.jurisdiction,
                regime=s.regime,
                doc_type=s.doc_type,
                issuer=s.issuer,
                url=s.url,
                versions=[
                    SourceVersionOut(
                        version_label=v.version_label,
                        sha256=v.sha256,
                        retrieved_at=v.retrieved_at,
                        superseded=v.superseded,
                        chunks=counts.get(v.id, 0),
                    )
                    for v in versions
                ],
            )  # fmt: skip
        )
    changelog = REPO / "corpus" / "CHANGELOG.md"
    return SourcesOut(
        corpus_version=services.corpus_version(db),
        sources=out,
        changelog_markdown=changelog.read_text(encoding="utf-8")
        if Path(changelog).exists()
        else "",
    )


class RegistryOut(BaseModel):
    id: str
    name: str
    jurisdiction: str
    regime: list[str]
    url: str
    forms: list
    fee_note: str | None
    cite_locator: str | None
    cite_source_id: str | None


@router.get("/registry", response_model=list[RegistryOut], tags=["corpus"])
def list_registries(
    regime: str | None = None,
    jurisdiction: Literal["IN", "INTL"] | None = None,
    db: Session = Depends(services.db),
) -> list[RegistryOut]:
    query = (
        select(Registry, Chunk.locator, SourceVersion.source_id)
        .outerjoin(Chunk, Chunk.id == Registry.cite_chunk_id)
        .outerjoin(SourceVersion, SourceVersion.id == Chunk.source_version_id)
    )
    if jurisdiction:
        query = query.where(Registry.jurisdiction == jurisdiction)
    if regime:
        query = query.where(Registry.regime.any(regime))
    return [
        RegistryOut(
            id=r.id, name=r.name, jurisdiction=r.jurisdiction, regime=r.regime, url=r.url,
            forms=r.forms, fee_note=r.fee_note, cite_locator=loc, cite_source_id=src,
        )
        for r, loc, src in db.execute(query.order_by(Registry.name))
    ]  # fmt: skip


@router.get(
    "/materials/{kind}/{material_id}/ipr", response_model=MaterialIPProfile, tags=["corpus"]
)
def material_ipr(kind: MaterialKind, material_id: str, db: Session = Depends(services.db)):
    row = db.get(MaterialIpr, (kind, material_id))
    if row is None:
        raise HTTPException(404, "no verified profile for this material yet")
    return MaterialIPProfile.model_validate(row.profile)


# ---------------------------------------------------------- classification and ABS (stage 2)

from app.classify.rules import (  # noqa: E402
    AbsStep,
    ClassifyRequest,
    ClassifyStep,
    abs_check,
    classify,
)


@router.post("/classify", response_model=ClassifyStep, tags=["assistant"])
def classify_formulation(body: ClassifyRequest) -> ClassifyStep:
    """One question at a time: send the answers so far, get the next question or the result."""
    return classify(body)


@router.post("/abs", response_model=AbsStep, tags=["assistant"])
def abs_helper(body: ClassifyRequest) -> AbsStep:
    return abs_check(body)


# ---------------------------------------------------------- knowledge graph (stage 2)

from app.agent.loop import DISCLAIMER as AGENT_DISCLAIMER  # noqa: E402
from app.agent.loop import run_agent  # noqa: E402
from app.graph.expand import neighbourhood  # noqa: E402


class AgentRequest(BaseModel):
    question: str = Field(..., max_length=2000)
    #: Hard cap on model turns. Kept low: the loop is for multi-step questions,
    #: not for letting a model wander.
    max_iterations: int = Field(default=6, ge=1, le=10)


class AgentToolCall(BaseModel):
    tool: str
    arguments: dict


class AgentAnswer(BaseModel):
    markdown: str
    calls: list[AgentToolCall]
    provider: ProviderInfo
    truncated: bool
    chunk_ids: list[int]
    disclaimer: str


@router.post("/agent", response_model=AgentAnswer, tags=["assistant"])
def agent(
    body: AgentRequest,
    sid: str = Depends(services.session_id),
    db: Session = Depends(services.db),
    llm=Depends(services.answer_llm),
    embedder=Depends(services.embedder),
    reranker=Depends(services.reranker),
) -> AgentAnswer:
    """The agentic path: the model works the question with the tools in
    app/agent/tools.py, under a hard iteration cap, with an audit row per call.

    Consent is required exactly as it is for /ask, and every tool is read-only.
    """
    if not services.has_consent(db, sid, "assistant"):
        raise HTTPException(403, "assistant consent is required")
    try:
        run = run_agent(
            body.question,
            llm,
            db,
            embedder,
            reranker,
            session_id=sid,
            max_iterations=body.max_iterations,
        )
    except NotImplementedError as e:
        raise HTTPException(501, str(e)) from e
    return AgentAnswer(
        markdown=run.text,
        calls=[AgentToolCall(tool=c.name, arguments=c.arguments) for c in run.calls],
        provider=ProviderInfo(name=run.provider, model=run.model),
        truncated=run.truncated,
        chunk_ids=run.chunk_ids,
        disclaimer=AGENT_DISCLAIMER,
    )


@router.get("/graph/{ref}", tags=["corpus"])
def graph_entity(ref: str, db: Session = Depends(services.db)) -> dict:
    """One entity and every edge it takes part in, each with the provision it
    rests on. `ref` is "kind:key" — for example `concept:micro-organism`,
    `regime:abs` or `source:in-patents-act-1970`."""
    out = neighbourhood(db, ref)
    if not out:
        raise HTTPException(404, f"no entity {ref!r} in the graph")
    return out
