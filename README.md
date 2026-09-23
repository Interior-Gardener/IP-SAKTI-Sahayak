# IP-SAKTI Sahayak, on Vanaspati

<div align="center">

  <p>
    <img src="https://img.shields.io/badge/SIH-PS--45%20IP--SAKTI%20Sahayak-2E7D32?style=for-the-badge" alt="SIH PS-45" />
    <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=000000" alt="React 19" />
    <img src="https://img.shields.io/badge/FastAPI-Postgres%20%2B%20pgvector-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
    <img src="https://img.shields.io/badge/three.js-procedural%203D-000000?style=for-the-badge&logo=threedotjs&logoColor=white" alt="three.js" />
  </p>

  <h3>An IP and regulatory assistant for Ayurveda that cites the law it relies on, inside a 3D garden you can walk.</h3>

</div>

**IP-SAKTI Sahayak** answers questions about patents, geographical indications, trade marks,
biodiversity access, drug licensing and labelling for Ayurvedic products. It answers in eight
Indian languages, by text or by voice, and every answer quotes the provision it rests on.
India and the international regime are always answered in **separate panes, never merged**.

It lives inside **Vanaspati**, a 3D herbal garden. There, every plant, microbe, animal product
and mineral carries its own cited legal layer, and every question can end at the registry
where you file.

| | |
|---|---|
| **30** medicinal plants, grown procedurally from their botany | **20** microbial, animal and mineral sources in the Rasashala |
| **32** official sources in a version-tracked corpus (**3,230** passages) | **8** registries on Registry Marg, each form quoted from its rule |
| **8** answer languages; voice in and out | **7** guided tours, one of them about the law |

> **This is information about the law, not legal advice.** Every answer says so. Where a fact
> has not been checked against a source, the product says `unknown` or "verify" rather than
> guessing.

---

## The rule everything follows

**Nothing from memory.** A legal statement anywhere in this repository (an answer, a plant's
IP profile, a knowledge-graph edge, a registry form, a line of tour narration) points at a
source in [`corpus/manifest.yaml`](corpus/manifest.yaml) and a locator in it (`s.3(p)`,
`Rule 153`, `Art. 3`). Checks re-read it from the corpus text:

| Check | What it holds |
|---|---|
| Answer verifier (every `/ask`) | each quotation is found word for word in the passage it cites, or the answer is withheld |
| `npm run check:ipr` | 46 quoted provisions in plant/material profiles and tours are in the corpus |
| `pytest tests/test_graph.py` | every knowledge-graph edge cites a provision that exists |
| `pytest tests/test_registry.py` | every registry form is named, in those words, by the rule it cites |
| `scripts/locators.py --check-golden` | every provision an eval item expects is in the corpus |

---

## What's in it

### Sahayak, the assistant

- **Ask anywhere**: the drawer in the header, `Ctrl K`, a button on any plant or material, or
  the full page at `/sahayak`.
- **Two jurisdictions, two panes.** Indian law and international treaties (TRIPS, CBD,
  Nagoya, PCT, Budapest, the 2024 WIPO GRATK treaty) are retrieved, answered and verified
  separately.
- **Hybrid retrieval**: dense vectors (bge-m3), full text and exact section lookup, fused and
  reranked. A knowledge graph widens the search: a question about musk reaches the Wild Life
  Act without using the word "wildlife".
- **Checked citations and a confidence score.** An answer below the confidence floor is
  withheld rather than guessed.
- **Where to go next**: the registries the question points at, each with the provision that
  sends you there.
- **Voice**: ask by microphone, hear answers read aloud. Bhashini is the intended provider;
  until its key arrives, speech-to-text falls back to Groq Whisper and speech to the
  browser's own voices.
- **Guardrails, consent and audit**: out-of-scope, medical-advice and unsafe questions are
  refused. Consent is recorded and can be revoked, and there is an audit trail that never
  stores the question text. `DELETE /me` removes everything stored for your session.
- **An agent** (`POST /agent`) works multi-step questions with six read-only tools.

### The worlds

| Route | What it is |
|---|---|
| `/garden` | The walled 3D garden: 30 plants in six beds, each grown at run time from its botanical description. No downloaded models. |
| `/plant/:id` | A plant's full entry, with an **IP & Law** tab: patentability, biodiversity, wildlife, export, drug schedules, prior-art searches, each line with its source. |
| `/rasashala` | The pharmacy: yeasts, lactobacilli, honey, ghee, pearl, coral, musk, mercury, gold and more. Each is drawn in 3D and has its own cited legal layer. |
| `/material/:id` | One material: a 3D turntable and the law at a glance. |
| `/workbench` | Compose a formulation; the classifier asks the minimum questions and returns its category with every requirement cited. |
| `/registry-marg` | The street of registries: the Patent Office, the GI Registry, the NBA, the licensing authority and more. Each form is quoted from its rule. |
| `/explore`, `/atlas` | The compendium (plants and materials), and the whole collection read as data, including which laws reach which material. |
| `/tours/neem-tree` | *Who Owns the Neem Tree?*: s.3(p), TKDL, NBA approval, and the 2024 disclosure treaty. |
| `/sources` | The corpus, and the official databases outside it, each saying honestly whether it has a public API. Most do not. |

The interface itself switches to **Hindi or Tamil** from the header.

---

## How well it works

Measured, not claimed. Details and history are in [`docs/model-card.md`](docs/model-card.md)
and [`docs/STATUS.md`](docs/STATUS.md).

| On the 102-item golden set | Result | Target |
|---|---|---|
| Retrieval recall@8 (63 items with expected provisions, no model calls) | **0.952** | ≥ 0.85 |
| Answer accuracy, judged (first 43 items; the run stopped at the provider's daily limit) | 0.881 | ≥ 0.80 |
| Citation correctness (same 43) | 0.857 | ≥ 0.95, **not met** |
| Abstention on out-of-scope, medical and unsafe questions (same 43) | 0.95 | ≥ 0.95 |

Citation correctness is the known gap: answers are usually right but sometimes quote a
neighbouring provision. The golden set was written in-house, which flatters it.

---

## Running it

**The web app** (the garden, the Rasashala and Registry Marg all work without the API):

```bash
npm install
npm run dev          # http://localhost:5173
```

**The API**, needed for Sahayak, voice, the classifier and the agent:

```bash
cp .env.example .env                  # add GROQ_API_KEY (or GROQ_API_KEYS) at least
docker compose up -d postgres

cd api
uv venv --python 3.12 .venv
uv pip install -e ".[dev,local]"      # local = bge-m3 embeddings + reranker (large download)
# NVIDIA GPU: the default torch is CPU-only; install the CUDA build for a ~5 minute ingest
.venv/Scripts/alembic upgrade head
.venv/Scripts/python -m app.ingest load       # fill Postgres from corpus/normalised/
.venv/Scripts/python -m app.graph seed
.venv/Scripts/python -m app.materials seed
.venv/Scripts/python -m app.registry seed
.venv/Scripts/python -m uvicorn app.main:app --reload   # http://localhost:8000
```

`docker compose up` runs the migrations and all three seeds on start. The first-run details,
including the four corpus PDFs that have to be downloaded by hand, are in
[`docs/STATUS.md`](docs/STATUS.md) §4–5.

**Checks**, the same ones CI runs:

```bash
npm run lint && npm run build
npm run check:ipr        # legal claims in profiles and tours
npm run check:3d         # every procedural form builds
npm run check:export     # the API's copy of the profiles is current
cd api && .venv/Scripts/python -m pytest -q
python ../eval/run.py --only retrieval    # free: no model calls
python ../eval/run.py --provider groq     # the full eval
```

---

## How it is built

```
src/                          the web app (React 19, Vite, three.js via react-three-fiber)
  three/procedural/           plants, microbes and substances generated from data, no assets
  three/*Scene.tsx            garden, Rasashala, workbench, Registry Marg
  data/                       plants, materials, their IP profiles (src/data/ipr), tours, connectors
  components/sahayak/         the assistant: drawer, answer panes, voice, connectors
  i18n/                       interface strings in English, Hindi and Tamil
api/                          FastAPI + SQLAlchemy + Postgres 16 / pgvector
  app/ingest/                 fetch → normalise → parse → chunk → embed, version-tracked
  app/retrieval/              dense + lexical + locator + graph, fused and reranked
  app/ask/ app/generate/      the answer pipeline and its verifier
  app/graph/ app/agent/       knowledge graph, and the tool-using agent
  app/registry/ app/voice/ app/connectors/   where to go next, speech, credentialed sources
corpus/                       manifest.yaml (what may be cited) and the normalised texts
eval/                         golden items and the harness
docs/                         plan, status, architecture, providers, privacy, model card
```

The provider layer puts Groq and Anthropic behind one interface. Provider keys live only in
the API's environment and never reach the browser. More in
[`docs/architecture.md`](docs/architecture.md) and [`docs/providers.md`](docs/providers.md).

---

## Known limits

- **Not legal advice.** The corpus is 32 sources; many rules (the Trade Marks Rules, the
  Patents Rules' forms schedule, FSSAI licensing) are not in it yet, and the product says so
  where it matters.
- **Bhashini is written but not yet connected**: it waits on an approved account. Voice works
  today through the fallbacks.
- **The Lens connector** is built to Lens's published API, but has not yet been called with a
  real token.
- **22 of 30 plants** have honestly-`unknown` IP profiles until someone verifies them.
- The eval's golden set was written by the team; an outside set would be a harder test.
- The India in the Atlas is a schematic drawn to place climatic regions, not survey data.

Built for Smart India Hackathon 2026, problem statement PS-45, on the SIH 2025 Vanaspati garden.
