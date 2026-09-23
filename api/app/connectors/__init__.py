"""Connectors to databases outside the corpus.

Free official databases come first, and most of them are links, not APIs: IP
India, TKDL and PATENTSCOPE publish no public query API, and the web says so
next to each link (src/data/connectors.ts). Where a public record is worth
citing, it enters the corpus as a version-tracked snapshot through
`corpus/manifest.yaml` — as WIPO's list of depositary authorities did — rather
than through a second, unversioned cache.

A paid or credentialed source is reached only here, and only like this:

- with the person's **own** credential, sent with the request and never stored;
- after they have granted consent for that connector (`connector:<id>` in the
  consent ledger), which they can revoke like any other;
- with one audit row per call that records the connector and the result count —
  never the token and never the query text, only its hash.

The Lens is the one wired up: its patent API is free for non-commercial use and
paid for commercial use, so it is exactly the case the problem statement means.
Written to the published request and response formats at docs.api.lens.org
(checked 2026-09-23); not yet called with a real token.
"""

import hashlib
from dataclasses import dataclass

import httpx

LENS_SEARCH_URL = "https://api.lens.org/patent/search"

#: The connectors that need consent, by id. The consent scope is `connector:<id>`.
CREDENTIALED = {
    "lens": {
        "name": "The Lens — patent search",
        "url": "https://www.lens.org/",
        "docs": "https://docs.api.lens.org/",
        "credential": "your own Lens API token (Lens profile → Subscriptions)",
        "cost": "free for non-commercial use; a paid plan for commercial use",
    }
}


class ConnectorError(Exception):
    """The remote service refused or failed. Carries a status for the route."""

    def __init__(self, status: int, message: str) -> None:
        super().__init__(message)
        self.status = status


@dataclass
class PatentHit:
    lens_id: str
    jurisdiction: str
    doc_number: str
    kind: str
    date_published: str
    title: str
    url: str


def query_hash(query: str) -> str:
    """What the audit log records instead of the query itself."""
    return hashlib.sha256(query.strip().lower().encode()).hexdigest()[:16]


def _title(record: dict) -> str:
    titles = (record.get("biblio") or {}).get("invention_title") or []
    english = [t.get("text") for t in titles if (t.get("lang") or "").lower() == "en"]
    return (english or [t.get("text") for t in titles] or [""])[0] or ""


def lens_search(
    token: str, query: str, size: int = 10, client: httpx.Client | None = None
) -> tuple[int, list[PatentHit]]:
    """One patent search on the person's own Lens token. Nothing is kept."""
    body = {
        "query": query,
        "size": size,
        "include": [
            "lens_id",
            "jurisdiction",
            "doc_number",
            "kind",
            "date_published",
            "biblio.invention_title",
        ],
    }
    own = client is None
    client = client or httpx.Client(timeout=30)
    try:
        response = client.post(
            LENS_SEARCH_URL, json=body, headers={"Authorization": f"Bearer {token}"}
        )
    except httpx.HTTPError as e:
        raise ConnectorError(502, f"The Lens could not be reached ({e.__class__.__name__})") from e
    finally:
        if own:
            client.close()
    if response.status_code in (401, 403):
        raise ConnectorError(401, "The Lens did not accept that token")
    if response.status_code == 429:
        raise ConnectorError(429, "The Lens rate limit was reached; try again in a minute")
    if response.status_code >= 400:
        raise ConnectorError(502, f"The Lens answered {response.status_code}")
    payload = response.json()
    hits = [
        PatentHit(
            lens_id=r.get("lens_id", ""),
            jurisdiction=r.get("jurisdiction", ""),
            doc_number=r.get("doc_number", ""),
            kind=r.get("kind", ""),
            date_published=r.get("date_published", ""),
            title=_title(r),
            url=f"https://www.lens.org/lens/patent/{r.get('lens_id', '')}",
        )
        for r in payload.get("data", [])
    ]
    return int(payload.get("total", len(hits))), hits
