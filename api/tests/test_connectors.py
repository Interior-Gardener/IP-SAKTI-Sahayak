"""The credentialed connector: The Lens, on the person's own token.

The HTTP call is faked with a response in the documented shape
(docs.api.lens.org, response-patent). What these hold is the contract the
problem statement asks for: paid sources only with explicit permission, and a
log of every call that never holds the credential.
"""

import json

import httpx
from fastapi.testclient import TestClient
from sqlalchemy import select

from app import connectors
from app.db.models import AuditEvent
from app.main import app

SAMPLE = {
    "total": 1,
    "max_score": 16.8,
    "data": [
        {
            "lens_id": "031-156-664-516-153",
            "jurisdiction": "EP",
            "doc_number": "2471949",
            "kind": "A1",
            "date_published": "2012-07-04",
            "biblio": {
                "invention_title": [
                    {"text": "Titre", "lang": "fr"},
                    {"text": "Neem extract", "lang": "en"},
                ]
            },
        }
    ],
}


def _client(status=200, body=SAMPLE, seen=None):
    def handler(request: httpx.Request) -> httpx.Response:
        if seen is not None:
            seen.append(request)
        return httpx.Response(status, json=body)

    return httpx.Client(transport=httpx.MockTransport(handler))


def test_lens_search_sends_the_documented_request_and_reads_the_response():
    seen = []
    total, hits = connectors.lens_search("tok-123", "neem AND pesticide", 5, _client(seen=seen))
    sent = json.loads(seen[0].content)
    assert seen[0].url == connectors.LENS_SEARCH_URL
    assert seen[0].headers["Authorization"] == "Bearer tok-123"
    assert sent["query"] == "neem AND pesticide" and sent["size"] == 5
    assert total == 1 and hits[0].title == "Neem extract"  # the English title, not the first
    assert hits[0].url.endswith("031-156-664-516-153")


def test_a_rejected_token_is_a_401_not_a_crash():
    try:
        connectors.lens_search("bad", "neem", client=_client(status=401, body={}))
    except connectors.ConnectorError as e:
        assert e.status == 401
    else:
        raise AssertionError("expected ConnectorError")


def test_the_route_needs_consent_and_never_logs_the_token(db_session, monkeypatch):
    monkeypatch.setattr(
        connectors,
        "lens_search",
        lambda token, query, size: (
            1,
            [connectors.PatentHit("1", "IN", "2", "A", "2020", "t", "u")],
        ),
    )
    client = TestClient(app)
    h = {"X-Session-Id": "connector-test-session", "X-Connector-Token": "secret-token-xyz"}
    body = {"query": "Azadirachta indica"}

    # Consent to the assistant is not consent to a paid connector.
    client.post("/consent", json={"scope": "assistant", "granted": True}, headers=h)
    assert client.post("/connectors/lens/search", json=body, headers=h).status_code == 403

    client.post("/consent", json={"scope": "connector:lens", "granted": True}, headers=h)
    assert client.get("/consent", headers=h).json()["connectors"] == {"lens": True}
    r = client.post("/connectors/lens/search", json=body, headers=h)
    assert r.status_code == 200 and r.json()["total"] == 1

    rows = db_session.scalars(
        select(AuditEvent).where(
            AuditEvent.session_id == h["X-Session-Id"], AuditEvent.kind == "connector_call"
        )
    ).all()
    logged = json.dumps([row.payload for row in rows])
    assert rows and "secret-token-xyz" not in logged and "Azadirachta" not in logged
    assert rows[-1].payload["query_hash"] == connectors.query_hash("Azadirachta indica")
    client.delete("/me", headers=h)
