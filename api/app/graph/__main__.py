"""Seed the knowledge graph.

    python -m app.graph seed        # write (or refresh) the seed
    python -m app.graph show <ref>  # one entity and its edges, as /graph returns them

Seeding is idempotent, so it is safe to run on every deploy — and it should
be, because the seed is code and the database should follow it.
"""

import json
import sys

from app.db import SessionLocal
from app.graph.expand import neighbourhood
from app.graph.seed import seed_graph


def main(argv: list[str]) -> int:
    command = argv[1] if len(argv) > 1 else "seed"
    session = SessionLocal()
    try:
        if command == "seed":
            counts = seed_graph(session)
            print(f"graph seeded: {counts['entities']} new entities, {counts['edges']} new edges")
            return 0
        if command == "show" and len(argv) > 2:
            out = neighbourhood(session, argv[2])
            if not out:
                print(f"no entity {argv[2]!r}")
                return 1
            print(json.dumps(out, indent=2, ensure_ascii=False))
            return 0
        print(__doc__)
        return 2
    finally:
        session.close()


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
