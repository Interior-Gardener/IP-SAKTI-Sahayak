"""Knowledge-graph expansion for retrieval, and the neighbourhood behind /graph.

Search finds what a question says. The graph finds what a question *means*:
"can I sell musk in an Ayurvedic medicine" never says "wildlife", but the
material kind it names is joined to the Wild Life Act by an edge, and the
chunk that edge cites is added to the candidates.

The expansion is a candidate *source*, never an answer. Its hits go into the
same fusion as dense and lexical search, so a graph hit that nothing else
supports ranks low and a graph hit the question also matches ranks high.
"""

import re
from contextlib import suppress

from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session

from app.db.models import KgEdge, KgEntity
from app.retrieval.hybrid import _FROM, _SELECT, Retrieved, _rows


def link_entities(text: str, entities: list[KgEntity]) -> list[str]:
    """Which entities a question touches, by alias. Deterministic and cheap —
    this runs before any model call and must never be the slow part.

    Aliases are matched on word boundaries, so "culture" matches "a culture of
    the strain" but not "agriculture"."""
    lowered = f" {text.lower()} "
    hits: list[tuple[int, str]] = []
    for entity in entities:
        for alias in entity.aliases or []:
            if re.search(rf"(?<![\w-]){re.escape(alias.lower())}(?![\w-])", lowered):
                # Longer aliases are better evidence than shorter ones.
                hits.append((len(alias), f"{entity.kind}:{entity.key}"))
                break
    return [ref for _, ref in sorted(hits, reverse=True)]


def linked_entities(session: Session, text: str, limit: int = 6) -> list[str]:
    """The entities a question touches, read from the graph.

    Never raises. A database without the graph tables, or with them empty, means
    no expansion — it must not mean a failed answer, because the graph is a
    widening of retrieval and not a part of it.
    """
    try:
        rows = list(session.execute(select(KgEntity)).scalars())
    except Exception:  # noqa: BLE001 - an unseeded or unmigrated graph is not an error here
        # A failed statement leaves the transaction unusable, so roll it back
        # before the session is used again — and even that is best-effort: the
        # session handed in may be a stub with nothing on it but close().
        with suppress(Exception):
            session.rollback()
        return []
    return link_entities(text, rows)[:limit]


def edges_for(session: Session, refs: list[str]) -> list[KgEdge]:
    """Every edge touching any of these entities, in either direction."""
    if not refs:
        return []
    pairs = [ref.split(":", 1) for ref in refs if ":" in ref]
    if not pairs:
        return []
    # An OR of (kind, key) pairs, not two INs: two INs would also match an
    # entity whose kind came from one ref and whose key came from another.
    match = or_(*[and_(KgEntity.kind == k, KgEntity.key == v) for k, v in pairs])
    id_list = list(session.execute(select(KgEntity.id).where(match)).scalars())
    if not id_list:
        return []
    return list(
        session.execute(
            select(KgEdge)
            .where(KgEdge.subject_id.in_(id_list) | KgEdge.object_id.in_(id_list))
            .order_by(KgEdge.id)
        ).scalars()
    )


def graph_chunks(
    session: Session,
    refs: list[str],
    jurisdiction: str,
    limit: int = 8,
    historical: bool = False,
) -> list[Retrieved]:
    """The chunks the edges of these entities cite, as ordinary retrieval hits.

    Each edge contributes at most two chunks: an edge is evidence for one
    provision, and pulling a whole statute in because one edge points at it
    would drown the candidates it is supposed to widen.
    """
    out: list[Retrieved] = []
    seen: set[int] = set()
    for edge in edges_for(session, refs):
        if not edge.cite_source_id or len(out) >= limit:
            continue
        if edge.cite_locator:
            sql = (
                f"SELECT {_SELECT} {_FROM} AND s.id = :source "
                "AND (c.locator = :loc OR split_part(c.locator, '(', 1) = :base) "
                "ORDER BY c.id LIMIT 2"
            )
            params = {
                "source": edge.cite_source_id,
                "loc": edge.cite_locator,
                "base": edge.cite_locator.split("(")[0],
            }
        else:
            # No locator: the source as a whole. Take its opening chunks, which
            # for a manual is where its scope is stated.
            sql = f"SELECT {_SELECT} {_FROM} AND s.id = :source ORDER BY c.id LIMIT 2"
            params = {"source": edge.cite_source_id}
        for hit in _rows(session, sql, jurisdiction=jurisdiction, historical=historical, **params):
            if hit.chunk_id in seen:
                continue
            seen.add(hit.chunk_id)
            hit.signals["graph"] = 1.0
            out.append(hit)
            if len(out) >= limit:
                break
    return out


def neighbourhood(session: Session, ref: str) -> dict:
    """What /graph/{ref} returns: the entity, and every edge it takes part in
    with the provision that edge rests on."""
    kind, _, key = ref.partition(":")
    entity = session.execute(
        select(KgEntity).where(KgEntity.kind == kind, KgEntity.key == key)
    ).scalar_one_or_none()
    if entity is None:
        return {}

    labels = {e.id: e for e in session.execute(select(KgEntity)).scalars()}
    edges = edges_for(session, [ref])
    return {
        "entity": {"kind": entity.kind, "key": entity.key, "label": entity.label},
        "edges": [
            {
                "subject": f"{labels[e.subject_id].kind}:{labels[e.subject_id].key}",
                "subject_label": labels[e.subject_id].label,
                "predicate": e.predicate,
                "object": f"{labels[e.object_id].kind}:{labels[e.object_id].key}",
                "object_label": labels[e.object_id].label,
                "cite_source_id": e.cite_source_id,
                "cite_locator": e.cite_locator,
                "note": e.note,
            }
            for e in edges
        ],
    }
