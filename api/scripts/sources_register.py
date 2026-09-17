"""Write docs/SOURCES.md: where every corpus document came from and where its data lives.

    python scripts/sources_register.py

Built from corpus/manifest.yaml, the files in corpus/raw and corpus/normalised, and the
database, so it always matches what is really ingested. Rerun after any ingest.
"""

import hashlib
import re
from datetime import date
from pathlib import Path

from sqlalchemy import text

from app.db import SessionLocal
from app.ingest.manifest import REPO, load_manifest

OUT = REPO / "docs" / "SOURCES.md"

# How manual files were obtained. Keep this in step with corpus/CHANGELOG.md.
MANUAL_PROVENANCE = {
    "in-patents-amendment-rules-2024": "Downloaded by Tushar on 2026-09-17 from the WIPO Lex details page (English PDF, file `in195en…`), renamed.",
    "intl-paris-convention": "Downloaded by Tushar on 2026-09-17 from the WIPO Lex treaty page (English PDF).",
    "intl-budapest-treaty": "Downloaded by Tushar on 2026-09-17 from the WIPO Lex treaty page (English PDF).",
    "intl-eu-thmpd-2004-24": "Downloaded by Tushar on 2026-09-17 from the EU Publications Office search (op.europa.eu, EU law collection, PDF), because EUR-Lex was partly down.",
}  # fmt: skip


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def pages(normalised: Path) -> int:
    return len(re.findall(r"^<<page \d+>>$", normalised.read_text(encoding="utf-8"), re.M))


def main() -> None:
    manifest = load_manifest()
    with SessionLocal() as s:
        rows = s.execute(
            text(
                "SELECT sv.source_id, sv.id, sv.sha256, sv.retrieved_at, count(c.id) "
                "FROM source_versions sv LEFT JOIN chunks c ON c.source_version_id = sv.id "
                "WHERE NOT sv.superseded GROUP BY sv.source_id, sv.id"
            )
        ).all()
    db = {r[0]: r for r in rows}

    lines = [
        "# Sources register",
        "",
        f"Generated {date.today().isoformat()} by `api/scripts/sources_register.py` from `corpus/manifest.yaml`, "
        "the files on disk and the database. **Do not edit by hand; rerun the script after ingest.**",
        "",
        "Where the data lives, for every source:",
        "",
        "- **Official page** (`url`): what a person should open and what citations link to.",
        "- **Downloaded from** (`fetch_url`): the exact file ingest fetched, or how it was saved by hand.",
        "- **Raw file**: `corpus/raw/<id>.<format>` (not in git; the sha256 below identifies the exact copy).",
        "- **Text**: `corpus/normalised/<id>.txt` (in git), page breaks marked `<<page N>>`.",
        "- **Database**: table `sources` (row `id`), `source_versions` (row below, matched by sha256), "
        "`chunks` (one row per section/rule/article piece, with its embedding).",
        "",
        "A raw file whose sha256 differs from the database has changed since ingest: rerun `python -m app.ingest run --only <id>`.",
        "",
    ]
    totals = {"sources": 0, "chunks": 0}
    for jur, heading in (("IN", "India"), ("INTL", "International")):
        lines += [f"## {heading}", ""]
        for src in [x for x in manifest.sources if x.jurisdiction == jur]:
            raw = src.raw_path()
            norm = REPO / "corpus" / "normalised" / f"{src.id}.txt"
            row = db.get(src.id)
            raw_hash = sha256(raw) if raw.exists() else None
            if src.fetch == "auto":
                how = f"Automatic download by ingest from <{src.fetch_url}>"
            else:
                how = MANUAL_PROVENANCE.get(
                    src.id,
                    "Manual download (provenance not recorded — add it to MANUAL_PROVENANCE)",
                )
            status = (
                "ingested" if row else ("file present, not ingested" if raw.exists() else "missing")
            )
            if row and raw_hash and row[2] != raw_hash:
                status = "raw file changed since ingest"
            lines += [
                f"### {src.title}",
                "",
                "| | |",
                "|---|---|",
                f"| Id | `{src.id}` |",
                f"| Status | {status} |",
                f"| Issuer | {src.issuer} |",
                f"| Type / regimes | {src.doc_type} / {', '.join(src.regime)} |",
                f"| Official page | <{src.url}> |",
                f"| Obtained | {how} |",
                f"| Version | {src.version_label}"
                + (f" (issued {src.issued})" if src.issued else "")
                + " |",
                f"| Licence | {src.licence} |",
                f"| Raw file | `{raw.relative_to(REPO).as_posix()}`"
                + (
                    f", {raw.stat().st_size // 1024} KB, sha256 `{raw_hash[:16]}…`"
                    if raw_hash
                    else " (not present)"
                )
                + " |",
                f"| Text | `{norm.relative_to(REPO).as_posix()}`"
                + (f", {pages(norm)} pages" if norm.exists() else " (not present)")
                + " |",
                "| Database | "
                + (
                    f"source_versions.id = {row[1]}, retrieved {row[3]:%Y-%m-%d %H:%M}, {row[4]} chunks"
                    if row
                    else "not ingested"
                )
                + " |",
            ]
            if src.notes:
                lines.append(f"| Notes | {src.notes} |")
            lines.append("")
            if row:
                totals["sources"] += 1
                totals["chunks"] += row[4]
    lines.insert(
        4,
        f"**Ingested: {totals['sources']} of {len(manifest.sources)} sources, {totals['chunks']} chunks.**\n",
    )
    OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"wrote {OUT} ({totals['sources']} sources, {totals['chunks']} chunks)")


if __name__ == "__main__":
    main()
