"""Write the verified registries to src/data/registries.json for the web.

The registries are written once, in api/app/registry, where the tests re-read
every quote from the corpus. Registry Marg has to work with the API down, so
the web reads this export rather than /registry; CI runs `--check` so the two
can never drift.

    python scripts/export_registries.py          # write
    python scripts/export_registries.py --check  # fail if the file is stale
"""

import json
import sys
from dataclasses import asdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.registry import CHECKED_ON, REGISTRIES  # noqa: E402

TARGET = Path(__file__).resolve().parents[2] / "src" / "data" / "registries.json"


def render() -> str:
    body = {"checked_on": CHECKED_ON, "registries": [asdict(r) for r in REGISTRIES]}
    return json.dumps(body, indent=2, ensure_ascii=False) + "\n"


def main() -> int:
    text = render()
    if "--check" in sys.argv:
        current = TARGET.read_text(encoding="utf-8") if TARGET.exists() else ""
        if current != text:
            print("src/data/registries.json is out of date: run scripts/export_registries.py")
            return 1
        print(f"registries.json is current: {len(REGISTRIES)} registries.")
        return 0
    TARGET.write_text(text, encoding="utf-8", newline="\n")
    print(f"wrote {len(REGISTRIES)} registries to src/data/registries.json")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
