"""python -m app.materials seed   # load profiles.json into material_ipr"""

import sys

from app.db import SessionLocal
from app.materials import seed_profiles


def main(argv: list[str]) -> int:
    if (argv[1] if len(argv) > 1 else "seed") != "seed":
        print(__doc__)
        return 2
    session = SessionLocal()
    try:
        print(f"material profiles seeded: {seed_profiles(session)}")
        return 0
    finally:
        session.close()


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
