"""Chunk locators straight from corpus/normalised/, with no database.

The ingest parser decides what a chunk is called ("s.3", "Rule 158B",
"Art. 27.3", "Schedule E(1)"), and a golden item is only as good as the locator
it expects. This runs the same parser and chunker over the normalised text so
you can look a locator up, or check the whole golden set, before you have a
database or a GPU.

    python scripts/locators.py in-patents-act-1970                # every locator
    python scripts/locators.py in-patents-act-1970 s.3            # locators containing "s.3"
    python scripts/locators.py in-wlpa-1972 --grep "export permit"  # which chunk holds a phrase
    python scripts/locators.py --check-golden                     # every expected (source, locator)

`--check-golden` exits non-zero when an item expects something the corpus does
not have, which is the cheapest way to catch a golden item written from memory.
Run it from the api/ directory (or with api/ on PYTHONPATH).
"""

import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.ingest.chunk import chunk_units  # noqa: E402
from app.ingest.manifest import REPO, load_manifest  # noqa: E402
from app.ingest.structure import parse_units  # noqa: E402
from app.retrieval.hybrid import locator_matches  # noqa: E402

NORMALISED = REPO / "corpus" / "normalised"
GOLDEN = REPO / "eval" / "golden"


def flat(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def chunks_for(source_id: str):
    """The chunks ingest would write for this source, parsed from the text in git."""
    source = load_manifest().get(source_id)
    path = NORMALISED / f"{source_id}.txt"
    if not path.exists():
        raise SystemExit(f"{path} is missing — run `python -m app.ingest normalise` first")
    units = parse_units(path.read_text(encoding="utf-8"), source.doc_type, source.language)
    return source, chunk_units(units, source.title)


def show(source_id: str, needle: str | None) -> None:
    source, chunks = chunks_for(source_id)
    print(f"{source_id}: {len(chunks)} chunks ({source.doc_type}, {source.jurisdiction})")
    for c in chunks:
        if needle is None or needle.lower() in c.locator.lower():
            print(f"  {c.locator!r:24} | {c.heading_path[:70]:72} | {flat(c.text)[:100]}")


def grep(source_id: str, phrase: str) -> None:
    source, chunks = chunks_for(source_id)
    needle = flat(phrase).lower()
    print(f"{source_id}: {len(chunks)} chunks ({source.doc_type}, {source.jurisdiction})")
    for c in chunks:
        body = flat(c.text)
        if needle in body.lower() or needle in flat(c.heading_path).lower():
            at = body.lower().find(needle)
            print(f"  {c.locator!r} | {c.heading_path}")
            print(f"      ...{body[max(0, at - 100) : at + 300]}...")


def check_golden() -> int:
    """Every (source, locator) a golden item expects must exist in the corpus."""
    wanted: dict[str, set[str]] = {}
    items = 0
    for path in sorted(GOLDEN.glob("*.jsonl")):
        for line in path.read_text(encoding="utf-8").splitlines():
            if not line.strip():
                continue
            item = json.loads(line)
            items += 1
            for side in (item.get("expected") or {}).values():
                for source_id in side.get("sources", []):
                    # An item with no locators still says the source must exist.
                    wanted.setdefault(source_id, set()).update(side.get("locators", []))

    problems: list[str] = []
    for source_id, locators in sorted(wanted.items()):
        try:
            _, chunks = chunks_for(source_id)
        except (KeyError, SystemExit) as e:
            problems.append(f"{source_id}: {e}")
            continue
        have = [c.locator for c in chunks]
        for locator in sorted(locators):
            if not any(locator_matches(locator, actual) for actual in have):
                stem = locator.split("(")[0][:4].lower()
                near = [a for a in have if a.lower().startswith(stem)][:6]
                problems.append(
                    f"{source_id}: no chunk matches expected locator {locator!r}"
                    + (f" (nearest: {near})" if near else "")
                )

    if problems:
        print(f"golden set check failed ({len(problems)}):\n")
        for p in problems:
            print(f"  - {p}")
        return 1
    print(
        f"golden set check passed: {items} items, "
        f"{sum(len(v) for v in wanted.values())} expected locators across {len(wanted)} sources."
    )
    return 0


def main() -> int:
    args = sys.argv[1:]
    if not args or args[0] in {"-h", "--help"}:
        print(__doc__)
        return 0
    if args[0] == "--check-golden":
        return check_golden()
    source_id = args[0]
    if len(args) > 2 and args[1] == "--grep":
        grep(source_id, args[2])
    else:
        show(source_id, args[1] if len(args) > 1 else None)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
