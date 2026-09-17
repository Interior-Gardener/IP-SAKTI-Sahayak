"""Hybrid retrieval for one jurisdiction.

Three candidate lists are fused with reciprocal rank fusion (RRF):
  1. dense   — pgvector cosine distance on the query embedding
  2. lexical — Postgres full-text search over context header + text
  3. locator — exact section/rule/article numbers named in the question
     ("section 3(p)", "Rule 158B", "Article 27"), which full-text search
     tokenises badly
then optionally reranked by a cross-encoder, deduplicated by locator, and cut
to the top k. Jurisdiction is a hard filter: an India query never sees a treaty
chunk, which is what keeps the two answer panes separate from the start.
Regimes are a soft boost, never a filter, because the router can be wrong.
"""

import re
from dataclasses import dataclass, field

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.embed.base import Embedder
from app.rerank.local import LocalReranker

RRF_K = 60
REGIME_BONUS = 1 / (RRF_K + 10)  # about what a top-10 hit in one list is worth

LOCATOR_QUERY_RE = re.compile(
    r"\b(?P<kind>sec(?:tion)?s?\.?|s\.|rule|reg(?:ulation)?\.?|art(?:icle)?\.?)\s*"
    r"(?P<num>\d{1,4}[A-Z]{0,3})(?P<para>\.\d{1,2})?(?P<clause>\([a-z0-9]{1,4}\))?",
    re.IGNORECASE,
)
KIND_PREFIX = {"s": "s.", "sec": "s.", "rule": "Rule ", "reg": "Reg. ", "art": "Art. "}


@dataclass
class Retrieved:
    chunk_id: int
    source_id: str
    source_title: str
    source_url: str
    version_label: str
    jurisdiction: str
    doc_type: str
    regime: list[str]
    locator: str
    heading_path: str
    page: int | None
    text: str
    context_header: str
    score: float = 0.0
    signals: dict[str, float] = field(default_factory=dict)


def locators_in(question: str) -> list[str]:
    """'Can I patent under section 3(p)?' -> ['s.3(p)', 's.3']"""
    found: list[str] = []
    for m in LOCATOR_QUERY_RE.finditer(question):
        kind = m.group("kind").lower().rstrip(".s") or "s"
        prefix = next((v for k, v in KIND_PREFIX.items() if kind.startswith(k)), "s.")
        base = f"{prefix}{m.group('num').upper()}"
        if m.group("para"):  # treaty paragraphs: "Art. 27.3"
            found.append(base + m.group("para"))
        if m.group("clause") and not m.group("para"):
            found.append(base + m.group("clause").lower())
        found.append(base)
    return list(dict.fromkeys(found))


def or_query(text: str) -> str:
    """A whole question as an OR of its words: 'patent | traditional | formulation'.
    websearch_to_tsquery ANDs every word, so a natural question rarely matches anything;
    ranking (ts_rank_cd) still prefers passages that contain more of the words."""
    words = re.findall(r"[A-Za-z][A-Za-z0-9]{2,}", text)
    return " | ".join(dict.fromkeys(w.lower() for w in words))


_SELECT = """
    c.id AS chunk_id, sv.source_id, s.title AS source_title, s.url AS source_url, sv.version_label,
    c.jurisdiction, c.doc_type, c.regime, c.locator, c.heading_path, c.page, c.text,
    c.context_header
"""
_FROM = """
    FROM chunks c
    JOIN source_versions sv ON sv.id = c.source_version_id
    JOIN sources s ON s.id = sv.source_id
    WHERE c.jurisdiction = :jurisdiction
      AND (:historical OR NOT sv.superseded)
"""


def _rows(session: Session, sql: str, **params) -> list[Retrieved]:
    return [Retrieved(**row._mapping) for row in session.execute(text(sql), params)]


def dense(session: Session, vector: list[float], model: str, jurisdiction: str, limit: int,
          historical: bool = False) -> list[Retrieved]:  # fmt: skip
    return _rows(
        session,
        f"SELECT {_SELECT} {_FROM} AND c.embed_model = :model "
        "ORDER BY c.embedding <=> CAST(:vector AS vector) LIMIT :limit",
        jurisdiction=jurisdiction, historical=historical, model=model,
        vector=str(vector), limit=limit,
    )  # fmt: skip


def lexical(session: Session, query: str, jurisdiction: str, limit: int,
            historical: bool = False) -> list[Retrieved]:  # fmt: skip
    if not or_query(query):
        return []  # no searchable words (e.g. untranslated non-Latin text): dense search still runs
    return _rows(
        session,
        f"SELECT {_SELECT} {_FROM} AND c.tsv @@ to_tsquery('english', :q) "
        "ORDER BY ts_rank_cd(c.tsv, to_tsquery('english', :q)) DESC LIMIT :limit",
        jurisdiction=jurisdiction, historical=historical, q=or_query(query), limit=limit,
    )  # fmt: skip


def by_locator(session: Session, locators: list[str], jurisdiction: str, limit: int,
               historical: bool = False) -> list[Retrieved]:  # fmt: skip
    if not locators:
        return []
    # "s.3(p)" also matches a chunk covering a clause range such as "s.3(k)–(p)" or all of "s.3".
    return _rows(
        session,
        f"SELECT {_SELECT} {_FROM} AND (c.locator = ANY(:locs) OR "
        "split_part(c.locator, '(', 1) = ANY(:bases)) "
        "ORDER BY array_position(:locs, c.locator) NULLS LAST, c.id LIMIT :limit",
        jurisdiction=jurisdiction, historical=historical, locs=locators,
        bases=list({loc.split("(")[0] for loc in locators}), limit=limit,
    )  # fmt: skip


def fuse(lists: dict[str, list[Retrieved]], regimes: list[str] | None = None) -> list[Retrieved]:
    merged: dict[int, Retrieved] = {}
    for name, hits in lists.items():
        for rank, hit in enumerate(hits, 1):
            item = merged.setdefault(hit.chunk_id, hit)
            item.signals[name] = rank
            item.score += 1 / (RRF_K + rank)
    if regimes:
        for item in merged.values():
            if set(item.regime) & set(regimes):
                item.score += REGIME_BONUS
    return sorted(merged.values(), key=lambda r: r.score, reverse=True)


def dedupe_by_locator(hits: list[Retrieved]) -> list[Retrieved]:
    seen: set[tuple[str, str]] = set()
    out = []
    for h in hits:
        key = (h.source_id, h.locator)
        if key not in seen:
            seen.add(key)
            out.append(h)
    return out


def search(
    session: Session,
    query: str,
    jurisdiction: str,
    embedder: Embedder,
    reranker: LocalReranker | None = None,
    regimes: list[str] | None = None,
    top_k: int = 8,
    candidates: int = 40,
    historical: bool = False,
) -> list[Retrieved]:
    lists = {
        "dense": dense(
            session, embedder.embed_query(query), embedder.model, jurisdiction, candidates,
            historical,
        ),
        "lexical": lexical(session, query, jurisdiction, candidates, historical),
        "locator": by_locator(session, locators_in(query), jurisdiction, 10, historical),
    }  # fmt: skip
    fused = dedupe_by_locator(fuse(lists, regimes))[:candidates]
    if reranker and fused:
        scored = reranker.rerank(
            query, [f"{h.context_header}\n{h.text}" for h in fused], top_k=len(fused)
        )
        for s in scored:
            fused[s.index].signals["rerank"] = s.score
        # Exact locator hits stay on top: the user named that provision.
        fused = sorted(
            fused,
            key=lambda h: ("locator" in h.signals, h.signals.get("rerank", float("-inf"))),
            reverse=True,
        )
    return fused[:top_k]
