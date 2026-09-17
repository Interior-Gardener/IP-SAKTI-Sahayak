# Status and handover — 2026-09-18

Where the build stands, what has actually been tested, what is known to be wrong, and how to
pick it up on another machine. Task-by-task detail is in [TASKS.md](TASKS.md); the corpus
provenance is in [SOURCES.md](SOURCES.md).

## 1. What works today

- **Corpus**: 31 official sources (23 India, 8 international) → 3,147 chunks in Postgres with
  embeddings. Every link was opened and checked; four PDFs had to be saved by hand (see §5).
- **Retrieval**: pgvector + Postgres full-text + exact section lookup, fused, reranked on GPU,
  hard-filtered by jurisdiction, superseded versions excluded.
- **Answers**: one per jurisdiction, never merged, each citation checked word-for-word against
  the stored text, confidence score, abstention below the floor, standing disclaimer.
- **API**: `/health`, `/ask` (SSE), `/sources`, `/registry`, `/materials/{kind}/{id}/ipr`,
  `/consent`, `/escalate`, `DELETE /me`, `/classify`, `/abs`.
- **Web**: Ask Sahayak drawer everywhere, `/sahayak` (two panes for India vs international),
  `/sources`, an "IP & Law" tab on all 30 plants, an IP line on the garden card and the walkable
  garden board, and a seal hotspot in the 3D plant viewer. The garden still works with the API down.
- **Tests**: 87 (`cd api && .venv/Scripts/python -m pytest -q`). CI runs web lint+build and API
  ruff+pytest with Postgres.

## 2. Measured quality (eval)

Latest full run: `eval/runs/2026-09-17-groq-46item-run.json` (Groq `openai/gpt-oss-120b`,
44 of 46 items before the daily limit; rebuilt from the log, so per-item notes are missing).

| Metric | Result | Target | |
|---|---|---|---|
| Retrieval recall@8 | 1.00 | ≥ 0.85 | met |
| Abstention on out-of-scope / medical / unsafe | 1.00 | ≥ 0.95 | met |
| Multilingual agreement (hi, mr, ta) | 1.00 | ≥ 0.85 | met |
| Judge accuracy | 0.92 | ≥ 0.80 | met |
| Citation correctness | 0.84 | ≥ 0.95 | **not met** |
| False abstention (good answers withheld) | 0.24 | ≤ 0.10 | **not met** |

Retrieval-only (no model calls, all 29 English items): recall@8 = 1.00.

**Known causes of the two gaps**

1. Four withheld answers used gpt-oss's own citation style (`【1†source】`), which carries no
   quotable text, so nothing could be verified. The Groq path now retries once showing the
   required marker format — **this fix has not yet been measured** (no quota left).
2. Some answers quote a related document (e.g. the Patent Office Manual) instead of the section
   the question is about; they verify but miss the expected provision. Sources are now labelled
   `[primary law]` / `[guidance]` and ordered accordingly — also not yet measured.
3. Some answers cite laws that are not in the corpus (e.g. Trade Marks Rules 2017). That is the
   verifier working correctly; the fix is to add those sources.

## 3. Live checks actually performed

- Full ingest on GPU (~4 min for 3,147 chunks) and a re-chunk pass after parser fixes.
- End-to-end over HTTP through uvicorn: `/health`; `/ask` refused with 403 without consent;
  after consent, a streamed answer (status → answer → done) in ~29 s citing Rules 157, 158 and
  158B with 5 of 5 citations verified, high confidence, disclaimer present.
- Live provider calls: English, Hindi (Hindi answer with untranslated English quote), Marathi,
  Tamil; out-of-scope and dosing questions refused.
- Docker: `docker compose up` → Postgres + API, `/health` 200, Alembic migrations on start.
- **Not done**: clicking through the web UI in a browser; the drawer, `/sahayak`, `/sources`,
  the IP tab and the 3D seal have only been type-checked and built.

## 4. Machine setup (new machine)

```bash
git clone <repo> && cd IP-SAKTI-Sahayak
npm install && npm run build           # web

cd api
uv venv --python 3.12 .venv            # or python -m venv .venv
uv pip install -e ".[dev,local]"
# NVIDIA GPU? The default torch wheel is CPU-only and ingest takes hours instead of minutes:
uv pip install --reinstall torch --index-url https://download.pytorch.org/whl/cu128
.venv/Scripts/python -c "import torch; print(torch.cuda.is_available())"   # must be True

cp ../.env.example ../.env             # fill GROQ_API_KEY at least
cd .. && docker compose up -d postgres
cd api && .venv/Scripts/alembic upgrade head
```

Then either restore the database (fastest) or re-ingest:

```bash
# re-ingest everything (GPU: ~5 min; CPU: hours)
.venv/Scripts/python -m app.ingest run --no-ocr
# after a parser change, re-chunk files that have not changed:
.venv/Scripts/python -m app.ingest run --no-ocr --rechunk
```

Run things:

```bash
cd api && .venv/Scripts/python -m uvicorn app.main:app --reload   # API on :8000
npm run dev                                                      # web on :5173
python eval/run.py --provider groq                  # full eval
python eval/run.py --only retrieval                 # free: no model calls
python eval/run.py --provider groq --resume eval/runs/<file>-partial.json
python api/scripts/sources_register.py              # regenerate docs/SOURCES.md
```

## 5. Things a new machine will not have

- **`corpus/raw/` is gitignored** (~40 MB of PDFs). 27 sources re-download automatically; four
  must be saved by hand into `corpus/raw/` with these exact names:
  `in-patents-amendment-rules-2024.pdf`, `intl-paris-convention.pdf`, `intl-budapest-treaty.pdf`
  (all three: WIPO Lex pages linked in `corpus/manifest.yaml`, "English PDF"),
  `intl-eu-thmpd-2004-24.pdf` (EUR-Lex, or the EU Publications Office search when EUR-Lex is down).
  `corpus/normalised/*.txt` **is** in git, so the extracted text survives without the PDFs, but
  ingest needs the raw file for its sha256.
- **The database** is not in git. Re-ingest, or copy the Docker volume.
- **`.env`** is not in git. Keys live only there.

## 6. Provider quota (the current bottleneck)

Groq free tier for `openai/gpt-oss-120b`: **8,000 tokens/minute, 200,000/day** per account.
One cited answer ≈ 5,000 tokens, so a 46-item eval ≈ 230,000 — more than one day's allowance.
Four keys were used up during testing on 2026-09-17. Options: wait for the rolling reset, use
another key, pay for Groq's Dev tier (a full run is worth a few cents), or set
`LLM_PROVIDER_*=anthropic` with an Anthropic key. Rate-limit errors are retried automatically;
a run that still hits the limit saves a `-partial.json` file and can be resumed.

## 7. Next steps, in the order I would do them

1. Re-run the eval to measure the two unmeasured fixes (citation retry, primary-law ordering).
   `python eval/run.py --provider groq` — needs a key with quota.
2. Click through the web UI in a browser against the running API (drawer, `/sahayak` two panes,
   `/sources`, plant IP tab, 3D seal), and fix what looks wrong.
3. Grow the golden set towards the planned ~120 items (now 46): more microbe/animal/mineral
   items, more abstention items, more twins. Always check the expected provision against the
   ingested text first (see `verified_by` in each item).
4. Fill the plant IP profiles for the first 8 plants (T1.19/T1.20) — every field needs a citation
   id or stays `unknown`.
5. Add the missing sources listed in `corpus/CHANGELOG.md` (Trade Marks Rules 2017 first: answers
   already want to cite it), then re-run ingest.
6. Stage 2 proper: Rasashala scene, knowledge graph, agent loop, Workbench.

## 8. Rules that must not be broken

- Never state a legal point without a citation into the corpus, in code, data, docs or answers.
  `unknown` and "verify" are first-class values.
- India and international answers stay separate objects and separate panes.
- The garden keeps working with the API down.
- Provider keys only in the API environment.
- Corpus changes go through `corpus/manifest.yaml` + `CHANGELOG.md`, never by editing the database.
