"""python -m app.registry seed   # write the verified registries into the database"""

import sys

from app.db import SessionLocal
from app.registry import seed_registries


def main(argv: list[str]) -> int:
    if (argv[1] if len(argv) > 1 else "seed") != "seed":
        print(__doc__)
        return 2
    session = SessionLocal()
    try:
        counts = seed_registries(session)
        print(
            f"registries seeded: {counts['registries']} "
            f"({counts['unresolved']} whose cite is not in this database)"
        )
        return 0
    finally:
        session.close()


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
