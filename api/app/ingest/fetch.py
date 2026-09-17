"""Download a manifest source into corpus/raw/<id>.<format> and hash it.

`fetch: manual` sources are never downloaded; their file must already be in
corpus/raw (saved from a browser), and is only hashed here.
"""

import hashlib
from dataclasses import dataclass
from pathlib import Path
from typing import Literal

import httpx

from app.ingest.manifest import REPO, ManifestSource

# Several government sites refuse requests without a browser-like agent.
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/128 Safari/537.36 VanaspatiSahayak-ingest"
)

Status = Literal["downloaded", "unchanged", "manual_present", "manual_missing", "failed"]


@dataclass(frozen=True)
class FetchResult:
    source_id: str
    status: Status
    path: Path | None = None
    sha256: str | None = None
    detail: str = ""


def sha256_of(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for block in iter(lambda: f.read(1 << 20), b""):
            h.update(block)
    return h.hexdigest()


def looks_like(fmt: str, body: bytes) -> bool:
    """Sites often answer a missing file with an HTML page and status 200."""
    if fmt == "pdf":
        return body.lstrip()[:5] == b"%PDF-"
    head = body[:2048].lower()
    return b"<html" in head or b"<!doctype html" in head


def fetch_source(
    source: ManifestSource, root: Path = REPO, client: httpx.Client | None = None
) -> FetchResult:
    path = source.raw_path(root)
    path.parent.mkdir(parents=True, exist_ok=True)

    if source.fetch == "manual":
        if path.exists():
            return FetchResult(source.id, "manual_present", path, sha256_of(path))
        return FetchResult(
            source.id, "manual_missing", detail=f"save it by hand as {path.relative_to(root)}"
        )

    own_client = client is None
    client = client or httpx.Client(
        headers={"User-Agent": USER_AGENT}, timeout=120, follow_redirects=True
    )
    try:
        res = client.get(str(source.fetch_url))
        res.raise_for_status()
    except httpx.HTTPError as e:
        return FetchResult(source.id, "failed", detail=str(e))
    finally:
        if own_client:
            client.close()

    if not looks_like(source.format, res.content):
        return FetchResult(source.id, "failed", detail=f"response is not a {source.format} file")

    new_hash = hashlib.sha256(res.content).hexdigest()
    if path.exists() and sha256_of(path) == new_hash:
        return FetchResult(source.id, "unchanged", path, new_hash)
    path.write_bytes(res.content)
    return FetchResult(source.id, "downloaded", path, new_hash)
