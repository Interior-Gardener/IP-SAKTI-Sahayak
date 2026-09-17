from fastapi.testclient import TestClient

from app.main import app


def test_contracts_in_openapi():
    schemas = TestClient(app).get("/openapi.json").json()["components"]["schemas"]
    for name in ["SahayakAnswer", "Citation", "RegistryPointer", "MaterialIPProfile"]:
        assert name in schemas
