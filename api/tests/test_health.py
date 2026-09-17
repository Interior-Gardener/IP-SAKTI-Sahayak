from fastapi.testclient import TestClient

from app.main import app


def test_health_reports_provider_and_corpus():
    res = TestClient(app).get("/health")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "ok"
    assert {"provider", "model", "embed_model", "corpus_version"} <= body.keys()
