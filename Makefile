# Shortcuts. On Windows without make, run the commands on the right directly.
PROVIDER ?= groq
PY ?= api/.venv/Scripts/python
ifeq ($(OS),)
PY = api/.venv/bin/python
endif

.PHONY: eval eval-smoke eval-retrieval ingest load api test db-dump db-restore

eval:            ## full eval, writes eval/runs/<date>-<provider>.json
	$(PY) eval/run.py --provider $(PROVIDER)

eval-smoke:      ## the CI subset
	$(PY) eval/run.py --provider $(PROVIDER) --smoke

eval-retrieval:  ## retrieval recall only, no model calls
	$(PY) eval/run.py --only retrieval

ingest:         ## fetch, normalise and chunk everything (needs the raw PDFs)
	cd api && ../$(PY) -m app.ingest run --no-ocr

load:           ## fill an empty database from the committed text; no raw PDFs needed
	cd api && ../$(PY) -m app.ingest load

db-dump:        ## the whole database as one ~16 MB file (share it; do not commit it)
	docker compose exec -T postgres pg_dump -U sahayak -Fc -Z9 sahayak > sahayak.dump

db-restore:     ## load that file into an empty database, instead of re-ingesting
	docker compose exec -T postgres pg_restore -U sahayak -d sahayak --clean --if-exists < sahayak.dump

api:
	cd api && ../$(PY) -m uvicorn app.main:app --reload

test:
	cd api && ../$(PY) -m pytest -q
