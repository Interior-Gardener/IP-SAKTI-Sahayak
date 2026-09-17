# Task Tracker — Vanaspati Sahayak (IP-SAKTI Sahayak)

We split the build into small tasks so several people, each with their own Claude Code limit, can take turns. Read [PLAN.md](PLAN.md), [architecture.md](architecture.md), [providers.md](providers.md), [CONTRIBUTING.md](CONTRIBUTING.md) and [PROBLEM-STATEMENT.md](PROBLEM-STATEMENT.md) before you pick up a task.

## Workflow rules (everyone follows these, every task)

**Before starting a task**
1. `git pull` on `main`. Read this file and pick the **first `todo` task whose dependencies are `done`**. Nobody else should be working on it.
2. **Check your limit.** Run `/usage` in Claude Code. Compare what you have left with the task's size:
   - **S** ≈ under 10% of a 5-hour session · **M** ≈ 10–25% · **L** ≈ 25–50%.
   - If you don't clearly have room, **don't start it**. Pick a smaller `todo` task or hand over to the next teammate.
3. Mark the task `in progress`, put your name in **Owner**, commit and push that one-line change so others see it.

**While working**
4. Do only that task. Follow `CLAUDE.md` rules: never make up legal authority (use `'unknown'` or "verify" with a manifest cite id), keep IN and INTL answers separate, the garden must still work with the API down, keys only in the API env.
5. Check it works: `npm run build && npm run lint` for web, `ruff check && pytest` for `api/`, plus the task's own "Done when".

**After finishing a task**
6. Update this file: status `done`, add the date and a short note (anything the next person needs to know).
7. Commit and push to GitHub on `main`:
   - Commit message: **short, plain, human-sounding, non-technical**, e.g. `added the chat drawer`, `plant legal info for neem and tulsi`. No long bodies, no bullet lists.
   - **No Claude/AI co-author line** (no `Co-Authored-By: Claude`). Commit under your own git name.
8. Check your limit again (step 2) before taking the next task. If you're low, stop here: the tracker and GitHub are already up to date, so the next teammate can carry on.

**If you run out of limit mid-task:** commit what builds as `wip: <task id>`, push, set the status to `blocked` with a note on what's left.

Status values: `todo` · `in progress` · `blocked` · `done`

---

## Stage 0 — Foundations

| ID | Task | Size | Depends | Done when | Status | Owner | Notes |
|---|---|---|---|---|---|---|---|
| T0.1 | Rename package to `vanaspati-sahayak`; fix plaque image path in `MedicinalGardenScene.tsx:48`; add root `.gitignore` entries for `.env`, `api/.venv`, `corpus/raw` | S | — | build + lint pass, plaque renders | done | Tushar | 2026-09-17. Plaque now points at `/cards/garden-entry-board.png`. Lint has 3 old warnings, no errors. Run `npm ci` first on a fresh clone. |
| T0.2 | `api/` skeleton: `pyproject.toml`, ruff, pytest, `app/main.py`, `app/settings.py`, `GET /health` + one test | S | — | `uvicorn` serves `/health`, pytest green | todo | | |
| T0.3 | `docker-compose.yml` (pgvector postgres + api), `api/Dockerfile`, `.env.example` with every var from providers.md | S | T0.2 | `docker compose up` → `/health` 200 | todo | | |
| T0.4 | DB layer: SQLAlchemy + Alembic, first migration for `sources`, `source_versions`, `chunks` (HNSW + GIN indexes) | M | T0.3 | `alembic upgrade head` works on compose DB | todo | | |
| T0.5 | Pydantic schemas for the contracts (`SahayakAnswer`, `Citation`, `RegistryPointer`, `MaterialIPProfile`) | S | T0.2 | schemas appear in `/openapi.json` | todo | | |
| T0.6 | LLM provider base + router (`base.py`, `router.py`, role → provider/model from env) | S | T0.2 | unit test picks provider by env | todo | | |
| T0.7 | Anthropic provider (`complete`, `complete_structured`, `answer_with_citations`) | M | T0.6 | mocked test maps citations to `Citation` | todo | | |
| T0.8 | Groq provider incl. `[[c:id|"span"]]` marker parser | M | T0.6 | parser tests + mocked call test | todo | | |
| T0.9 | Embeddings (`local` BGE-M3, `voyage`) + local reranker, behind interfaces | M | T0.2 | small script embeds and reranks 3 strings | todo | | |
| T0.10 | Web client: `src/lib/sahayak/client.ts` (fetch + SSE), `npm run gen:api` → `src/types/sahayak.ts`, `src/store/useSahayak.ts`, web `.env.example` | M | T0.5 | types generate; build + lint pass | todo | | |
| T0.11 | CI workflow: web lint+build, api ruff+pytest | S | T0.2 | Actions green on push | todo | | |
| T0.12 | `docs/dpdp-and-security.md` + `docs/model-card.md` | M | — | docs written, linked from CLAUDE.md | todo | | |

## Stage 1 — Citation-grounded retrieval MVP

### Corpus + ingest
| ID | Task | Size | Depends | Done when | Status | Owner | Notes |
|---|---|---|---|---|---|---|---|
| T1.1 | `corpus/manifest.yaml` seeded with ~30 sources (real official URLs only) + `corpus/CHANGELOG.md` | M | — | manifest validates against a schema | todo | | |
| T1.2 | Ingest `fetch` + `normalise` (PyMuPDF, OCR fallback, HTML) | M | T0.4, T1.1 | raw + normalised text for 3 sources | todo | | |
| T1.3 | Ingest `structure` (Indian section/rule parser, treaty articles) + `chunk` with contextual headers | L | T1.2 | Patents Act chunks with locators like `s.3(p)` | todo | | |
| T1.4 | Ingest `embed` + `upsert` (versioning, superseded marking) + `ingest run` CLI | M | T0.9, T1.3 | re-run is idempotent; new hash → new version | todo | | |
| T1.5 | Run full ingest; hand-check the ~10 most-cited sections | M | T1.4 | chunk counts per source noted here | todo | | |

### Answer pipeline
| ID | Task | Size | Depends | Done when | Status | Owner | Notes |
|---|---|---|---|---|---|---|---|
| T1.6 | Guard-in: size cap, rate limit, scope classifier, injection heuristics | M | T0.6 | tests for out-of-scope + injection | todo | | |
| T1.7 | Understand: language detect, NMT fallback, regime router, entity link, rewrite | M | T0.6 | router test returns regimes[] | todo | | |
| T1.8 | Retrieval: hybrid dense + FTS, RRF, rerank, version pin, dedupe, per-jurisdiction filter | L | T1.4 | jurisdiction-filter test; recall check on 5 questions | todo | | |
| T1.9 | Generate: prompt + both provider paths into per-jurisdiction answers | M | T0.7, T0.8, T1.8 | one answer per jurisdiction, never merged | todo | | |
| T1.10 | Guard-out: verifier (5 rules), confidence, abstain, disclaimer | L | T1.9 | test: fabricated section rejected; leak regenerated | todo | | |
| T1.11 | `POST /ask` SSE endpoint wiring + answer cache + audit trace | M | T1.6–T1.10 | `curl -N` streams a full envelope | todo | | |
| T1.12 | `/sources`, `/registry`, `/materials/{kind}/{id}/ipr` endpoints | M | T0.4 | endpoints tested | todo | | |
| T1.13 | `/consent`, `/escalate` (verified facilitators only), `DELETE /me`, sessions | M | T0.4 | consent required before ask; purge test | todo | | |

### Web
| ID | Task | Size | Depends | Done when | Status | Owner | Notes |
|---|---|---|---|---|---|---|---|
| T1.14 | Sahayak drawer in `AppShell` + command palette entry + offline notice | M | T0.10 | drawer opens; API down → offline notice, garden fine | todo | | |
| T1.15 | `/sahayak` page: jurisdiction switch (two panes), answer pane, citations panel, confidence chip, disclaimer, provider footer | L | T1.14 | BOTH shows two separate panes | todo | | |
| T1.16 | Language picker, persona picker, consent banner, escalate form, "Where to go next" | M | T1.15 | consent shown before first ask | todo | | |
| T1.17 | `/sources` page | S | T1.12 | lists sources, versions, changelog | todo | | |

### Plant IP layer
| ID | Task | Size | Depends | Done when | Status | Owner | Notes |
|---|---|---|---|---|---|---|---|
| T1.18 | `MaterialIPProfile` type + `src/data/ipr/plant/` + join in `plants.ts` (all 30 as `'unknown'`) | S | — | build passes | todo | | |
| T1.19 | Fill real cited profiles: turmeric, neem, ashwagandha, sandalwood | M | T1.1, T1.18 | every field cited or `'unknown'` | todo | | |
| T1.20 | Fill real cited profiles: sarpagandha, guggulu, amla, tulsi | M | T1.19 | same | todo | | |
| T1.21 | `MaterialIprPanel`: `iplaw` tab in PlantPage, Walk dossier panel, BoardCard strip | M | T1.18 | panel visible in all three spots | todo | | |
| T1.22 | 3D seal hotspot in `PlantViewer` + "Ask Sahayak about this" with context | M | T1.14, T1.21 | clicking seal opens drawer with plant context | todo | | |

### Eval
| ID | Task | Size | Depends | Done when | Status | Owner | Notes |
|---|---|---|---|---|---|---|---|
| T1.23 | Golden set part 1: 60 in-scope items (IN / INTL / BOTH) | L | T1.5 | `eval/golden/inscope.jsonl` | todo | | |
| T1.24 | Golden set part 2: 15 microbe/animal/mineral, 20 out-of-scope, 25 multilingual twins | L | T1.23 | jsonl files | todo | | |
| T1.25 | Eval runners (retrieval, accuracy, citation, abstention, multilingual) + `make eval` | L | T1.11, T1.23 | runs end-to-end on 10 items | todo | | |
| T1.26 | Full eval run per provider, commit results, CI smoke subset | M | T1.24, T1.25 | numbers under `eval/runs/` | todo | | |

## Stage 2 — Rasashala, classification, ABS, KG, agent, workbench

| ID | Task | Size | Depends | Done when | Status | Owner | Notes |
|---|---|---|---|---|---|---|---|
| T2.1 | `SourceMaterial` type + data: ~6 microbes, ~8 animal, ~6 mineral (profiles cited or `'unknown'`) | M | T1.18 | build passes | todo | | |
| T2.2 | Procedural `microbe.ts` generator | M | — | preview renders all 5 shapes | todo | | |
| T2.3 | Procedural `substance.ts` generator | M | — | preview renders shapes | todo | | |
| T2.4 | Export reusable pieces from `MedicinalGardenScene` (LabelBoard, Plaque, ground) | S | — | walkable garden unchanged | todo | | |
| T2.5 | `RasashalaScene` + `/rasashala` route + third Gateway door | L | T2.1–T2.4 | walkable scene with 4 areas + boards | todo | | |
| T2.6 | Classifier rule table + `/classify` (sections verified against corpus) | M | T1.5 | table case tests | todo | | |
| T2.7 | ABS helper `/abs` | M | T1.5 | route tests | todo | | |
| T2.8 | TKDL / prior-art pointer | S | T1.18 | search URLs for 3 materials | todo | | |
| T2.9 | Knowledge graph tables, seed, retrieval expansion, `/graph/{entity}` | L | T1.8 | expansion adds linked chunks in test | todo | | |
| T2.10 | Agentic tool loop + tools, audited, iteration cap | L | T2.6, T2.7, T2.9 | multi-step question uses ≥2 tools | todo | | |
| T2.11 | Workbench store slice + "Add to workbench" on hotspots and shelves | M | T2.5 | basket persists | todo | | |
| T2.12 | `/workbench` route + scene + wizard + result card | L | T2.6, T2.11 | end-to-end classification with cites | todo | | |
| T2.13 | DPDP: consent ledger, audit events per ask/tool, retention job | M | T1.13 | audit row per ask and tool call | todo | | |

## Stage 3 — Connectors, voice, Registry Marg

| ID | Task | Size | Depends | Done when | Status | Owner | Notes |
|---|---|---|---|---|---|---|---|
| T3.1 | Connectors: free official DB deep links + cached snapshots | M | T1.12 | honest "no public API" notice in UI | todo | | |
| T3.2 | Consent-gated paid connector (logged per call) | M | T2.13, T3.1 | consent + audit row per call | todo | | |
| T3.3 | Bhashini client (ASR, NMT, TTS) + fallbacks; `/voice/asr`, `/voice/tts` | L | T1.7 | fallback works with no Bhashini key | todo | | |
| T3.4 | Mic + playback in drawer | M | T3.3 | voice round-trip in browser | todo | | |
| T3.5 | UI i18n (react-i18next): Hindi + one more | M | T1.16 | chrome strings switch language | todo | | |
| T3.6 | Registry Marg 3D street | L | T2.4, T1.12 | boards show forms and links | todo | | |
| T3.7 | Presentation scenes + "Who owns the neem tree?" tour | M | T1.22, T2.5 | tour plays end-to-end | todo | | |
| T3.8 | README + deck refresh | M | all | README reflects the product | todo | | |
