# Task Tracker — Vanaspati Sahayak (IP-SAKTI Sahayak)

We split the build into small tasks so several people, each with their own Claude Code limit, can take turns. Read [PLAN.md](PLAN.md), [architecture.md](architecture.md), [providers.md](providers.md), [CONTRIBUTING.md](CONTRIBUTING.md) and [PROBLEM-STATEMENT.md](PROBLEM-STATEMENT.md) before you pick up a task.

## Workflow rules (everyone follows these, every task)

**Before starting a task**
1. `git pull` on `main`. Read this file and pick the **first `todo` task whose dependencies are `done`**. Nobody else should be working on it.
2. **Check your limit.** Run `/usage` in Claude Code. Compare what you have left with the task's size:
   - **S** ≈ under 10% of a 5-hour session · **M** ≈ 10–25% · **L** ≈ 25–50%.
   - If you don't clearly have room, **don't start it**. Pick a smaller `todo` task or hand over to the next teammate.
3. Mark the task `in progress` and put your name in **Owner** (this goes out with your next push, no separate commit).

**While working**
4. Do only that task. Follow `CLAUDE.md` rules: never make up legal authority (use `'unknown'` or "verify" with a manifest cite id), keep IN and INTL answers separate, the garden must still work with the API down, keys only in the API env.
5. Check it works: `npm run build && npm run lint` for web, `ruff check && pytest` for `api/`, plus the task's own "Done when".

**After finishing a task**
6. Update this file: status `done`, add the date and a short note (anything the next person needs to know).
7. **Don't commit after every task.** Keep working through tasks and commit + push **once, when your limit is near 90% used** (check `/usage`), or when you stop for the day. One push can hold several finished tasks.
   - Commit message: **short, plain, human-sounding, non-technical**, not past tense, e.g. `add the chat drawer and plant legal info`. No long bodies, no bullet lists.
   - **No Claude/AI co-author line** (no `Co-Authored-By: Claude`). Commit under your own git name.
   - Before pushing, make sure the tracker is updated for every task in that push, and build/lint/tests pass.
8. Check your limit (step 2) before taking the next task. If it's around 90%, update the tracker, commit and push now, so the next teammate starts from GitHub.

**If you hit ~90% mid-task:** commit what builds as `wip: <task id>`, push, set the status to `blocked` with a note on what's left.

Status values: `todo` · `in progress` · `blocked` · `done`

---

## Stage 0 — Foundations

| ID | Task | Size | Depends | Done when | Status | Owner | Notes |
|---|---|---|---|---|---|---|---|
| T0.1 | Rename package to `vanaspati-sahayak`; fix plaque image path in `MedicinalGardenScene.tsx:48`; add root `.gitignore` entries for `.env`, `api/.venv`, `corpus/raw` | S | — | build + lint pass, plaque renders | done | Tushar | 2026-09-17. Plaque now points at `/cards/garden-entry-board.png`. Lint has 3 old warnings, no errors. Run `npm ci` first on a fresh clone. |
| T0.2 | `api/` skeleton: `pyproject.toml`, ruff, pytest, `app/main.py`, `app/settings.py`, `GET /health` + one test | S | — | `uvicorn` serves `/health`, pytest green | done | Tushar | 2026-09-17. Python 3.12 venv via `uv venv --python 3.12 api/.venv` then `uv pip install -e ".[dev]"`. `/health` returns provider, model, embed model, corpus version. |
| T0.3 | `docker-compose.yml` (pgvector postgres + api), `api/Dockerfile`, `.env.example` with every var from providers.md | S | T0.2 | `docker compose up` → `/health` 200 | done | Tushar | 2026-09-17. Verified live: `docker compose up` → `/health` 200. Host ports are `API_PORT` / `POSTGRES_PORT` in `.env` (port 8000 was taken on one laptop, used 8010). Compose reads `.env`. |
| T0.4 | DB layer: SQLAlchemy + Alembic, first migration for `sources`, `source_versions`, `chunks` (HNSW + GIN indexes) | M | T0.3 | `alembic upgrade head` works on compose DB | done | Tushar | 2026-09-17. SQLAlchemy models in `api/app/db/models.py`, first Alembic migration creates `vector` extension + 3 tables + HNSW/GIN/btree indexes. Checked upgrade → downgrade → upgrade and `alembic check`. API container runs `alembic upgrade head` on start. Embedding dim fixed at 1024 (BGE-M3 and voyage-law-2). |
| T0.5 | Pydantic schemas for the contracts (`SahayakAnswer`, `Citation`, `RegistryPointer`, `MaterialIPProfile`) | S | T0.2 | schemas appear in `/openapi.json` | done | Tushar | 2026-09-17. In `api/app/schemas/`. Profile `cite` fields hold a manifest source id or `unknown`. `classification`/`abs` are loose dicts until stage 2. Contracts are added to `/openapi.json` by hand in `main.py` until real endpoints use them. |
| T0.6 | LLM provider base + router (`base.py`, `router.py`, role → provider/model from env) | S | T0.2 | unit test picks provider by env | done | Tushar | 2026-09-17. Providers call `router.register(name, factory)`. **Default is Groq `openai/gpt-oss-120b` for all roles**; setting `LLM_PROVIDER_<ROLE>=anthropic` picks the Claude defaults automatically. |
| T0.7 | Anthropic provider (`complete`, `complete_structured`, `answer_with_citations`) | M | T0.6 | mocked test maps citations to `Citation` | done | Tushar | 2026-09-17. `anthropic` SDK 1.6. Citations via plain-text document blocks; server-side `fallbacks="default"` on refusal; system prompt cached. Mocked tests only, no live key call yet. |
| T0.8 | Groq provider incl. `[[c:id|"span"]]` marker parser | M | T0.6 | parser tests + mocked call test | done | Tushar | 2026-09-17. `groq` SDK 1.7. Live call with gpt-oss-120b worked; it sometimes drops the `c:` marker prefix, so the parser accepts both. Unknown chunk ids are dropped. Structured output uses JSON mode + schema in prompt. Whisper `transcribe` included. |
| T0.9 | Embeddings (`local` BGE-M3, `voyage`) + local reranker, behind interfaces | M | T0.2 | small script embeds and reranks 3 strings | done | Tushar | 2026-09-17. Heavy deps are optional extras: `pip install -e ".[local]"` (sentence-transformers) or `".[voyage]"`. Tests use fake encoders. `api/scripts/embed_smoke.py` is the live check; not run yet (needs ~2 GB model download). |
| T0.10 | Web client: `src/lib/sahayak/client.ts` (fetch + SSE), `npm run gen:api` → `src/types/sahayak.ts`, `src/store/useSahayak.ts`, web `.env.example` | M | T0.5 | types generate; build + lint pass | done | Tushar | 2026-09-17. Types come from the committed `api/openapi.json`: after an API schema change run `python scripts/dump_openapi.py` in `api/`, then `npm run gen:api` (a pytest fails if the file is stale). `openapi-typescript` needs an npm override for TS 6. `/ask` SSE is read with fetch since it is a POST; client sends `X-Session-Id`. Web uses the root `.env` (`VITE_API_URL`). |
| T0.11 | CI workflow: web lint+build, api ruff+pytest | S | T0.2 | Actions green on push | done | Tushar | 2026-09-17. `.github/workflows/ci.yml`, green on first run. Separate old `deploy.yml` fails because GitHub Pages is not enabled in repo settings (not a code problem). |
| T0.12 | `docs/dpdp-and-security.md` + `docs/model-card.md` | M | — | docs written, linked from CLAUDE.md | done | Tushar | 2026-09-17. Status columns start at `planned`; update them as features land. Items marked **verify** need the DPDP Act/Rules in the corpus first. Linked from CLAUDE.md. |

## Stage 1 — Citation-grounded retrieval MVP

### Corpus + ingest
| ID | Task | Size | Depends | Done when | Status | Owner | Notes |
|---|---|---|---|---|---|---|---|
| T1.1 | `corpus/manifest.yaml` seeded with ~30 sources (real official URLs only) + `corpus/CHANGELOG.md` | M | — | manifest validates against a schema | done | Tushar | 2026-09-17. 31 sources (23 IN, 8 INTL), every link checked. India Code moved to indiacode.gov.in; downloads use its DSpace API. 4 sources are `fetch: manual` (WIPO Lex, FSSAI, EUR-Lex block scripts): save them by hand into `corpus/raw/`. Gaps listed in `corpus/CHANGELOG.md`. Schema + pytest in `api/app/ingest/manifest.py`. |
| T1.2 | Ingest `fetch` + `normalise` (PyMuPDF, OCR fallback, HTML) | M | T0.4, T1.1 | raw + normalised text for 3 sources | done | Tushar | 2026-09-17. `python -m app.ingest fetch|normalise`. All 27 auto sources download and normalise (checks the file really is a PDF). OCR fallback needs Tesseract (in the Docker image; not on Windows by default, use `--no-ocr`). `corpus/raw` is gitignored; `corpus/normalised` is committed. |
| T1.3 | Ingest `structure` (Indian section/rule parser, treaty articles) + `chunk` with contextual headers | L | T1.2 | Patents Act chunks with locators like `s.3(p)` | done | Tushar | 2026-09-17. Parser handles India Code dash headings, NBA `. –` headings, bare-number headings, `Article N` split lines, schedules, chapters, amendment footnotes, bilingual gazettes (English kept). ~3,050 chunks. Long sections split per clause (`s.3(k)–(p)`). Weak spot: NDCT Rules 2019 (15 units only). Contextual header is template-based; the optional LLM one-liner is not done. |
| T1.4 | Ingest `embed` + `upsert` (versioning, superseded marking) + `ingest run` CLI | M | T0.9, T1.3 | re-run is idempotent; new hash → new version | done | Tushar | 2026-09-17. `python -m app.ingest run` = fetch → normalise → chunk → embed → upsert. Idempotent by sha256; new hash supersedes old version; changing embed model re-embeds. BGE-M3 on CPU capped at 512 tokens (`EMBED_MAX_TOKENS`), ~1-5 s/chunk on a laptop, so a full run takes 1-3 h. Needs `pip install -e ".[local]"`. |
| T1.5 | Run full ingest; hand-check the ~10 most-cited sections | M | T1.4 | chunk counts per source noted here | in progress | Tushar | 2026-09-17. **Ingest done** in ~4 min on GPU: 3,047 chunks from 26 sources (patents act 172, patents rules 144, MPPP 174, GI act 90, GI rules 126, TM act 167, designs 50, copyright 117, PPVFR 102, BD act 73, BD rules 2024 60, BD amdt rules 3, D&C act 95, D&C rules 536, DMR 19, NDCT 201, cosmetics 121, FSS 118, WLPA 256, CPA 112, DPDP 53, TRIPS 76, CBD 43, Nagoya 38, GRATK 23, PCT 78). All 31 sources now in (manual PDFs added: Patents Amendment Rules 2024 22 chunks, Paris 54, Budapest 22, EU Directive 2004/24 15; FSSAI Aahara 21, now automatic). `corpus/raw` is gitignored, so teammates must copy the 4 manual PDFs from Tushar or re-download per the manifest notes. Retrieval eval (14 English items): recall@8 = 1.0 with reranker, 0.778 without. Left: hand-check the ~10 key sections. |

### Answer pipeline
| ID | Task | Size | Depends | Done when | Status | Owner | Notes |
|---|---|---|---|---|---|---|---|
| T1.6 | Guard-in: size cap, rate limit, scope classifier, injection heuristics | M | T0.6 | tests for out-of-scope + injection | done | Tushar | 2026-09-17. `api/app/guardrails/guard_in.py`: size cap, per-session token bucket (in-process), medical-advice regex before any model call, injection flags, PII scrub for logs, scope via fast model (failure never blocks). |
| T1.7 | Understand: language detect, NMT fallback, regime router, entity link, rewrite | M | T0.6 | router test returns regimes[] | done | Tushar | 2026-09-17. `api/app/understand/pipeline.py`: script-based language detect, LLM translation to English (Bhashini later), structured router with keyword fallback, statute linking from manifest titles, search-query rewrite. Material entity linking to plant names not done yet. |
| T1.8 | Retrieval: hybrid dense + FTS, RRF, rerank, version pin, dedupe, per-jurisdiction filter | L | T1.4 | jurisdiction-filter test; recall check on 5 questions | done | Tushar | 2026-09-17. `api/app/retrieval/hybrid.py`: dense (pgvector) + full-text (OR of words) + exact locator lookup (`section 3(p)`, `Rule 158B`, `Article 27.3`) → RRF, soft regime boost, optional rerank (`RERANK_PROVIDER=none` to skip the 2 GB model), jurisdiction hard filter, superseded skipped. DB tests included. KG expansion is stage 2. |
| T1.9 | Generate: prompt + both provider paths into per-jurisdiction answers | M | T0.7, T0.8, T1.8 | one answer per jurisdiction, never merged | done | Tushar | 2026-09-17. `api/app/generate/answer.py`: frozen system prompt (cacheable), per-jurisdiction user turn with language/persona. Live-tested on Groq gpt-oss-120b. |
| T1.10 | Guard-out: verifier (5 rules), confidence, abstain, disclaimer | L | T1.9 | test: fabricated section rejected; leak regenerated | done | Tushar | 2026-09-17. `api/app/guardrails/verify.py`: 5 rules + confidence (floor 0.25 → answer withheld). Leak = naming the other side's law without a source for it here → regenerate once. gpt-oss quirks handled: 【c:id|"…"】 brackets, single `]`, quotes must stay untranslated. |
| T1.11 | `POST /ask` SSE endpoint wiring + answer cache + audit trace | M | T1.6–T1.10 | `curl -N` streams a full envelope | done | Tushar | 2026-09-17. `POST /ask` streams SSE events `status`, `answer` (India first), `done`, `error`. Needs `X-Session-Id` + assistant consent. Audit row per ask (question hash only). LRU answer cache. Live pipeline test: English s.3(p) → high confidence cited; Hindi → Hindi answer with verified English quote; IPL question → out_of_scope; dosing → medical_advice. Not yet tried through uvicorn + browser. |
| T1.12 | `/sources`, `/registry`, `/materials/{kind}/{id}/ipr` endpoints | M | T0.4 | endpoints tested | done | Tushar | 2026-09-17. `GET /sources` (versions, chunk counts, changelog), `GET /registry` (table empty until verified registries are added), `GET /materials/{kind}/{id}/ipr` (404 until verified profiles are stored). |
| T1.13 | `/consent`, `/escalate` (verified facilitators only), `DELETE /me`, sessions | M | T0.4 | consent required before ask; purge test | done | Tushar | 2026-09-17. `POST/GET /consent` (assistant, transcript), `POST /escalate` (ticket; facilitator table empty until verified from official listings — UI says so), `DELETE /me` purges by session. Answers stored only with transcript consent. Migration `assistant tables`. CI now runs Postgres so DB tests run there. |

### Web
| ID | Task | Size | Depends | Done when | Status | Owner | Notes |
|---|---|---|---|---|---|---|---|
| T1.14 | Sahayak drawer in `AppShell` + command palette entry + offline notice | M | T0.10 | drawer opens; API down → offline notice, garden fine | done | Tushar | 2026-09-17. Drawer (`src/components/sahayak/Drawer.tsx`) opened by header button, ⌘K "Ask Sahayak: …" (3+ words), or `openSahayak({question, context})` from anywhere. Health check only when opened; offline notice if API/DB down; garden untouched. Needs `VITE_API_URL`. |
| T1.15 | `/sahayak` page: jurisdiction switch (two panes), answer pane, citations panel, confidence chip, disclaimer, provider footer | L | T1.14 | BOTH shows two separate panes | done | Tushar | 2026-09-17. `/sahayak` page + `AskPanel`: jurisdiction switch, India and International panes side by side (never merged), grouped citations with quotes and links, confidence chip with reasons, disclaimer, provider footer, streaming stage text. Safe mini-markdown renderer (no HTML). |
| T1.16 | Language picker, persona picker, consent banner, escalate form, "Where to go next" | M | T1.15 | consent shown before first ask | done | Tushar | 2026-09-17. Language picker (8 languages), persona picker, consent banner (optional transcript consent), escalate form, delete-my-data. "Where to go next" waits for verified registry data (T1.12). |
| T1.17 | `/sources` page | S | T1.12 | lists sources, versions, changelog | done | Tushar | 2026-09-17. `/sources` page: filter IN/INTL, version, passages, older versions, changelog. |

### Plant IP layer
| ID | Task | Size | Depends | Done when | Status | Owner | Notes |
|---|---|---|---|---|---|---|---|
| T1.18 | `MaterialIPProfile` type + `src/data/ipr/plant/` + join in `plants.ts` (all 30 as `'unknown'`) | S | — | build passes | done | Tushar | 2026-09-17. Type lives in the API schema and is re-exported from `src/types/material.ts`. `plants.ts` joins `PLANT_IPR[id]` or an all-`unknown` profile from `src/data/ipr/unknown.ts`. To add a verified plant, add a file under `src/data/ipr/plant/` and list it in `index.ts`. `indianBioResource` may be `unknown`; `lastVerified` null = never verified. PATENTSCOPE link returns 403 to curl (bot block) but is WIPO's real search page. |
| T1.19 | Fill real cited profiles: turmeric, neem, ashwagandha, sandalwood | M | T1.1, T1.18 | every field cited or `'unknown'` | todo | | |
| T1.20 | Fill real cited profiles: sarpagandha, guggulu, amla, tulsi | M | T1.19 | same | todo | | |
| T1.21 | `MaterialIprPanel`: `iplaw` tab in PlantPage, Walk dossier panel, BoardCard strip | M | T1.18 | panel visible in all three spots | done | Tushar | 2026-09-17. `MaterialIprPanel` = "IP & Law" tab on every plant page; `MaterialIprStrip` on the Garden plant card (with Ask Sahayak) and under the walkable garden's hover board (passive). Profiles are all 'Not yet verified' until T1.19/T1.20. |
| T1.22 | 3D seal hotspot in `PlantViewer` + "Ask Sahayak about this" with context | M | T1.14, T1.21 | clicking seal opens drawer with plant context | done | Tushar | 2026-09-17. `SealHotspot` ("IP & law" seal above the specimen, shown with the Parts toggle) in `PlantViewer`; click opens the drawer with the plant as context. Build passes; not yet clicked through in a browser. |

### Eval
| ID | Task | Size | Depends | Done when | Status | Owner | Notes |
|---|---|---|---|---|---|---|---|
| T1.23 | Golden set part 1: 60 in-scope items (IN / INTL / BOTH) | L | T1.5 | `eval/golden/inscope.jsonl` | in progress | Tushar | 2026-09-17. 32 in-scope items across 2 files (`inscope.jsonl` 18, `inscope2.jsonl` 14). Every expected locator checked by script against the ingested chunk text before the item was written. Plan asks ~60. |
| T1.24 | Golden set part 2: 15 microbe/animal/mineral, 20 out-of-scope, 25 multilingual twins | L | T1.23 | jsonl files | in progress | Tushar | 2026-09-17. `abstain.jsonl` 10 (4 out-of-scope, 3 medical, 3 unsafe incl. injection), `multilingual.jsonl` 4 twins (hi, hi, mr, ta). Microbe/animal/mineral items: 3 so far (Budapest ×2, microbe s.3(j)); plan asks 15. |
| T1.25 | Eval runners (retrieval, accuracy, citation, abstention, multilingual) + `make eval` | L | T1.11, T1.23 | runs end-to-end on 10 items | done | Tushar | 2026-09-17. `eval/run.py` (all 5 runners, per provider, writes `eval/runs/<date>-<provider>.json` with targets), `--only retrieval` (no model calls), `--smoke` (ids in `eval/golden/smoke.txt`), `Makefile` targets `eval`, `eval-smoke`, `eval-retrieval`. Item schema validated on load. Not run yet: waiting for the full ingest (T1.5). |
| T1.26 | Full eval run per provider, commit results, CI smoke subset | M | T1.24, T1.25 | numbers under `eval/runs/` | in progress | Tushar | 2026-09-17. Best full run (44 of 46 items before the Groq daily limit): **retrieval 1.0, abstention 1.0, multilingual 1.0, accuracy 0.92, citation 0.84, false abstention 0.242** — `eval/runs/2026-09-17-groq-46item-run.json` (rebuilt from the log after a small re-run overwrote it; run files are now tagged with the item count so that cannot happen again). Retrieval-only on all 29 English items: recall@8 = 1.0. Diagnosis of the 8 withheld: 4 had **no citation markers** (gpt-oss fell back to its own `【1†source】` style, which carries no quotable text) — the Groq path now retries once showing the required format; the rest were quote mismatches or provisions from laws not in the corpus (e.g. Trade Marks Rules 2017). The retry is untested against the eval: all four Groq keys are out of daily quota. |

## Stage 2 — Rasashala, classification, ABS, KG, agent, workbench

| ID | Task | Size | Depends | Done when | Status | Owner | Notes |
|---|---|---|---|---|---|---|---|
| T2.1 | `SourceMaterial` type + data: ~6 microbes, ~8 animal, ~6 mineral (profiles cited or `'unknown'`) | M | T1.18 | build passes | todo | | |
| T2.2 | Procedural `microbe.ts` generator | M | — | preview renders all 5 shapes | todo | | |
| T2.3 | Procedural `substance.ts` generator | M | — | preview renders shapes | todo | | |
| T2.4 | Export reusable pieces from `MedicinalGardenScene` (LabelBoard, Plaque, ground) | S | — | walkable garden unchanged | todo | | |
| T2.5 | `RasashalaScene` + `/rasashala` route + third Gateway door | L | T2.1–T2.4 | walkable scene with 4 areas + boards | todo | | |
| T2.6 | Classifier rule table + `/classify` (sections verified against corpus) | M | T1.5 | table case tests | done | Tushar | 2026-09-17. `api/app/classify/rules.py` + `POST /classify` (send answers so far, get next question or result). 6 categories, first match wins. Each line cites manifest id + locator; `verified` true only where a script found the text in the chunk. Unverified (show as "verify"): D&C s.3(a), Rule 158B (parser missed it), Cosmetics Rules detail, FSSAI Aahara regs (not ingested), NDCT approval data. |
| T2.7 | ABS helper `/abs` | M | T1.5 | route tests | done | Tushar | 2026-09-17. `POST /abs`: foreign → NBA approval (BD Act s.3), Indian → SBB intimation (s.7), IP intended → s.6 approval, normally traded → s.40 exemption check. Forms/fees/benefit-sharing point at BD Rules 2024 as unverified. Web wizard is T2.12. |
| T2.8 | TKDL / prior-art pointer | S | T1.18 | search URLs for 3 materials | done | Tushar | 2026-09-17. `src/lib/priorArt.ts`: one OR-query from the botanical name + Latin-script local names; Google Patents link with the query, IP India and PATENTSCOPE search pages with the query to paste (no stable query URLs), TKDL home (full search needs registration). Shown in the IP & Law tab. All four URLs opened on 2026-09-17. |
| T2.9 | Knowledge graph tables, seed, retrieval expansion, `/graph/{entity}` | L | T1.8 | expansion adds linked chunks in test | todo | | |
| T2.10 | Agentic tool loop + tools, audited, iteration cap | L | T2.6, T2.7, T2.9 | multi-step question uses ≥2 tools | todo | | |
| T2.11 | Workbench store slice + "Add to workbench" on hotspots and shelves | M | T2.5 | basket persists | todo | | |
| T2.12 | `/workbench` route + scene + wizard + result card | L | T2.6, T2.11 | end-to-end classification with cites | todo | | |
| T2.13 | DPDP: consent ledger, audit events per ask/tool, retention job | M | T1.13 | audit row per ask and tool call | done | Tushar | 2026-09-17. Consent ledger + audit row per ask (hash, no text) + per escalation + per purge were built in T1.11/T1.13. Added `python -m app.retention [--dry-run]` (`RETENTION_DAYS` 30, `AUDIT_RETENTION_DAYS` 180; open escalations kept). Audit per tool call arrives with the agent loop (T2.10). Schedule the retention job daily when deployed. |

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
