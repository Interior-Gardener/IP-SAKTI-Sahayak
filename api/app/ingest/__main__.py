"""Corpus ingest CLI.

python -m app.ingest fetch      [--only ID ...]
python -m app.ingest normalise  [--only ID ...] [--no-ocr]
python -m app.ingest chunk      [--only ID ...]   # parse + chunk, print counts, no DB
python -m app.ingest run        [--only ID ...] [--no-ocr]  # fetch -> ... -> Postgres
"""

import argparse
import sys
from pathlib import Path

from app.ingest.chunk import chunk_units
from app.ingest.fetch import fetch_source, sha256_of
from app.ingest.manifest import MANIFEST, REPO, ManifestSource, load_manifest
from app.ingest.normalise import normalise_source
from app.ingest.structure import parse_units


def drafts_for(source: ManifestSource):
    text = (REPO / "corpus" / "normalised" / f"{source.id}.txt").read_text(encoding="utf-8")
    return chunk_units(parse_units(text, source.doc_type, source.language), source.title)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="python -m app.ingest")
    parser.add_argument("command", choices=["fetch", "normalise", "chunk", "run"])
    parser.add_argument("--manifest", default=str(MANIFEST))
    parser.add_argument("--only", nargs="*", help="source ids to process")
    parser.add_argument("--no-ocr", action="store_true")
    args = parser.parse_args(argv)

    manifest = load_manifest(Path(args.manifest))
    sources = [s for s in manifest.sources if not args.only or s.id in args.only]
    failures = 0

    session = embedder = None
    if args.command == "run":
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
        if args.command in ("chunk", "run"):
            try:
                drafts = drafts_for(source)
            except FileNotFoundError:
                print(f"chunk     {source.id:36} skipped (not normalised)")
                continue
            print(f"chunk     {source.id:36} {len(drafts):5} chunks", flush=True)
        if args.command == "run":
            from app.ingest.upsert import upsert_source

            u = upsert_source(session, source, sha256_of(source.raw_path()), drafts, embedder)
            print(f"upsert    {source.id:36} {u.outcome:12} version={u.version_id}", flush=True)

    if session is not None:
        session.close()
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
