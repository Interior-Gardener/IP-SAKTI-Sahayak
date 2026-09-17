# Vanaspati Sahayak — project notes for Claude Code

**What this is.** The SIH-2025 "Vanaspati" virtual herbal garden (React 19 + Vite + three.js via R3F, static SPA) being extended for SIH-26 problem statement PS-45, **IP-SAKTI Sahayak**: a multilingual, RAG-based, source-cited assistant for IP and regulatory guidance in Ayurveda. The 3D garden is the differentiator; the assistant, corpus and eval harness are what gets scored.

**Read first**

- `docs/PLAN.md` — the approved plan: decisions, architecture, stages, requirement coverage, verification.
- `docs/PROBLEM-STATEMENT.md` — the organisers' text, verbatim.
- `docs/architecture.md` — request flow, data model, API surface, contracts.
- `docs/providers.md` — Anthropic vs Groq, embeddings, Bhashini, env vars.
- `docs/CONTRIBUTING.md` — setup, keys, branch flow, ownership.

**Working rules**

- Old README claims ("no backend", "offline after first load", "no network") are **not** constraints; the user dropped them on 2026-09-17. A backend, API keys and network calls are expected.
- Stages start only when the user says go. Do not begin coding a stage on your own initiative.
- Never fabricate legal authority anywhere: code, data, docs, answers. Use `'unknown'` or "verify" with a citation id into `corpus/manifest.yaml`.
- The garden must keep working with the API down. Any new API dependency on an existing page ships with its offline path.
- Keep the two jurisdictions' answers in separate objects and separate panes; never merge them.
- Provider keys live only in the API environment.

**Commands**

```bash
npm run dev | build | lint | gen:api        # web
cd api && uvicorn app.main:app --reload     # api (stage 0+)
docker compose up                           # postgres + api
python -m app.ingest run                    # corpus ingest (stage 1)
make eval PROVIDER=anthropic|groq           # eval harness (stage 1)
```

**Code map (existing web)**: routes in `src/routes/`, 3D in `src/three/` (procedural plant generation in `src/three/procedural/`), data in `src/data/` (30 plants joined in `src/data/plants.ts`), store `src/store/useGarden.ts`, shell + palette in `src/components/`. Known bug to fix in stage 0: `src/three/MedicinalGardenScene.tsx:48` references a plaque image path that does not exist (`garden-entry-board.png` is the real file).
