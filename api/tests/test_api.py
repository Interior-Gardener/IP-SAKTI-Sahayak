import uuid

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client(db_session):
    return TestClient(app)


def headers():
    return {"X-Session-Id": f"test-{uuid.uuid4().hex}"}


def test_ask_requires_consent(client):
    r = client.post("/ask", json={"question": "Can I patent turmeric?"}, headers=headers())
    assert r.status_code == 403 and r.json()["detail"] == "consent_required"


def test_session_header_is_required_and_validated(client):
    assert client.get("/consent").status_code == 422
    assert client.get("/consent", headers={"X-Session-Id": "bad id!"}).status_code == 400


def test_consent_grant_revoke_and_purge(client):
    h = headers()
    assert client.post(
        "/consent", json={"scope": "assistant", "granted": True}, headers=h
    ).json() == {
        "assistant": True,
        "transcript": False,
        # Consent to the assistant grants no paid connector.
        "connectors": {"lens": False},
    }
    assert (
        client.post("/consent", json={"scope": "assistant", "granted": False}, headers=h).json()[
            "assistant"
        ]
        is False
    )
    client.post("/consent", json={"scope": "transcript", "granted": True}, headers=h)
    r = client.post("/escalate", json={"message": "please check"}, headers=h)
    assert r.status_code == 200 and r.json()["ticket_id"]
    deleted = client.delete("/me", headers=h).json()["deleted"]
    assert (
        deleted["consent_grants"] >= 2
        and deleted["escalations"] == 1
        and deleted["audit_events"] >= 1
    )
    assert client.get("/consent", headers=h).json() == {
        "assistant": False,
        "transcript": False,
        "connectors": {"lens": False},
    }


def test_sources_and_registry_and_materials(client):
    body = client.get("/sources").json()
    assert "corpus_version" in body and "Corpus changelog" in body["changelog_markdown"]
    assert client.get("/registry?jurisdiction=IN").status_code == 200
    # Neem has a verified profile, so it is served once the profiles are seeded
    # (T1.27); a material nobody has verified is still a 404.
    from app.db import SessionLocal
    from app.materials import seed_profiles

    with SessionLocal() as db:
        seed_profiles(db)
    assert client.get("/materials/plant/neem/ipr").status_code == 200
    assert client.get("/materials/plant/brahmi/ipr").status_code == 404
    assert client.get("/materials/rock/neem/ipr").status_code == 422


def test_health_reports_database(client):
    body = client.get("/health").json()
    assert body["database"] is True and body["provider"] in ("groq", "anthropic")
