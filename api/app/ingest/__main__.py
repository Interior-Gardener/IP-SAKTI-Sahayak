"""Corpus ingest CLI.

python -m app.ingest fetch      [--only ID ...]
python -m app.ingest normalise  [--only ID ...] [--no-ocr]
python -m app.ingest chunk      [--only ID ...]   # parse + chunk, print counts, no DB
python -m app.ingest run        [--only ID ...] [--no-ocr]  # fetch -> ... -> Postgres
python -m app.ingest load       [--only ID ...] [--rechunk] # committed text -> Postgres

`load` skips fetch and normalise and ingests `corpus/normalised/` as committed: the text
every quote check and golden item was verified against. It is how a fresh database is
filled on a machine without the raw PDFs, including the four sources that can only be
downloaded by hand. The version is keyed by the raw file's hash when the raw file is
present, and by the hash of the normalised text when it is not.
"""

import argparse
import hashlib
import sys
from pathlib import Path

from app.ingest.chunk import chunk_units
from app.ingest.fetch import fetch_source, sha256_of
from app.ingest.manifest import MANIFEST, REPO, ManifestSource, load_manifest
from app.ingest.normalise import normalise_source
from app.ingest.structure import parse_units


def skip_to(text: str, first_line: str) -> str:
    """Drop everything before the first line equal to `first_line`, keeping the page marker
    in force at that point so page numbers stay right."""
    lines = text.splitlines()
    page = "<<page 1>>"
    for i, line in enumerate(lines):
        if line.startswith("<<page "):
            page = line
        elif line.strip() == first_line:
            return "\n".join([page, *lines[i:]])
    raise ValueError(f"text_start line not found: {first_line!r}")


def drafts_for(source: ManifestSource):
    text = (REPO / "corpus" / "normalised" / f"{source.id}.txt").read_text(encoding="utf-8")
    if source.text_start:
        text = skip_to(text, source.text_start)
    return chunk_units(parse_units(text, source.doc_type, source.language), source.title)


def version_hash(source: ManifestSource) -> str:
    raw = source.raw_path()
    if raw.exists():
        return sha256_of(raw)
    text = REPO / "corpus" / "normalised" / f"{source.id}.txt"
    return hashlib.sha256(text.read_bytes()).hexdigest()


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="python -m app.ingest")
    parser.add_argument("command", choices=["fetch", "normalise", "chunk", "run", "load"])
    parser.add_argument("--manifest", default=str(MANIFEST))
    parser.add_argument("--only", nargs="*", help="source ids to process")
    parser.add_argument("--no-ocr", action="store_true")
    parser.add_argument(
        "--rechunk", action="store_true", help="replace chunks of unchanged files (parser updates)"
    )
    args = parser.parse_args(argv)

    manifest = load_manifest(Path(args.manifest))
    sources = [s for s in manifest.sources if not args.only or s.id in args.only]
    failures = 0

    session = embedder = None
    if args.command in ("run", "load"):
        from app.db import SessionLocal
        from app.embed.base import get_embedder

        session = SessionLocal()
        embedder = get_embedder()
        print(f"embedding with {embedder.model} ({embedder.dim} dims)")

    for source in sources:
        if args.command in ("fetch", "run"):
            r = fetch_source(source)
            print(f"fetch     {source.id:36} {r.status:15} {r.detail}", flush=True)
            if r.status == "failed":
                failures += 1
                continue
            if r.status == "manual_missing":
                continue
        if args.command in ("normalise", "run"):
            try:
                n = normalise_source(source, ocr=not args.no_ocr)
            except FileNotFoundError as e:
                print(f"normalise {source.id:36} skipped         {e}")
                continue
            print(f"normalise {source.id:36} {n.pages:4} pages {n.ocr_pages:3} ocr", flush=True)
        if args.command in ("chunk", "run", "load"):
            try:
                drafts = drafts_for(source)
            except FileNotFoundError:
                print(f"chunk     {source.id:36} skipped (not normalised)")
                continue
            print(f"chunk     {source.id:36} {len(drafts):5} chunks", flush=True)
        if args.command in ("run", "load"):
            from app.ingest.upsert import upsert_source

            u = upsert_source(
                session,
                source,
                sha256_of(source.raw_path()) if args.command == "run" else version_hash(source),
                drafts,
                embedder,
                rechunk=args.rechunk,
            )
            print(f"upsert    {source.id:36} {u.outcome:12} version={u.version_id}", flush=True)

    if session is not None:
        session.close()
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
