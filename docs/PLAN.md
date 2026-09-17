# IP-SAKTI Sahayak on Vanaspati — Implementation Plan (v2)

## Context

**What exists.** Vanaspati is a finished SIH-2025 entry: React 19 + Vite + three.js (R3F) virtual herbal garden with **30** AYUSH plants generated procedurally from botanical data, two 3D gardens (a themed learning garden with an orbit camera; a walkable first-person reconstruction of a real Ayurvedic herb garden with hover-to-read label boards), a compendium with Ayurvedic pharmacology, tours, atlas, quiz and a presentation reel. It is a static SPA with no backend and no network calls, deployed to GitHub Pages and Vercel.

**What is asked now.** SIH-26 PS-45 "IP-SAKTI Sahayak": a deployable, multilingual, RAG-based, source-cited assistant for IP and regulatory guidance in Ayurveda. Hard requirements: a version-tracked corpus (statutes, rules, treaties, pharmacopoeial standards, registry records, case law); an India-vs-international jurisdiction switch with the two answer-sets kept visibly separate; routing across IP types (patents, GI, trade marks, copyright, designs, trade secrets, plant-variety rights) together with a formulation-classification flow (classical / P&P / new drug / phytopharmaceutical / Ayurveda-Aahar / cosmetic) that states what each category requires and its IP and ABS posture; an ABS-compliance helper; a TKDL / prior-art pointer; mandatory citations with a confidence indicator; escalation to a human IP facilitator; Bhashini-backed multilingual delivery and voice; guardrails and a standing "information, not legal advice" disclaimer; DPDP-aligned privacy, audit and security; a relational knowledge graph and agentic multi-source orchestration; free official databases accessed directly and paid subscriptions only with explicit, logged permission; a corpus that stays current; never fabricating authority. It covers therapeutics from **plant, microbial and animal sources** and names the **Budapest Treaty (micro-organism deposits)**. Evaluated on answer accuracy, citation correctness, safe abstention and multilingual quality. It says nothing about 3D.

**The bet.** The 3D world is the USP: the assistant lives *in* it. Every plant, microbe, animal-derived and mineral ingredient carries its legal layer; a formulation is assembled by picking source materials in 3D; the classifier, ABS helper and Sahayak answer with citations from there. Underneath is a rigorous RAG backend with an eval harness, because that is what the PS is scored on.

**Constraints dropped (user decision, 2026-09-17).** The old "no backend / offline / no network" properties are not rules. Backend, API keys and network dependencies are fine; old dependencies may be replaced.

**Project name.** Formal name (matches the PS title, for the SIH submission): **IP-SAKTI Sahayak**. Product / repo name: **Vanaspati Sahayak** (`vanaspati-sahayak`) — *Vanaspati* stays the garden, *Sahayak* is the assistant, the new pharmacy scene is the *Rasashala*. `package.json` `name` changes from `sih-26-internal` to `vanaspati-sahayak`.

**Collaboration.** The folder is not a git repository yet. Stage 0 initialises git, commits the existing app, and pushes to a new GitHub repository so teammates can work from it. The plan and all project information live **in the repo** under `docs/` (not only in this local plan file): `docs/PLAN.md` (this plan, kept current), `docs/PROBLEM-STATEMENT.md` (the PS verbatim), `docs/architecture.md`, `docs/providers.md`, `docs/dpdp-and-security.md`, `docs/model-card.md`, `docs/CONTRIBUTING.md` (setup, env keys, branch and PR flow, who owns which stage), and a root `CLAUDE.md` pointing at them.

---

## Decisions (defaults; say so to change any)

| Decision | Choice | Why |
|---|---|---|
| Backend | **Python 3.12 + FastAPI** in `api/` (confirmed by user 2026-09-17) | The PS is scored on retrieval quality, and the free tooling for that is Python: local BGE-M3 embeddings and bge-reranker via `sentence-transformers`, PyMuPDF + Tesseract for scanned gazettes, chrF/judge eval harnesses. The seam is cheap: FastAPI's OpenAPI generates the web's TS types in one npm script, and the API surface is ~10 endpoints. A TS backend (Hono/Fastify) was considered and rejected because it would force hosted embeddings/reranking and weak OCR; a Python sidecar behind Node was rejected as two services to run. |
| LLM provider layer | **Pluggable `LLMProvider`** with two implementations: **Anthropic** (primary: Claude Opus 5 for answers, Sonnet 5 for rewriting/judging, Haiku 4.5 for classifiers) and **Groq** (OpenAI-compatible; free credits; models chosen from the live catalogue, e.g. Llama 3.3 70B / Llama 4 Scout or Maverick / GPT-OSS 120B / Qwen3 32B, plus Whisper Large v3 for ASR). Selected per role by env: `LLM_PROVIDER_ANSWER`, `LLM_PROVIDER_FAST`, `LLM_PROVIDER_JUDGE` | The team must be able to demo on whichever key is available. Anthropic gives native character-anchored citations; the Groq path uses a structured-citation protocol verified by the same verifier (below), so citation correctness holds on both. |
| Embeddings | Pluggable: **Voyage `voyage-law-2`** (key) or **BGE-M3 local** via `sentence-transformers` (no key, multilingual, CPU is fine for a few thousand chunks). Default `EMBED_PROVIDER=local` | Zero-cost path must exist; corpus is small. Embedding model id is stored per chunk so a switch triggers re-embedding, never mixed spaces. |
| Reranker | **`bge-reranker-v2-m3`** local, toggleable | No key; big lift on statute retrieval precision. |
| Store | **Postgres 16 + pgvector** for everything (corpus, chunks, KG, audit, consent, escalations, eval runs) | One container; the PS asks for a *relational* knowledge graph. |
| Retrieval | Hybrid: pgvector HNSW + Postgres full-text → RRF → rerank → KG expansion; **contextual chunk headers** (Anthropic contextual-retrieval technique) | Statutes need exact hits on "Section 3(p)" *and* semantic hits. |
| Multilingual | **Bhashini** (ULCA) for ASR, NMT (query→English) and TTS; answer generated directly in the user's language by the LLM; Bhashini NMT as fallback translator; Groq Whisper as ASR fallback | Bhashini approval can lag; nothing blocks on it. |
| 3D content for non-plant sources | **Procedural first** (same ethos as the plants), optional glTF hero assets (CC0) via drei `useGLTF` under `public/models/` with a `CREDITS.txt` | Consistent style, no asset pipeline; hero assets only if time allows. |
| Repo layout | Vite app stays at root; add `api/`, `corpus/`, `eval/`, `docs/`, `docker-compose.yml` | Zero churn to the working 3D app. |
| Hosting | Web on Vercel (`VITE_API_URL`); API + Postgres via Docker Compose on one VM (Render/Railway/EC2). Web degrades to garden-only with an "assistant offline" notice | The demo never loses the garden because the API is down. |
| Security baseline | Provider keys live only in the API; CORS allowlist; per-session tokens; input size caps; rate limiting; corpus text treated as untrusted data; OWASP LLM Top-10 checklist in `docs/` | PS asks for "recognised AI-application standards". |

---

## Architecture

```
┌──────────────────────────── Web (Vite app, repo root) ─────────────────────────────┐
│ Gateway: 3 doors → Learning garden · Walkable garden · Rasashala (pharmacy + lab)   │
│ Source-material IP layer (plants, microbes, animal, mineral) · Workbench (3D)       │
│ Sahayak drawer everywhere · /sahayak full page · /sources corpus browser            │
│ Zustand: jurisdiction · language · persona · consent · workbench basket · session   │
│ src/lib/sahayak/client.ts (fetch + SSE) ── types generated from OpenAPI             │
└────────────────────────────────────────┬───────────────────────────────────────────┘
                                         │ HTTPS / SSE
┌──────────────────────────────── api/ (FastAPI) ────────────────────────────────────┐
│ /ask /classify /abs /materials/{kind}/{id}/ipr /registry /escalate /consent         │
│ /sources /graph/{entity} /voice/asr /voice/tts /me                                  │
│                                                                                     │
│  1 Guard-in  2 Understand   3 Retrieve (per jurisdiction)   4 Generate   5 Guard-out│
│  scope ·     lang detect ·  regime filter · hybrid (HNSW+FTS) · LLMProvider ·      │
│  injection · NMT→EN ·       RRF · rerank · KG expand ·         citations ·          │
│  PII · rate  rewrite ·      version pin · dedupe by section    in-language          │
│              entity link ·                                     answer               │
│              persona                                           verifier · confidence│
│                                         │                      abstain · disclaimer │
│      Stage 2 agentic layer: tool loop (Anthropic tool runner / Groq tool calling)    │
│      search_corpus · lookup_material_ipr · graph_neighbors · classify_formulation · │
│      abs_check · registry_pointer · fetch_connector (consent-gated) · escalate       │
│  Cross-cutting: audit events · consent ledger · structured traces · answer cache    │
└────────────────────────────────────────┬───────────────────────────────────────────┘
                                         │
┌────────── Postgres 16 + pgvector ───────────┐   ┌──────── External ─────────────────┐
│ sources · source_versions · chunks           │   │ Anthropic API  │ Groq API         │
│ kg_entity · kg_relation · material_ipr       │   │ Voyage (opt.)  │ Bhashini ULCA    │
│ registries · facilitators                    │   │ Free official DBs (link-out +     │
│ conversations · answers · citations          │   │ cached records): TKDL, InPASS,   │
│ audit_events · consent_grants · escalations  │   │ GI Registry, NBA, WIPO, MTCC     │
│ eval_runs · retrieval_evals                  │   └──────────────────────────────────┘
└─────────────────────────────────────────────┘
┌── corpus/ (version-tracked) ── manifest.yaml · raw/ · normalised/ · CHANGELOG.md ──┐
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### The RAG pipeline in detail

**Ingest** (`api/app/ingest/`): `fetch` (URL → `raw/`, sha256, licence check) → `normalise` (pymupdf text; Tesseract OCR fallback for scanned gazettes; HTML for India Code / WIPO) → `structure` (parser for Indian statute conventions: "3. Inventions not patentable.—", "(p)", "Rule 158B", Schedules; treaty "Article 27.3(b)"; monograph headers) → `chunk` (one chunk per section/rule/article; long ones sub-split ~600 tokens with the same `locator`; every chunk gets a **contextual header**: document title + heading path + a one-line LLM-written context using the fast model with prompt caching) → `embed` (provider-tagged) → `upsert` (idempotent on `sha256`; new hash → new `source_version`, old chunks marked `superseded`, kept for traceability).

**Chunk row**: `source_id, source_version_id, jurisdiction (IN|INTL), regime, doc_type, locator, heading_path, effective_from, effective_to, language, text, context_header, embedding, embed_model, tsv`.

**Understand** (`api/app/understand/`): language detection → Bhashini NMT to English for retrieval (original kept for generation) → intent + regime classifier (fast model, structured output: `regimes[]`, `material_kinds[]`, `needs_classification`, `needs_abs`) → entity linking against the material index (plants' multilingual `names`, microbes, statutes) → one multi-query rewrite (fast model) → persona (practitioner / researcher / startup-MSME / cultivator) used only for ordering next steps.

**Retrieve** (`api/app/retrieval/`): per jurisdiction, hybrid search filtered by `jurisdiction` and (softly) `regime`; RRF over dense + lexical; rerank top-40 → top-8; KG expansion adds chunks linked to the query's entities; version pinning drops `superseded` chunks unless the question is historical; dedupe by `locator`. `BOTH` runs the two jurisdictions concurrently.

**Generate** (`api/app/generate/`): frozen, cached system prompt; retrieved chunks as documents; answer in the user's language; two provider paths:
- *Anthropic*: chunks as `document` blocks with `citations: {enabled: true}`; citations arrive as `cited_text` + document index.
- *Groq* (and any OpenAI-compatible model): chunks numbered in the prompt; model must emit `[[c:<chunk_id>|"<verbatim span>"]]` markers (JSON-schema structured output where supported); markers are parsed into the same `Citation` shape.

**Guard-out** (`api/app/guardrails/`): the **verifier** runs on both paths: (1) `cited_text` must be a normalised substring of the chunk; (2) every "Section/Rule/Article/Regulation N" token in the answer must appear in a cited chunk of the same jurisdiction; (3) no citation to a superseded version unless historical; (4) a paragraph asserting a legal rule with zero citations is flagged; (5) an `IN` pane citing an `INTL` chunk (or vice versa) is rejected and regenerated once. **Confidence** = retrieval margin × verified-citation coverage × (1 − flags) × reranker agreement, banded high/medium/low with reasons. Below the floor → `abstained: insufficient_sources` with a suggestion and the escalate path. Answers are cached by (normalised query, jurisdiction, persona, corpus version) for demo snappiness.

**Observability**: each stage logs a structured trace (timings, chunk ids, provider, model, tokens) into `audit_events`; `/health` reports provider, embed model and corpus version.

### Core contracts

```
SahayakAnswer {
  id, question, language, persona?, jurisdiction_mode: 'IN'|'INTL'|'BOTH'
  answers: [{ jurisdiction: 'IN'|'INTL', markdown, citations: Citation[],
              confidence: { score, band, reasons[] } }]
  abstained?: { reason: 'out_of_scope'|'insufficient_sources'|'medical_advice'|'unsafe', suggestion }
  classification?: ClassificationResult
  abs?: AbsResult
  next_steps: RegistryPointer[]          // question → the right registry, record or form
  escalation: { available: true, ticket_id? }
  provider: { name, model }              // shown in the UI footer
  disclaimer: string                     // standing "information, not legal advice"
}
Citation { source_id, source_title, version_label, locator, cited_text, url, jurisdiction, doc_type, verified }
RegistryPointer { registry, action, form, url, fee_note?, cite }
```

**Source-material IP profile** — generalised from plants to all four kinds, `src/data/ipr/<kind>/*.ts`, joined into the material index the same way `PLANT_HISTORY` / `PLANT_PHOTOS` are joined in `src/data/plants.ts`, and served by `GET /materials/{kind}/{id}/ipr` from the same JSON. Every field is a value with a `cite` or `'unknown'`.

```
MaterialIPProfile {
  kind: 'plant'|'microbe'|'animal'|'mineral'
  tk:            { tkdl: 'documented'|'unknown', classicalTexts: string[], cite }
  patentability: { note, cites[] }          // e.g. s.3(p) TK bar; s.3(j) microbe carve-out; s.3(j) animals excluded
  patents:       { landmark: [{ title, number, office, outcome, year, cite }], search: { inpass, patentscope, googlePatents } }
  deposit?:      { budapest: true, indianIDAs: string[], cite }      // microbes only
  gi:            { tags: [{ name, regNo, cite }] }
  biodiversity:  { indianBioResource: bool, normallyTradedCommodity: bool|'unknown', cites[] }
  wildlife?:     { protectedSchedule?: string, cites?: bool, cites[] } // animal-derived
  export:        { restricted: bool|'unknown', cite }
  drugSchedules: { scheduleE1: bool|'unknown', heavyMetalTesting?: bool, cite }
  monographs:    { api?: { volume, part }, cite }
  lastVerified:  ISO date
}
```

---

## The 3D USP

1. **Source-material IP layer.** An "IP & Law" panel wherever the Ayurvedic fingerprint already appears (new `iplaw` tab in `PlantPage`, the Grand Walk dossier in `src/routes/Garden.tsx`, an IP strip on the walkable garden's `BoardCard`), and a floating "seal" hotspot above every 3D specimen (new pin kind in `src/three/PlantViewer.tsx`, anchored at `plantTopY()`). "Ask Sahayak about this" pre-seeds context.

2. **The Rasashala (`/rasashala`) — a third door on the Gateway.** An Ayurvedic pharmacy and lab scene (`src/three/RasashalaScene.tsx`) built from the walkable garden's building blocks (ground, boards, plaque, walk controls), holding the non-plant sources the PS names:
   - **Fermentation hall**: asava / arishta vats; the microbial sources (yeasts on dhataki flowers, lactobacilli in takra) as procedural microbe models; boards on classical fermented preparations and their regulatory status.
   - **Culture vault**: cryo-vials and agar plates for **Budapest Treaty deposits**; boards on why micro-organisms are patentable in India (Patents Act s.3(j) carve-out; *Dimminaco* case), the deposit requirement in s.10(4)(d)(ii), Indian International Depositary Authorities (e.g. MTCC Chandigarh; list verified from WIPO), and BD Act coverage of microbes.
   - **Animal-derived shelf**: madhu (honey), ghrita (ghee), dugdha, mukta (pearl), shankha (conch), pravala (coral), shilajit, with Wildlife (Protection) Act and CITES posture (e.g. kasturi/musk prohibited) and FSSAI standards.
   - **Rasa (mineral) shelf**: bhasmas (loha, swarna, abhrak), with Schedule E(1) supervision and heavy-metal testing/labelling requirements.
   - **The Workbench** sits in the middle of the Rasashala (item 3).
   Procedural generators: `src/three/procedural/microbe.ts` (cocci chains, bacilli rods, budding yeast, branching hyphae, spirilla — seeded by `rng.ts`), `src/three/procedural/substance.ts` (honeycomb prisms, lathe pots, noise-displaced rocks, parametric conch, pearl/coral spheres). Data: `src/data/materials/{microbes,animal,mineral}.ts` with a shared `SourceMaterial` type (`id, kind, names, description, classicalUse, model spec`). Optional glTF hero assets for the vat and the conch.

3. **Formulation Workbench (`/workbench`, inside the Rasashala).** Part hotspots in `PlantViewer` and the Grand Walk, and the Rasashala shelves, gain "Add to workbench". The bench scene (`src/three/WorkbenchScene.tsx`) lines up the chosen materials with the selected part pinned (reuses `PlantObject`, `hotspotAnchors`, the microbe/substance generators). Left: composition (material, part, proportion, process: decoction / powder / extract / standardised fraction / fermentation / bhasma). Right: the classifier's minimum-question wizard. Result card: category, requirements, IP posture, ABS posture, next registry steps, all cited; "Ask Sahayak about this formulation". Basket persists like bookmarks.

4. **Sahayak everywhere.** Slide-over drawer from the header, the command palette (`⌘K` → "Ask Sahayak: …") and inside all three scenes (context = current material / bed / basket). Full page at `/sahayak`: jurisdiction switch (two panes for BOTH), language picker, mic (Bhashini ASR; Groq Whisper fallback), citations panel with deep links, confidence chip, "Where to go next", escalate, standing disclaimer, provider footer.

5. **Registry Marg (stage 3).** A 3D street off the walkable garden gate — Patent Office, GI Registry, Trade Marks Registry, NBA, State ASU Licensing Authority, FSSAI, an IDA — each a board (`LabelBoard` / `BoardCard`) listing the forms and links that `next_steps` carries. The 2D "Where to go next" panel ships first.

6. **Presentation mode and tours.** New `SCENES` (IP layer, Rasashala, workbench, Sahayak); one new tour "Who owns the neem tree?" (turmeric / neem / basmati → s.3(p) → TKDL → GRATK disclosure).

---

## Routing across IP types and the classification flow

**Regime router** (fast model + rules) tags each question with regimes: `patent | gi | trademark | copyright | design | trade_secret | pvp | abs | drug_licensing | advertising | labelling | food | cosmetic | treaty | market_access`. Retrieval is soft-filtered by regime; `next_steps` are chosen by regime × persona (e.g. cultivator → GI, PPV&FR farmers' rights, ABS benefit-sharing; startup → TM, ASU licence, advertising; researcher → patents, Budapest deposit, TKDL).

**Classification rule table** (`api/app/classify/rules.py`) — each step stores a **citation id** into the corpus, so a legal correction is a one-field change. The LLM only asks the questions conversationally; the branch is decided by the table. First match wins.

| # | Question | Category | Requires | IP / ABS posture |
|---|---|---|---|---|
| 1 | External only, cleanse/beautify, no therapeutic claim? | **Cosmetic** (Cosmetics Rules 2020) | cosmetic licence, labelling | TM, design, trade secret; ABS if Indian bio-resource |
| 2 | Oral, positioned as food with a health (not disease) claim, Ayurvedic ingredients/texts? | **Ayurveda-Aahar / nutraceutical** (FSSAI Ayurveda Aahar Regs 2022; probiotic products under FSSAI Nutraceutical Regs) | FSSAI licence, claims and ad rules | TM; GI for ingredients; ABS |
| 3 | Formulation *and* method exactly as in a First-Schedule text? | **Classical / generic ASU medicine** (D&C Act s.3(a)) | ASU licence (Rule 158B), Schedule T GMP, API/AFI standards; no proof-of-effectiveness | TK → Patents Act s.3(p) bar; defended via TKDL; TM for brand only |
| 4 | All ingredients from First-Schedule texts / API, but novel combination, proportion or dosage form? | **Patent-or-Proprietary ASU medicine** (s.3(h)) | Rule 158B proof of effectiveness | Patent possible if inventive and not s.3(p)/s.3(e); trade secret; TM |
| 5 | Purified, standardised fraction with ≥4 bio-active markers, human use? | **Phytopharmaceutical drug** (D&C Rules definition; Schedule Y Appendix IB) | CDSCO approval, clinical data | Strong patent potential; NBA approval before grant (BD Act s.6); ABS |
| 6 | Otherwise (new ingredient, microbe-derived active, new route or indication) | **New / non-classical drug** | proof of safety and effectiveness | Patent potential (microbes: s.3(j) carve-out, Budapest deposit, s.10(4)(d)(ii) disclosure); ABS; TKDL check |

Cross-cutting, asked once: applicant Indian vs foreign / foreign-controlled; uses an Indian biological resource (plant, microbe or animal); on the *normally traded commodities* list; export-restricted (DGFT / CITES / Wildlife Act schedule); patent filing intended (GRATK-style source disclosure). These feed the **ABS helper** (`POST /abs`): route (SBB intimation vs NBA approval), benefit-sharing bracket, forms — every line cited to the BD Act 2002 as amended 2023 and the 2024 Rules / current ABS regulations.

> Section numbers are the team's current belief and are **verified against the ingested corpus in stage 1** before the table is frozen; notable "verify" items: the status of D&C Rule 170 (advertising) after the 2024 omission, current ABS regulations, the Indian IDA list.

---

## Corpus (version-tracked, open sources)

**India (`IN`)** — Patents Act 1970 + Patents Rules 2003 as amended 2024; Manual of Patent Office Practice; TKDL access guidelines; GI Act 1999 + Rules; Trade Marks Act 1999 + Rules 2017; Designs Act 2000; Copyright Act 1957; PPV&FR Act 2001 (incl. farmers' rights); Biological Diversity Act 2002 (2023 amendment) + BD Rules 2024 + current ABS regulations + normally-traded-commodities notification; Drugs & Cosmetics Act 1940 + Rules 1945 (Part XVI/XVII, Rule 158B, Rule 161 labelling, Rule 170 status, Schedules E(1), T, the First Schedule); heavy-metal testing notification for ASU exports; Drugs & Magic Remedies (Objectionable Advertisements) Act 1954; New Drugs & Clinical Trials Rules 2019; Cosmetics Rules 2020; FSSAI Ayurveda Aahar Regs 2022 + Nutraceutical/Probiotic Regs; Legal Metrology (Packaged Commodities) Rules; Wildlife (Protection) Act 1972 schedules; DGFT export policy for plant species; Consumer Protection Act + CCPA misleading-ads guidelines + ASCI code; Ayurvedic Pharmacopoeia / Formulary of India monograph index (PCIM&H); **registry records**: GI Register entries for Ayurveda-relevant products, InPASS records for landmark patents, NBA approval lists, WIPO IDA list; **case law**: turmeric (USPTO re-exam), neem (EPO), basmati, *Novartis v UoI*, *Divya Pharmacy v UoI* (ABS), *Dimminaco v Controller* (microbes), *IMA v UoI* (Patanjali advertising).

**International (`INTL`)** — TRIPS (esp. Art. 27.3(b)); Paris Convention; CBD; Nagoya Protocol; WIPO GRATK Treaty 2024 (disclosure requirement); PCT + Regulations; Madrid Protocol; Hague Agreement; Budapest Treaty + Regulations; market access: EU THMPD (2004/24/EC) and Novel Food, US FDA Botanical Drug guidance + DSHEA, Health Canada NHP Regulations, Australia TGA complementary medicines, UK MHRA THR; WHO herbal medicine guidelines; trade secrets via TRIPS Art. 39 (India has no statute — common law, flagged as such).

`corpus/manifest.yaml` is the single source of truth (`id, title, jurisdiction, regime[], doc_type, issuer, url, retrieved_at, sha256, version_label, effective_from, effective_to?, language, licence`). `corpus/CHANGELOG.md` records every bump. `ingest --check-currency` (scheduled) re-fetches, diffs hashes and opens a review entry — the PS's "keep its corpus current". `GET /sources` and the `/sources` page expose corpus, versions and changelog to users and judges.

---

## Staged build

### Stage 0 — Foundations
- **Immediately after approval — documentation only, no code** (user instruction 2026-09-17: "add the plan in the directory, don't start coding"): write `docs/PLAN.md` (this plan), `docs/PROBLEM-STATEMENT.md` (PS verbatim), `docs/architecture.md`, `docs/providers.md`, `docs/CONTRIBUTING.md` and a root `CLAUDE.md`; then stop and wait. Git init / GitHub push, the `package.json` rename and every code task below start only when the user says go.
- `api/`: FastAPI skeleton (`app/main.py`, `app/settings.py`, `app/db/` SQLAlchemy + Alembic, `app/schemas/`, `/health`), `pyproject.toml`, `ruff`, `pytest`, `Dockerfile`.
- `api/app/llm/`: `base.py` (`LLMProvider`: `complete`, `complete_structured`, `answer_with_citations`, `tool_loop`, `transcribe`), `anthropic_provider.py` (official SDK; adaptive thinking; `citations`; tool runner; `fallbacks` opt-in), `groq_provider.py` (official `groq` SDK; JSON-schema output; marker citations; tool calling; Whisper), `router.py` (role → provider/model from env). `api/app/embed/` with `voyage.py` and `local.py` (BGE-M3). `api/app/rerank/local.py`.
- `docker-compose.yml`: `postgres` (pgvector image) + `api`; `.env.example`: `ANTHROPIC_API_KEY`, `GROQ_API_KEY`, `VOYAGE_API_KEY` (optional), `LLM_PROVIDER_ANSWER|FAST|JUDGE`, `LLM_MODEL_*`, `EMBED_PROVIDER`, `BHASHINI_USER_ID`, `BHASHINI_API_KEY`, `DATABASE_URL`, `VITE_API_URL`.
- `corpus/manifest.yaml` seeded with ~30 sources; `api/app/ingest/{fetch,normalise,structure,chunk,embed,upsert}.py`.
- Web: `src/lib/sahayak/client.ts`; `npm run gen:api` → `src/types/sahayak.ts`; `src/store/useSahayak.ts`; `.env.example` with `VITE_API_URL`; fix the plaque texture path at `src/three/MedicinalGardenScene.tsx:48`.
- `docs/architecture.md`, `docs/dpdp-and-security.md` (consent, minimisation, retention, audit, threat model incl. prompt injection from corpus PDFs, OWASP LLM Top-10 checklist), `docs/model-card.md` (NIST AI RMF / ISO 42001 vocabulary), `docs/providers.md` (Anthropic vs Groq setup, what changes).

### Stage 1 — Citation-grounded retrieval MVP (the evaluable core)
- Understand, retrieve, generate, guard-out and confidence exactly as specified above; `/ask` (SSE), `/materials/{kind}/{id}/ipr`, `/registry`, `/escalate` (ticket + facilitator directory populated only from official listings — candidates: CIPAM/DPIIT IPR facilitation, NRDC, TIFAC PFC, State AYUSH licensing authorities — verified before inclusion), `/consent`, `/sources`, `DELETE /me`; per-session rate limit.
- Web: `/sahayak`, drawer + palette entry, jurisdiction switch (two panes), citations panel, confidence chip, disclaimer, escalate form, language picker (text), persona picker, consent banner, offline notice, `/sources` page, provider footer.
- Plant IP layer for all 30 plants (filled first: turmeric, neem, ashwagandha, sandalwood, sarpagandha, guggulu, amla, tulsi; the rest `'unknown'` until verified), joined in `plants.ts`, `iplaw` tab, Walk dossier, board strip, 3D seal hotspot.
- **Eval harness v1** (`eval/`): golden set ~120 items — ≈60 in-scope across regimes (IN / INTL / BOTH), 15 microbe/animal/mineral items, 20 out-of-scope or unsafe, 25 multilingual twins (Hindi / Marathi / Tamil). Runners: **retrieval** (recall@8 of the expected locator), **accuracy** (judge model with rubric), **citation correctness** (deterministic: verified citations ∧ expected locator present), **abstention** (rate on out-of-scope, false-abstain on in-scope), **multilingual** (agreement with the English twin + chrF vs reference). Run per provider (`make eval PROVIDER=anthropic|groq`) so the team can show both. CI runs a 15-item smoke subset per PR.

### Stage 2 — Rasashala, classification, ABS, knowledge graph, agentic layer, workbench
- **Rasashala** scene, procedural microbe/substance generators, `SourceMaterial` data for ~6 microbes, ~8 animal-derived, ~6 mineral entries with IP profiles; third Gateway door; culture-vault Budapest boards.
- **Classifier** (`/classify`), **ABS helper** (`/abs`), **TKDL / prior-art pointer** (search strings + URLs for TKDL, InPASS, PATENTSCOPE, Google Patents from Sanskrit / botanical / strain synonyms).
- **Knowledge graph**: `kg_entity` (material, formulation, statute_section, treaty_article, category, registry, jurisdiction, ida) and `kg_relation` (`documented_in`, `barred_by`, `requires`, `deposited_at`, `regulated_by`, `binds`, `filed_at`); seeded from corpus + material data; used for retrieval expansion, classification explanations and a small graph view in the answer pane; `/graph/{entity}`.
- **Agentic orchestration** (`api/app/agent/`): tool loop via the provider layer (Anthropic tool runner; Groq tool calling behind the same interface), tools `search_corpus`, `lookup_material_ipr`, `graph_neighbors`, `classify_formulation`, `abs_check`, `registry_pointer`, `escalate`; every call audited; iteration cap.
- **Workbench** route and scene; "Add to workbench" on hotspots and shelves; wizard; result card; store slice.
- **DPDP / audit**: `consent_grants`, `audit_events` per ask / tool / connector, retention job, purge, secrets only in env.

### Stage 3 — Connectors, full multilingual and voice, Registry Marg
- **Connectors** (`api/app/connectors/`): free official DBs first (deep links; cached snapshots of public record pages where URLs are stable — IP India and TKDL have no public API, stated honestly in the UI); paid sources only via a consent-gated connector using the user's own credentials, one `consent_grants` row + audit event per call.
- **Voice**: `/voice/asr` (Bhashini; Groq Whisper fallback) and `/voice/tts` (Bhashini; browser `useNarrator` fallback); mic in the drawer.
- **UI i18n** (react-i18next) for chrome strings in Hindi + one more language.
- **Registry Marg** 3D street; presentation scenes; the new tour; README and deck refresh.

---

## PS requirement → where it is met

| PS requirement | Where |
|---|---|
| Deployable, multilingual RAG assistant | Docker Compose + Vercel; Bhashini + in-language generation; provider layer |
| Curated, version-tracked corpus incl. pharmacopoeial standards, registry records, case law | Corpus list; `manifest.yaml`; `source_versions`; `/sources` |
| Jurisdiction toggle, answer-sets visibly separate | `answers[]` per jurisdiction; two-pane UI; verifier rule 5 |
| Routing across IP types (patents, GI, TM, copyright, designs, trade secrets, PVP) | Regime router; regime-filtered retrieval; persona-ordered next steps |
| Formulation-classification flow with minimum questions; requirements and IP/ABS posture per category | Rule table; Workbench wizard; `/classify` |
| Plant, microbial and animal sources; Budapest Treaty deposits | Rasashala; `SourceMaterial` kinds; `deposit` field; s.3(j) / s.10(4)(d)(ii) content; culture vault |
| ABS-compliance helper | `/abs`; cross-cutting questions |
| TKDL / prior-art pointer | Stage 2 pointer; `patents.search` URLs |
| Mandatory citations, confidence indicator, escalation to a human facilitator | Citations on both provider paths; verifier; confidence; `/escalate` + facilitator directory |
| Bhashini multilingual delivery and voice | Understand stage; stage 3 voice endpoints |
| Guardrails and standing disclaimer | Guard-in / guard-out; `disclaimer` in every envelope |
| Privacy, audit, security aligned to DPDP and AI standards | Consent ledger, audit events, purge, retention, security baseline, model card, OWASP checklist |
| Relational knowledge graph; agentic multi-source orchestration | Stage 2 KG tables; tool loop |
| Free official DBs directly; paid only with explicit, logged permission | Stage 3 connectors + `consent_grants` |
| From question to the right registry, record or form | `next_steps`, `/registry`, Registry Marg |
| Cite specific statute / rule / article / record; never fabricate authority; keep corpus current | `locator` on every citation; verifier rules 2–4; `'unknown'` in profiles; `--check-currency` |
| Advertising, labelling, food and cosmetic regimes | Corpus (DMR Act, Rule 161/170, CCPA, ASCI, Legal Metrology, FSSAI, Cosmetics Rules) and router regimes |
| 2024 patent rules, 2023/2024 biodiversity changes, GRATK 2024 | Corpus; disclosure question in cross-cutting flow |
| Evaluable on accuracy, citation correctness, abstention, multilingual quality | Eval harness v1 (five runners, per provider) |
| Staged build (MVP → graph/agentic → connectors/multilingual/voice) | Stages 1–3 |

---

## Critical files

**New (backend)** — `api/app/main.py`, `api/app/llm/{base,anthropic_provider,groq_provider,router}.py`, `api/app/embed/{voyage,local}.py`, `api/app/rerank/local.py`, `api/app/ingest/{fetch,normalise,structure,chunk,embed,upsert}.py`, `api/app/understand/{language,router,entities,rewrite}.py`, `api/app/retrieval/hybrid.py`, `api/app/generate/answer.py`, `api/app/guardrails/{scope,inject,verify,confidence}.py`, `api/app/classify/rules.py`, `api/app/abs/helper.py`, `api/app/kg/{models,seed,expand}.py`, `api/app/agent/tools.py`, `api/app/connectors/`, `api/app/bhashini.py`, `api/alembic/`, `corpus/manifest.yaml`, `eval/golden/*.jsonl`, `eval/run.py`, `docker-compose.yml`.

**New (web)** — `src/routes/{Sahayak,Rasashala,Workbench,Sources}.tsx`, `src/three/{RasashalaScene,WorkbenchScene}.tsx`, `src/three/procedural/{microbe,substance}.ts`, `src/data/materials/{microbes,animal,mineral}.ts`, `src/data/ipr/<kind>/*.ts`, `src/types/material.ts`, `src/components/sahayak/{Drawer,AnswerPane,Citations,ConfidenceChip,JurisdictionSwitch,LanguagePicker,PersonaPicker,Escalate,NextSteps,ConsentBanner}.tsx`, `src/components/MaterialIprPanel.tsx`, `src/lib/sahayak/client.ts`, `src/types/sahayak.ts` (generated), `src/store/useSahayak.ts`.

**Modified (web)** — `src/App.tsx` (routes), `src/routes/Gateway.tsx` (third door), `src/components/AppShell.tsx` (nav + drawer), `src/components/CommandPalette.tsx`, `src/data/plants.ts` (join IP profiles), `src/types/plant.ts` (`ipr`), `src/routes/PlantPage.tsx` (`iplaw` tab), `src/routes/Garden.tsx` (dossier panel, add-to-workbench), `src/three/PlantViewer.tsx` (seal hotspot, add action), `src/three/MedicinalGardenScene.tsx` (plaque path fix; export reusable `LabelBoard`/`Plaque`/ground pieces for the Rasashala), `src/components/BoardCard.tsx` (IP strip), `src/components/PresentationMode.tsx`, `src/data/tours.ts`, `.github/workflows/` (API CI: lint, tests, eval smoke).

**Reused as-is** — `hotspotAnchors`, `PlantObject`, `plantTopY`, `makeRng`/`hashSeed` (`src/three/procedural/rng.ts`), `createOrganMaterial`, `WalkControls`, `useNarrator`, `searchPlants`, `BoardCard`, the `useGarden` persist pattern, `asset()`, `useDetail`.

---

## Risks and mitigations

- **Provider keys / credits**: provider layer lets the demo run on Anthropic or Groq; eval runs per provider so quality differences are known, not discovered on stage. Groq path's marker citations are verified by the same verifier, so "citation correctness" never depends on the provider.
- **Bhashini credentials** (ULCA registration can take days): apply on day 1; NMT falls back to the LLM, ASR to Groq Whisper, TTS to the browser.
- **IP India / TKDL have no public API**: link-out with prebuilt queries plus cached public record snapshots in the corpus; stated honestly in the UI.
- **Legal accuracy**: rules hold citation ids verified during ingestion; anything unverified renders as "verify with a facilitator", never as a claim; `'unknown'` is a first-class value in IP profiles.
- **BOTH-mode latency**: two passes run concurrently; India pane streams first; answer cache for repeated demo questions.
- **3D scope creep**: Rasashala and Workbench are stage 2, Registry Marg and glTF hero assets stage 3; the stage-1 demo needs only the IP layer and the drawer.
- **Scanned gazettes**: OCR fallback in ingest; manual review of the ~10 most-cited sections.

---

## Verification

- **API**: `docker compose up`; `pytest` — jurisdiction filter, verifier rejects a fabricated section, jurisdiction-leak regeneration, classifier table cases, ABS routes, consent required before ask, provider switch round-trips the same `Citation` shape; `curl -N localhost:8000/ask` streams an envelope whose first citation's `cited_text` is found in the named chunk on both `LLM_PROVIDER_ANSWER=anthropic` and `=groq`.
- **Eval**: `make eval PROVIDER=…` — MVP targets: retrieval recall@8 ≥ 0.85, citation correctness ≥ 0.95, judge accuracy ≥ 0.80, abstention on out-of-scope ≥ 0.95 with false-abstain ≤ 0.10, multilingual agreement ≥ 0.85; results committed under `eval/runs/`.
- **Web**: `npm run build && npm run lint`; manual flows — ask "Can I patent Triphala?" in Hindi with BOTH → two panes, s.3(p) cited on the India side, TRIPS / GRATK on the international side, confidence chip, disclaimer, provider footer; hover neem in the walkable garden → IP strip → Sahayak with plant context; enter the Rasashala → culture vault board cites s.3(j) and the Budapest Treaty; add "Amla fruit" + "Turmeric rhizome" + "dhataki-yeast ferment" → `/workbench` → wizard → result with citations; stop the API → garden still works, Sahayak shows the offline notice.
- **Privacy**: consent banner precedes the first ask; one `audit_events` row per ask and per tool call; `DELETE /me` purges by session id.
