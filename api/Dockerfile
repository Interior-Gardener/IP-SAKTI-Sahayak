FROM python:3.12-slim

# Tesseract is the OCR fallback for scanned gazettes during ingest.
RUN apt-get update \
 && apt-get install -y --no-install-recommends tesseract-ocr \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY pyproject.toml ./
COPY app ./app
COPY alembic.ini ./
COPY alembic ./alembic
RUN pip install --no-cache-dir .

EXPOSE 8000
# Bring the schema up to date on every start, then serve.
# Migrate, then seed the knowledge graph, the verified material profiles and the
# registries (all idempotent), then serve. A seed that fails must not stop the API: the graph widens
# retrieval and the profiles answer one endpoint; neither is the API.
CMD ["sh", "-c", "alembic upgrade head && (python -m app.graph seed || echo 'graph seed skipped') && (python -m app.materials seed || echo 'profile seed skipped') && (python -m app.registry seed || echo 'registry seed skipped') && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
