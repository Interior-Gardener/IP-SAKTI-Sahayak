# Shortcuts. On Windows without make, run the commands on the right directly.
PROVIDER ?= groq
PY ?= api/.venv/Scripts/python
ifeq ($(OS),)
PY = api/.venv/bin/python
endif

.PHONY: eval eval-smoke eval-retrieval ingest api test

eval:            ## full eval, writes eval/runs/<date>-<provider>.json
	$(PY) eval/run.py --provider $(PROVIDER)

eval-smoke:      ## the CI subset
	$(PY) eval/run.py --provider $(PROVIDER) --smoke

eval-retrieval:  ## retrieval recall only, no model calls
	$(PY) eval/run.py --only retrieval

ingest:
	cd api && ../$(PY) -m app.ingest run --no-ocr

api:
	cd api && ../$(PY) -m uvicorn app.main:app --reload

test:
	cd api && ../$(PY) -m pytest -q
