# Contributing — Vanaspati Sahayak

For teammates joining the SIH-26 PS-45 build. Read [STATUS.md](STATUS.md) first (where the build stands, measured results, setup), then [PLAN.md](PLAN.md) and [architecture.md](architecture.md). This file is the practical part: setup, keys, workflow, ownership.

## 1. Setup

Prerequisites: Node 20+ (CI uses 22), Python 3.12, Docker Desktop, git.

```bash
# web (existing 3D garden)
npm install
npm run dev            # http://localhost:5173
npm run build && npm run lint

# api (from stage 0 onwards)
cd api
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
cp ../.env.example ../.env   # fill keys, see §2
docker compose up postgres   # from repo root
uvicorn app.main:app --reload # http://localhost:8000/docs

# NVIDIA GPU? The default torch wheel is CPU-only and ingest will take hours.
# Install the CUDA build (RTX 50xx needs cu128+); ingest then takes minutes:
pip install -e ".[local]"
pip install --force-reinstall torch --index-url https://download.pytorch.org/whl/cu128
python -c "import torch; print(torch.cuda.is_available())"   # must print True

# corpus ingest (stage 1)
python -m app.ingest run --manifest ../corpus/manifest.yaml
python -m app.ingest check-currency

# regenerate web types after any API schema change
npm run gen:api
```

## 2. Keys and where to get them

| Key | Needed for | Where |
|---|---|---|
| `ANTHROPIC_API_KEY` | best-quality answers, native citations | console.anthropic.com |
| `GROQ_API_KEY` | free-credit alternative for all LLM roles, Whisper ASR | console.groq.com |
| `VOYAGE_API_KEY` | optional legal embeddings | voyageai.com (local BGE-M3 works without it) |
| `BHASHINI_USER_ID`, `BHASHINI_API_KEY` | ASR / NMT / TTS | bhashini.gov.in / ULCA portal (apply early; approval can take days) |
| `DATABASE_URL` | Postgres | from `docker-compose.yml` |
| `VITE_API_URL` | web → API | `http://localhost:8000` locally |

Never commit `.env`. Keys live only in the API environment; the browser never receives them. See [providers.md](providers.md) for which role uses which key and the free-only setup.

## 3. Repo layout

```
src/            web app (React 19, R3F, Tailwind v4, Zustand) — existing, keep working at all times
api/            FastAPI service (stage 0+)
corpus/         manifest.yaml, raw/, normalised/, CHANGELOG.md — version-tracked legal corpus
eval/           golden set and runners
docs/           PLAN.md, PROBLEM-STATEMENT.md, architecture.md, providers.md, this file
```

## 4. Workflow

- **Branches**: `main` is always demoable. Work on `stage<N>/<topic>` branches (e.g. `stage1/retrieval-hybrid`, `stage2/rasashala-scene`). One PR per topic, small.
- **PRs**: describe what changed and how you verified it (command output or a screenshot for 3D work). CI must be green: web lint + build, api ruff + pytest, eval smoke subset.
- **Commits**: imperative subject, under 72 chars, body explains why when it is not obvious.
- **Do not break the garden.** The 3D scenes and compendium must render with the API down. If you add an API dependency to an existing page, add the offline notice path in the same PR.
- **No fabricated law.** Any legal statement in code, data or docs carries a citation id into `corpus/manifest.yaml`, or it is written as `'unknown'` / "verify". Reviewers reject otherwise. This is the PS's "never fabricate authority", and it is scored.
- **Corpus changes** go through `corpus/manifest.yaml` + `CHANGELOG.md`, never by editing chunks in the database.

## 5. Ownership by stage

Fill in names when the team splits work. Each stage has a "definition of done" in [PLAN.md](PLAN.md) under Verification.

| Area | Stage | Owner | Status |
|---|---|---|---|
| Repo, Docker, CI, env plumbing | 0 | | not started |
| Provider layer (Anthropic + Groq), embeddings, reranker | 0 | | not started |
| Corpus manifest + ingest pipeline | 0–1 | | not started |
| Understand + retrieve + generate + verifier | 1 | | not started |
| Eval harness + golden set | 1 | | not started |
| Sahayak drawer, `/sahayak`, `/sources`, consent UX | 1 | | not started |
| Plant IP profiles (30 plants) + panels + 3D seal hotspot | 1 | | not started |
| Rasashala scene + procedural microbes/substances + materials data | 2 | | not started |
| Classifier rule table, ABS helper, TKDL pointer | 2 | | not started |
| Knowledge graph + agentic tool loop | 2 | | not started |
| Workbench route + scene + wizard | 2 | | not started |
| DPDP: consent ledger, audit, retention, purge | 2 | | not started |
| Connectors (free DBs, consent-gated paid) | 3 | | not started |
| Voice (Bhashini, fallbacks), UI i18n | 3 | | not started |
| Registry Marg, presentation scenes, tour, README/deck | 3 | | not started |

## 6. Conventions

- **TypeScript**: strict settings already in `tsconfig.app.json`; `oxlint` must pass. Match the existing style: comments explain *why*, data files are plain objects, no UI library, hand-drawn SVG for charts.
- **Python**: `ruff` (format + lint), type hints everywhere, `pydantic` schemas for every request/response, `pytest` for logic (verifier, rule table, retrieval filters).
- **3D**: procedural first, seeded by `src/three/procedural/rng.ts`; if a glTF asset is added, put it under `public/models/` with a `CREDITS.txt` entry and a CC0 or equivalent licence.
- **Data**: any legal field is `{ value, cite }` or `'unknown'`. Dates ISO. Section locators follow the corpus convention (`s.3(p)`, `Rule 158B(1)(b)`, `Art. 27.3(b)`).

## 7. Definition of "MVP demo ready" (end of stage 1)

- `docker compose up` brings up API + DB; `npm run dev` shows the garden with the Sahayak drawer.
- "Can I patent Triphala?" asked in Hindi with jurisdiction BOTH returns two panes with verified citations, a confidence chip and the disclaimer.
- `make eval` meets the stage-1 targets in PLAN.md on at least one provider, and the numbers are committed under `eval/runs/`.
- The plant IP panel shows real cited content for at least 8 plants and honest `unknown` for the rest.
