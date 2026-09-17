"""POST /ask end to end (docs/architecture.md §2). Yields events so the endpoint can
stream them: a status line per stage, each jurisdiction's answer as soon as it is
ready (India first), then the full envelope.

Jurisdictions run concurrently and never share state: separate retrieval, separate
generation, separate verification. The envelope keeps them as separate objects.
"""

import hashlib
import re
import time
import uuid
from collections import OrderedDict
from collections.abc import Callable, Iterator
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from typing import Any

from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.embed.base import Embedder
from app.generate.answer import DraftAnswer, generate
from app.guardrails.guard_in import ABSTAIN_SUGGESTIONS, check_question
from app.guardrails.verify import CONFIDENCE_FLOOR, Verified, score_confidence, verify
from app.llm.base import CitedAnswer, LLMProvider
from app.rerank.local import LocalReranker
from app.retrieval.hybrid import Retrieved, locators_in, search
from app.schemas import (
    Abstention,
    Confidence,
    JurisdictionAnswer,
    JurisdictionMode,
    Persona,
    ProviderInfo,
    SahayakAnswer,
)
from app.understand.pipeline import understand


class ContextItem(BaseModel):
    kind: str = Field(max_length=20)
    id: str = Field(max_length=80)


class AskRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)
    language: str | None = Field(default=None, max_length=8)
    jurisdiction_mode: JurisdictionMode = "BOTH"
    persona: Persona | None = None
    context: list[ContextItem] = Field(default_factory=list, max_length=10)


@dataclass
class Services:
    session_factory: Callable[[], Session]
    answer_llm: LLMProvider
    fast_llm: LLMProvider | None
    embedder: Embedder
    reranker: LocalReranker | None
    corpus_version: str = "unknown"


@dataclass
class Event:
    name: str
    data: Any


@dataclass
class Trace:
    timings: dict[str, float] = field(default_factory=dict)
    chunk_ids: dict[str, list[int]] = field(default_factory=dict)
    flags: dict[str, list[str]] = field(default_factory=dict)

    def time(self, stage: str, start: float) -> None:
        self.timings[stage] = round(time.perf_counter() - start, 3)


LEAK_RETRY = (
    "Your previous answer brought in law from another jurisdiction. Use only the documents "
    "given below, which all belong to the stated jurisdiction, and do not name other "
    "countries' laws or treaties unless these documents do."
)


def _insufficient(jurisdiction: str, language: str) -> str:
    where = "Indian law" if jurisdiction == "IN" else "international law"
    return (
        f"The sources available for {where} are not enough to answer this reliably. "
        "Please rephrase with more detail, or ask a human IP facilitator."
    )


class AnswerCache:
    """Small in-process LRU so repeated demo questions come back instantly."""

    def __init__(self, size: int = 128) -> None:
        self.size = size
        self._data: OrderedDict[str, SahayakAnswer] = OrderedDict()

    @staticmethod
    def key(req: AskRequest, corpus_version: str) -> str:
        q = re.sub(r"\s+", " ", req.question.strip().lower())
        ctx = ",".join(f"{c.kind}:{c.id}" for c in req.context)
        return "|".join(
            [q, req.jurisdiction_mode, req.persona or "", req.language or "", ctx, corpus_version]
        )

    def get(self, key: str) -> SahayakAnswer | None:
        if key in self._data:
            self._data.move_to_end(key)
            return self._data[key]
        return None

    def put(self, key: str, value: SahayakAnswer) -> None:
        self._data[key] = value
        self._data.move_to_end(key)
        while len(self._data) > self.size:
            self._data.popitem(last=False)


def _answer_one(
    services: Services,
    jurisdiction: str,
    question: str,
    search_query: str,
    regimes: list[str],
    language: str,
    persona: str | None,
) -> tuple[DraftAnswer, Verified, Confidence]:
    session = services.session_factory()
    try:
        # Named provisions come from the question itself; the rewrite may drop them.
        query = search_query + " " + " ".join(locators_in(question))
        retrieved: list[Retrieved] = search(
            session, query.strip(), jurisdiction, services.embedder, services.reranker, regimes
        )
    finally:
        session.close()

    if not retrieved:
        empty = DraftAnswer(jurisdiction, CitedAnswer("", [], ""), [])
        no_sources = Confidence(score=0, band="low", reasons=["no sources found"])
        return empty, Verified(jurisdiction, "", []), no_sources

    draft = generate(services.answer_llm, question, jurisdiction, retrieved, language, persona)
    checked = verify(draft)
    if checked.leaked:
        draft = generate(
            services.answer_llm, question, jurisdiction, retrieved, language, persona, LEAK_RETRY
        )
        checked = verify(draft)
    return draft, checked, score_confidence(checked, draft)


def run(req: AskRequest, services: Services, cache: AnswerCache | None = None) -> Iterator[Event]:
    trace = Trace()
    answer_id = uuid.uuid4().hex
    provider = ProviderInfo(name=services.answer_llm.name, model=services.answer_llm.model)

    key = AnswerCache.key(req, services.corpus_version)
    if cache and (hit := cache.get(key)):
        yield Event("done", hit)
        return

    def envelope(**kw) -> SahayakAnswer:
        return SahayakAnswer(
            id=answer_id,
            question=req.question,
            language=kw.pop("language", req.language or "en"),
            persona=req.persona,
            jurisdiction_mode=req.jurisdiction_mode,
            provider=provider,
            **kw,
        )

    yield Event("status", {"stage": "checking"})
    t = time.perf_counter()
    guard = check_question(req.question, services.fast_llm)
    trace.time("guard_in", t)
    if not guard.allowed:
        env = envelope(
            answers=[],
            abstained=Abstention(
                reason=guard.verdict, suggestion=ABSTAIN_SUGGESTIONS[guard.verdict]
            ),
        )
        yield Event("trace", trace)
        yield Event("done", env)
        return

    yield Event("status", {"stage": "understanding"})
    t = time.perf_counter()
    u = understand(req.question, services.fast_llm, req.language)
    trace.time("understand", t)

    jurisdictions = ["IN", "INTL"] if req.jurisdiction_mode == "BOTH" else [req.jurisdiction_mode]
    yield Event("status", {"stage": "searching", "jurisdictions": jurisdictions})

    results: dict[str, JurisdictionAnswer] = {}
    t = time.perf_counter()
    with ThreadPoolExecutor(max_workers=len(jurisdictions)) as pool:
        futures = {
            j: pool.submit(
                _answer_one, services, j, u.english, u.search_query, u.regimes, u.language,
                req.persona,
            )
            for j in jurisdictions
        }  # fmt: skip
        for j in jurisdictions:  # in order, so India streams first
            draft, checked, conf = futures[j].result()
            trace.chunk_ids[j] = [r.chunk_id for r in draft.retrieved]
            trace.flags[j] = checked.flags
            if conf.score < CONFIDENCE_FLOOR:
                ans = JurisdictionAnswer(
                    jurisdiction=j,
                    markdown=_insufficient(j, u.language),
                    citations=[],
                    confidence=Confidence(
                        score=conf.score, band="low", reasons=conf.reasons + ["answer withheld"]
                    ),
                )
            else:
                ans = JurisdictionAnswer(
                    jurisdiction=j,
                    markdown=checked.markdown,
                    citations=[c for c in checked.citations if c.verified],
                    confidence=conf,
                )
            results[j] = ans
            yield Event("answer", ans)
    trace.time("answer", t)

    answers = [results[j] for j in jurisdictions]
    abstained = None
    if all(a.confidence.score < CONFIDENCE_FLOOR for a in answers):
        abstained = Abstention(
            reason="insufficient_sources",
            suggestion="Try naming the product type, ingredient or law you mean, or escalate "
            "the question to a human IP facilitator.",
        )
    env = envelope(answers=answers, abstained=abstained, language=u.language)
    if cache and abstained is None:
        cache.put(key, env)
    yield Event("trace", trace)
    yield Event("done", env)


def question_hash(question: str) -> str:
    return hashlib.sha256(question.strip().lower().encode()).hexdigest()[:32]
