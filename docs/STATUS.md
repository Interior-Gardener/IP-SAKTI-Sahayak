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
- **Tests**: 88 (`cd api && .venv/Scripts/python -m pytest -q`). CI runs web lint+build and API
  ruff+pytest with Postgres.

## 2. Measured quality (eval)

Latest: **`eval/runs/2026-09-18-groq-after-window.json` — all 46 items** (Groq
`openai/gpt-oss-120b`, judge the same model). Full runs are possible because `GROQ_API_KEYS` holds
several keys and the provider switches when one hits its daily limit.

| Metric | after-window | earlier 2026-09-18 | 2026-09-17 | Target | |
|---|---|---|---|---|---|
| Retrieval recall@8 | 1.00 | 1.00 | 1.00 | ≥ 0.85 | met |
| Abstention on out-of-scope / medical / unsafe | 1.00 | 1.00 | 1.00 | ≥ 0.95 | met |
| False abstention | 0.028 | 0.028 | 0.242 | ≤ 0.10 | met |
| Multilingual agreement | 1.00 | 0.75 | 1.00 | ≥ 0.85 | met |
| Judge accuracy | 0.843 | 0.814 | 0.92 | ≥ 0.80 | met |
| Citation correctness | 0.886 | 0.829 | 0.84 | ≥ 0.95 | **not met** |

Retrieval-only (no model calls, all 29 English items): recall@8 = 1.00.

What moved the numbers, in order: quote matching that tolerates the model's dash and ellipsis
habits; a retry when it uses its own `【1†source】` style; showing all 8 retrieved passages instead
of 6 (sections ranked 7th–8th were being cut); prompt rules on primary law, on not claiming
"insufficient sources" when a document does answer, and on not shortening non-English answers.

**What still fails (from the run file's per-item notes)**

- *Citations, 4 of 35*: the answer verifies but rests on a neighbouring provision (Trade Marks
  s.36 instead of s.9; s.2 definitions instead of the operative section). Retrieval had the right
  section and the model was shown it.
- *Accuracy, 3 of 35 at 0*: **one is a wrong legal statement** — for Rule 158B it said proof of
  effectiveness *is* required for a classical formulation, where the table says "Not Required".
  The rule's content is a wide table whose columns survive chunking badly; table-aware chunking is
  the fix. The others: a single flat patent fee where the schedule varies by applicant, and a trade
  mark answer from the wrong section.
- *One withheld answer*: Budapest Art. 7, quote did not match the treaty text.

Known limits of these numbers: accuracy is judged by the same model family that writes the answers
(spot-check a sample by hand), and 46 items is small — the plan asks for ~120.

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
Set **`GROQ_API_KEYS`** in `.env` to several keys separated by commas and a long run continues on
the next key when one hits its daily limit (per-minute limits are just waited out). Otherwise:
wait for the rolling reset, pay for Groq's Dev tier (a full run is worth a few cents), or set
`LLM_PROVIDER_*=anthropic` with an Anthropic key. A run that still runs out saves a
`-partial.json` file and can be resumed with `--resume`.

## 7. Next steps, in the order I would do them

1. Re-run the eval to measure the primary-law selection fix of 2026-09-18 (the citation retry is
   already measured: false abstention 0.242 → 0.077). `python eval/run.py --provider groq`, or
   resume the partial run — needs a key with quota.
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
