"""The tools the agent may call.

Every tool is **read-only** and local. Nothing here writes a row, files a
ticket, spends money or reaches the network: a model that can act on the
world is a different risk from a model that can look things up, and the
problem statement's escalation and paid-connector paths are actions a person
takes, not actions a model takes on their behalf.

Each tool returns a string, because that is what goes back into the
conversation. Corpus text handed back is untrusted data — the same rule as
the answer path, and the reason the agent's system prompt says so out loud.
"""

import json
from functools import lru_cache

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.classify.rules import ClassifyRequest, abs_check, classify
from app.db.models import MaterialIpr, Registry
from app.graph.expand import neighbourhood
from app.llm.base import ToolSpec
from app.retrieval.hybrid import search

#: How much of a chunk the model sees per hit. Enough to quote from, short
#: enough that eight hits do not fill the window.
SNIPPET = 900


@lru_cache
def profiled_materials() -> str:
    """Which materials have a stored profile, as "kind: id, id; kind: …".

    The model cannot look up a profile it does not know the id of — the first
    live run asked about "red coral" and never tried, because nothing told it
    the coral is `animal/pravala`. The list comes from the same exported file
    the profile table is seeded from, so it can never name one that is absent.
    """
    try:
        from app.materials import load_profiles

        by_kind: dict[str, list[str]] = {}
        for kind, material_id, _ in load_profiles():
            by_kind.setdefault(kind, []).append(material_id)
    except Exception:  # noqa: BLE001 - a missing file leaves the tool usable, just unlisted
        return ""
    return "; ".join(f"{kind}: {', '.join(sorted(ids))}" for kind, ids in sorted(by_kind.items()))


def specs() -> list[ToolSpec]:
    """What the model is told it can do."""
    return [
        ToolSpec(
            name="search_corpus",
            description=(
                "Search the version-tracked corpus of statutes, rules and treaties. "
                "Returns passages with their source id and locator. Use it for every legal "
                "point: nothing may be stated without a passage from here."
            ),
            parameters={
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "What to look for, in English."},
                    "jurisdiction": {
                        "type": "string",
                        "enum": ["IN", "INTL"],
                        "description": "India or international. Never mix the two in one search.",
                    },
                },
                "required": ["query", "jurisdiction"],
            },
        ),
        ToolSpec(
            name="graph_neighbors",
            description=(
                "The knowledge graph's edges for an entity, each with the provision it rests on. "
                'Entities look like "concept:micro-organism", "regime:abs" or '
                '"source:in-patents-act-1970". Use it to find which law reaches a kind of thing.'
            ),
            parameters={
                "type": "object",
                "properties": {"entity": {"type": "string"}},
                "required": ["entity"],
            },
        ),
        ToolSpec(
            name="classify_formulation",
            description=(
                "The formulation classifier. Send the yes/no answers you have so far and get "
                "either the next question to ask or the category, with what it requires and its "
                "IP and ABS posture. The branch comes from a rule table, not from you."
            ),
            parameters={
                "type": "object",
                "properties": {
                    "answers": {
                        "type": "object",
                        "description": 'Question id to true/false, e.g. {"exact_classical": true}',
                        "additionalProperties": {"type": "boolean"},
                    }
                },
                "required": ["answers"],
            },
        ),
        ToolSpec(
            name="abs_check",
            description=(
                "The access-and-benefit-sharing helper. Same shape as the classifier: answers in, "
                "next question or the route out (NBA approval, State Board intimation, exemption)."
            ),
            parameters={
                "type": "object",
                "properties": {
                    "answers": {
                        "type": "object",
                        "additionalProperties": {"type": "boolean"},
                    }
                },
                "required": ["answers"],
            },
        ),
        ToolSpec(
            name="lookup_material_ipr",
            description=(
                "The stored IP profile of one source material (plant, microbe, animal or mineral). "
                "Fields that nobody has verified come back as 'unknown' and must be reported as "
                "unknown, never filled in. Each field names the manifest source it rests on; "
                "confirm a legal point with search_corpus before stating it. Profiles exist for "
                f"{profiled_materials() or 'no materials yet'}."
            ),
            parameters={
                "type": "object",
                "properties": {
                    "kind": {"type": "string", "enum": ["plant", "microbe", "animal", "mineral"]},
                    "material_id": {"type": "string"},
                },
                "required": ["kind", "material_id"],
            },
        ),
        ToolSpec(
            name="registry_pointer",
            description=(
                "Registries, forms and links for a regime — where the user goes next. Returns "
                "nothing when no registry has been verified for it yet, which is an honest answer."
            ),
            parameters={
                "type": "object",
                "properties": {
                    "regime": {"type": "string"},
                    "jurisdiction": {"type": "string", "enum": ["IN", "INTL"]},
                },
                "required": ["regime"],
            },
        ),
    ]


class Toolbox:
    """Runs a named tool. One instance per request: it holds the session and
    the services the tools need, and records what was retrieved so the caller
    can verify the answer against the same passages the model saw."""

    def __init__(self, session: Session, embedder, reranker=None) -> None:
        self.session = session
        self.embedder = embedder
        self.reranker = reranker
        #: Every passage handed to the model, keyed by chunk id.
        self.seen: dict[int, object] = {}
        #: Calls already made, so the same one twice gets a nudge, not a rerun.
        self.made: set[str] = set()

    def run(self, name: str, args: dict) -> str:
        handler = getattr(self, f"_{name}", None)
        if handler is None:
            return f"error: no tool called {name!r}"
        # A model that gets an unhelpful result tends to ask again in the same
        # words until the cap; the live run did it six times. Saying so costs a
        # turn and usually turns it towards another query or another tool.
        key = f"{name}:{json.dumps(args, sort_keys=True, ensure_ascii=False)}"
        if key in self.made:
            return (
                "You already made exactly this call; its result is above. Rephrase the query, "
                "or use a different tool (graph_neighbors, lookup_material_ipr)."
            )
        self.made.add(key)
        try:
            return handler(args)
        except Exception as e:  # noqa: BLE001 - a broken tool must not end the conversation
            return f"error: {name} failed ({e.__class__.__name__})"

    # --- the tools ---------------------------------------------------------

    def _search_corpus(self, args: dict) -> str:
        jurisdiction = args.get("jurisdiction", "IN")
        hits = search(
            self.session,
            str(args.get("query", "")),
            jurisdiction,
            self.embedder,
            self.reranker,
            top_k=6,
        )
        for hit in hits:
            self.seen[hit.chunk_id] = hit
        if not hits:
            return "no passages found"
        return json.dumps(
            [
                {
                    "chunk_id": h.chunk_id,
                    "source_id": h.source_id,
                    "source_title": h.source_title,
                    "locator": h.locator,
                    "jurisdiction": h.jurisdiction,
                    "text": h.text[:SNIPPET],
                }
                for h in hits
            ],
            ensure_ascii=False,
        )

    def _graph_neighbors(self, args: dict) -> str:
        out = neighbourhood(self.session, str(args.get("entity", "")))
        return json.dumps(out, ensure_ascii=False) if out else "no such entity in the graph"

    def _classify_formulation(self, args: dict) -> str:
        step = classify(ClassifyRequest(answers=dict(args.get("answers") or {})))
        return step.model_dump_json()

    def _abs_check(self, args: dict) -> str:
        step = abs_check(ClassifyRequest(answers=dict(args.get("answers") or {})))
        return step.model_dump_json()

    def _lookup_material_ipr(self, args: dict) -> str:
        row = self.session.get(MaterialIpr, (args.get("kind"), args.get("material_id")))
        if row is None:
            return "no verified profile for this material yet"
        return json.dumps(row.profile, ensure_ascii=False)

    def _registry_pointer(self, args: dict) -> str:
        query = select(Registry).where(Registry.regime.any(str(args.get("regime", ""))))
        if args.get("jurisdiction"):
            query = query.where(Registry.jurisdiction == args["jurisdiction"])
        rows = list(self.session.execute(query.order_by(Registry.name)).scalars())
        if not rows:
            return "no verified registry for that regime yet"
        return json.dumps(
            [
                {"name": r.name, "url": r.url, "forms": r.forms, "fee_note": r.fee_note}
                for r in rows
            ],
            ensure_ascii=False,
        )
