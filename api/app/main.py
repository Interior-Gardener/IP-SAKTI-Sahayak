from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from pydantic import BaseModel
from pydantic.json_schema import models_json_schema

from app.schemas import CONTRACTS
from app.settings import get_settings

settings = get_settings()

app = FastAPI(title=settings.app_name, version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["*"],
)


class Health(BaseModel):
    status: str
    provider: str
    model: str
    embed_model: str
    corpus_version: str


@app.get("/health", response_model=Health)
def health() -> Health:
    """The web app polls this to decide between the assistant and the offline notice."""
    return Health(
        status="ok",
        provider=settings.llm_provider_answer,
        model=settings.llm_model_answer,
        embed_model=settings.embed_model,
        corpus_version=settings.corpus_version,
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
