# Architecture — Vanaspati Sahayak (IP-SAKTI Sahayak)

Companion to [PLAN.md](PLAN.md). The plan says *what* and *when*; this says *how the pieces fit* so anyone can pick up a stage without re-deriving it.

## 1. System overview

Three deployables, one database, a version-tracked corpus on disk.

| Piece | Where | Runtime | Talks to |
|---|---|---|---|
| **Web** | repo root (`src/`) | Vite build, static hosting (Vercel / GitHub Pages) | API over HTTPS + SSE |
| **API** | `api/` | FastAPI on Uvicorn, Docker | Postgres, Anthropic, Groq, Voyage (optional), Bhashini |
| **Ingest job** | `api/app/ingest/` | CLI inside the API image (`python -m app.ingest …`) | `corpus/`, Postgres, embedding provider |
| **Postgres 16 + pgvector** | Docker | one instance | — |
| **Corpus** | `corpus/` | files in git (`manifest.yaml`, `raw/`, `normalised/`, `CHANGELOG.md`) | read by ingest |

The web app must work with the API down: the three 3D scenes and the compendium are static; only the Sahayak drawer, the Workbench wizard and the `/sources` page depend on the API, and they show an "assistant offline" notice when `/health` fails.

## 2. Request flow for `POST /ask`

```
client ──► /ask {question, language?, jurisdiction_mode, persona?, context?}
   │
   ├─ 1 guard-in     rate limit · consent check · size cap · scope classifier (fast model)
   │                 injection heuristics · PII scrub for logs
   │                 └─ out of scope? ──► abstained envelope (with suggestion + escalate path)
   │
   ├─ 2 understand   detect language · Bhashini NMT → English (original kept)
   │                 regime router (structured output: regimes[], material_kinds[], needs_classification, needs_abs)
   │                 entity link (materials by multilingual names, statutes by name/section)
   │                 one multi-query rewrite
   │
   ├─ 3 retrieve     for each jurisdiction in mode (IN, INTL, or both concurrently):
   │                   dense (pgvector HNSW) + lexical (tsvector) → RRF → rerank top-40→8
   │                   + KG expansion (chunks linked to linked entities)
   │                   version pin (drop superseded) · dedupe by locator
   │
   ├─ 4 generate     per jurisdiction: frozen cached system prompt + chunks as documents
   │                 provider = LLM_PROVIDER_ANSWER (Anthropic: native citations · Groq: marker citations)
   │                 answer written in the user's language
   │
   ├─ 5 guard-out    verifier (5 rules) · confidence · leak check (regenerate once)
   │                 below floor? ──► abstained: insufficient_sources
   │                 attach next_steps (registry pointers by regime × persona), disclaimer, provider
   │
   └─ audit_events (trace per stage) · answer cache · SSE stream to client
```

Stage 2 adds the agentic loop between 2 and 5: the model may call `search_corpus`, `lookup_material_ipr`, `graph_neighbors`, `classify_formulation`, `abs_check`, `registry_pointer`, `escalate`. Every call is audited; iterations are capped.

## 3. Data model (Postgres)

Corpus and retrieval

- `sources` — one row per document in `corpus/manifest.yaml`: `id, title, jurisdiction, regime[], doc_type, issuer, url, licence, language`.
- `source_versions` — `id, source_id, version_label, sha256, retrieved_at, effective_from, effective_to, superseded`.
- `chunks` — `id, source_version_id, locator, heading_path, text, context_header, embedding vector, embed_model, tsv, jurisdiction, regime[], doc_type` (denormalised for filter speed). Index: HNSW on `embedding`, GIN on `tsv`, btree on `(jurisdiction, doc_type)`.

Knowledge graph (stage 2)

- `kg_entity` — `id, kind (material | formulation | statute_section | treaty_article | category | registry | jurisdiction | ida), label, ref` where `ref` points to a chunk locator or a material id.
- `kg_relation` — `src, rel (documented_in | barred_by | requires | deposited_at | regulated_by | binds | filed_at), dst, cite_chunk_id`.

Materials and registries

- `material_ipr` — `kind, material_id, profile jsonb, last_verified` (same JSON the web bundles under `src/data/ipr/`; the API is the source of truth once stage 1 lands, the web copy is regenerated from it).
- `registries` — `id, name, jurisdiction, regime, url, forms jsonb, fee_note, cite_chunk_id`.
- `facilitators` — `id, name, body, contact, source_url, verified_at` (only official listings).

Conversations, compliance, evaluation

- `conversations` / `answers` / `citations` — `answers.envelope jsonb`, `citations.verified bool`.
- `consent_grants` — `session_id, scope (assistant | connector:<name>), granted_at, revoked_at`.
- `audit_events` — `session_id, kind (ask | tool_call | connector | escalate | purge), payload jsonb (no raw PII), created_at`.
- `escalations` — `id, session_id, transcript_ref, facilitator_id, status`.
- `eval_runs` / `retrieval_evals` — one row per run with metrics jsonb and the corpus version.

Sessions are anonymous ids issued by the API and held in the web store; no account is required. `DELETE /me` purges by session id.

## 4. API surface

| Method | Path | Stage | Notes |
|---|---|---|---|
| GET | `/health` | 0 | provider, embed model, corpus version |
| POST | `/ask` | 1 | SSE; body per §2; returns `SahayakAnswer` |
| GET | `/materials/{kind}/{id}/ipr` | 1 | `MaterialIPProfile` |
| GET | `/registry` | 1 | registries + forms, filter by regime/jurisdiction |
| POST | `/escalate` | 1 | creates ticket; optional email |
| POST | `/consent` | 1 | grant/revoke by scope |
| GET | `/sources` | 1 | corpus browser: sources, versions, changelog |
| DELETE | `/me` | 1 | purge session data |
| POST | `/classify` | 2 | rule-table classification |
| POST | `/abs` | 2 | ABS helper |
| GET | `/graph/{entity}` | 2 | neighbours for the graph view |
| POST | `/voice/asr`, `/voice/tts` | 3 | Bhashini with fallbacks |

OpenAPI at `/openapi.json`; `npm run gen:api` regenerates `src/types/sahayak.ts`.

## 5. Contracts

```ts
type Jurisdiction = 'IN' | 'INTL'

interface SahayakAnswer {
  id: string
  question: string
  language: string                 // BCP-47, e.g. 'hi', 'mr', 'ta', 'en'
  persona?: 'practitioner' | 'researcher' | 'startup' | 'cultivator'
  jurisdiction_mode: 'IN' | 'INTL' | 'BOTH'
  answers: Array<{
    jurisdiction: Jurisdiction
    markdown: string
    citations: Citation[]
    confidence: { score: number; band: 'high' | 'medium' | 'low'; reasons: string[] }
  }>
  abstained?: { reason: 'out_of_scope' | 'insufficient_sources' | 'medical_advice' | 'unsafe'; suggestion: string }
  classification?: ClassificationResult
  abs?: AbsResult
  next_steps: RegistryPointer[]
  escalation: { available: true; ticket_id?: string }
  provider: { name: 'anthropic' | 'groq'; model: string }
  disclaimer: string
}

interface Citation {
  source_id: string; source_title: string; version_label: string
  locator: string                  // 's.3(p)', 'Rule 158B(1)(b)', 'Art. 27.3(b)'
  cited_text: string; url: string
  jurisdiction: Jurisdiction; doc_type: string; verified: boolean
}

interface RegistryPointer { registry: string; action: string; form?: string; url: string; fee_note?: string; cite: Citation }
```

Rules that never bend:

1. `answers[]` holds one object per jurisdiction. The UI renders them in separate panes and never concatenates them.
2. Every legal assertion carries a verified citation or is flagged. Flags lower confidence; enough flags produce an abstention.
3. `disclaimer` is present on every envelope, including abstentions.

## 6. Web integration points

| Feature | Files | Reuses |
|---|---|---|
| Sahayak drawer + `/sahayak` | `src/components/sahayak/*`, `src/routes/Sahayak.tsx`, `src/lib/sahayak/client.ts`, `src/store/useSahayak.ts` | `AppShell` header, `CommandPalette` |
| IP layer on plants | `src/data/ipr/plant/*.ts`, `src/components/MaterialIprPanel.tsx`; tab in `PlantPage`, panel in `Garden.tsx` dossier, strip in `BoardCard` | join pattern in `src/data/plants.ts`; `plantTopY` for the 3D seal pin in `PlantViewer` |
| Rasashala scene | `src/three/RasashalaScene.tsx`, `src/three/procedural/{microbe,substance}.ts`, `src/data/materials/*` | `MedicinalGardenScene` ground/boards/plaque, `WalkControls`, `rng.ts`, `materials.ts` |
| Workbench | `src/routes/Workbench.tsx`, `src/three/WorkbenchScene.tsx` | `PlantObject`, `hotspotAnchors`, the Rasashala generators |
| Sources browser | `src/routes/Sources.tsx` | — |

Zustand store additions (`useSahayak`): `sessionId, jurisdiction, language, persona, consent, workbench: {items}`; persisted like `useGarden`.

## 7. Security and privacy baseline

- Provider keys exist only in the API environment; the browser never sees them.
- CORS allowlist of the web origins; per-session tokens; request size caps; per-session rate limit.
- Corpus text is untrusted data: it is placed in document blocks, never in the system prompt; the verifier does not trust model-emitted locators, it checks them against chunks.
- Audit rows carry hashes and ids, not raw questions, unless the user consented to transcript retention for escalation.
- Retention job purges conversations after a configured window; `DELETE /me` purges immediately.
- Checklists kept in `docs/dpdp-and-security.md` (to be written in stage 0): DPDP principles (notice, consent, purpose limitation, minimisation, retention, grievance), OWASP LLM Top-10, NIST AI RMF mapping in `docs/model-card.md`.

## 8. Deployment

- `docker-compose.yml`: `postgres` (pgvector image, volume), `api` (build from `api/Dockerfile`, env from `.env`). Optional `ingest` one-shot service.
- Web: Vercel with `VITE_API_URL` set to the API's public URL; GitHub Pages workflow stays for the static garden.
- CI (GitHub Actions): web `lint + build`; api `ruff + pytest`; eval smoke subset (15 items) against a seeded test corpus.
