"""The verified material profiles the API serves.

They are written in src/data/ipr/ and exported to app/materials/profiles.json;
`npm run check:export` keeps the file current. These tests hold the other end:
every exported profile passes the contract, and the endpoint returns it.
"""

from fastapi.testclient import TestClient

from app.main import app
from app.materials import load_profiles, seed_profiles


def test_every_exported_profile_passes_the_contract():
    profiles = load_profiles()
    kinds = {kind for kind, _, _ in profiles}
    assert kinds == {"plant", "microbe", "animal", "mineral"}
    for _, material_id, profile in profiles:
        # Only verified profiles are exported; an unverified one is what a 404 already says.
        assert profile.lastVerified, f"{material_id} was exported without a verification date"


def test_the_endpoint_returns_what_the_web_shows(db_session):
    seed_profiles(db_session)
    # Seeding twice changes nothing.
    assert seed_profiles(db_session) == len(load_profiles())
    client = TestClient(app)

    parada = client.get("/materials/mineral/parada/ipr")
    assert parada.status_code == 200
    body = parada.json()
    assert body["kind"] == "mineral"
    assert body["lastVerified"]

    turmeric = client.get("/materials/plant/turmeric/ipr")
    assert turmeric.status_code == 200

    assert client.get("/materials/plant/not-a-plant/ipr").status_code == 404
