from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from pydantic import BaseModel
from pydantic.json_schema import models_json_schema

from app import services
from app.llm.router import resolve
from app.routes import router
from app.schemas import CONTRACTS
from app.settings import get_settings

settings = get_settings()

app = FastAPI(title=settings.app_name, version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Content-Type", "Accept", "X-Session-Id"],
)
app.include_router(router)


class Health(BaseModel):
    status: str
    provider: str
    model: str
    embed_model: str
    corpus_version: str
    database: bool


@app.get("/health", response_model=Health)
def health() -> Health:
    """The web app polls this to decide between the assistant and the offline notice.
    It never loads a model, so it answers instantly even on a cold start."""
    provider, model = resolve("answer")
    db_ok = services.database_ok()
    version = "unavailable"
    if db_ok:
        from app.db import SessionLocal

        with SessionLocal() as session:
            version = services.corpus_version(session)
    return Health(
        status="ok" if db_ok else "degraded",
        provider=provider,
        model=model,
        embed_model=settings.embed_model,
        corpus_version=version,
        database=db_ok,
    )


def _openapi() -> dict:
    """Stage-1 endpoints that return the contracts don't exist yet; adding the
    schemas here lets the web generate its types now."""
    if app.openapi_schema:
        return app.openapi_schema
    schema = get_openapi(title=app.title, version=app.version, routes=app.routes)
    _, defs = models_json_schema(
        [(m, "serialization") for m in CONTRACTS], ref_template="#/components/schemas/{model}"
    )
    schema.setdefault("components", {}).setdefault("schemas", {}).update(defs["$defs"])
    app.openapi_schema = schema
    return schema


app.openapi = _openapi
