# What changed on 2026-09-22 — Stage 2, and where to see it

Second session report, same shape as [WHAT-CHANGED-2026-09-21.md](WHAT-CHANGED-2026-09-21.md):
what was built, how to look at it, and what is still missing. [STATUS.md](STATUS.md) holds the
state of the whole build; [TASKS.md](TASKS.md) has the task-by-task detail.

**Headline: Stage 2 is complete.** The Rasashala, the knowledge graph, the agentic tool loop and
the Workbench all exist and are checked. Every `todo` left in the tracker is Stage 3 or the one
task Stage 1 left behind (T1.27).

---

## 1. The two things that could not be run

They were the first item on the list and neither is possible on this machine:

```bash
python -m app.ingest run --no-ocr --rechunk    # needs Postgres + the raw PDFs
python eval/run.py --provider groq             # needs Postgres + a Groq key
```

There is no `.env`, no `api/.venv` (until this session created one), no Docker, no Postgres and no
`corpus/raw/`. A connection to a database that is not there is the only thing that failed:

| What | State here |
|---|---|
| `.env` with `GROQ_API_KEY` | missing |
| Postgres / Docker | not installed |
| `corpus/raw/` (the source PDFs) | empty — gitignored, 40 MB |

So the re-chunk and the eval are still the first two things to do **on a machine that has them**.
Nothing written since depends on their result, but the eval numbers in `docs/model-card.md` stay a
baseline measured on 46 items until someone runs it.

What was possible instead: a Python 3.12 virtualenv, and the full API test suite — **87 pass, 20
skip for want of a database, and `/health` fails because it correctly reports "degraded" with no
database behind it.**

---

## 2. What was built

### The Rasashala (T2.1–T2.5)

The pharmacy the problem statement's microbial, animal and mineral sources belong in.

- **20 source materials** in [src/data/materials/](../src/data/materials/): 6 microbes, 8
  animal-derived, 6 mineral. Each is described, never prescribed — no preparation method and no
  dose anywhere in the file.
- **Their legal layer**, cited, in [src/data/ipr/material/](../src/data/ipr/material/). The three
  kinds genuinely differ, which is the interesting part:
  - a **micro-organism** is the one living thing Patents Act s.3(j) does not exclude, and the only
    one with a deposit route (s.10(4)(d)(ii), Budapest Art. 3);
  - an **animal** is excluded outright — and coral carries Schedule I Part K *and* CITES Appendix
    III, so its export needs a permit under s.49I(2), while musk deer sit in Schedule I Part A;
  - a **mineral is not a biological resource at all** under BD Act s.2(c), so the biodiversity
    regime does not reach it — but Schedule E(1) names parada and hingula.
- **Two procedural generators**: [microbe.ts](../src/three/procedural/microbe.ts) (coccus chains,
  bacilli with flagella, budding yeast, branching hyphae, spirilla) and
  [substance.ts](../src/three/procedural/substance.ts) (honeycomb, lathe-turned pot, displaced
  rock, parametric conch, pearl, coral, ingot, powder heap). Same bargain as the plants: nothing
  downloaded, everything deterministic from the material's id.
- **Shared scene furniture** in [scenery.tsx](../src/three/scenery.tsx). The garden's ground
  texture moved verbatim, so the walkable garden is pixel-identical; its label board became
  generic; its dedication plaque stayed put, being a photograph of one particular place.

### The knowledge graph (T2.9)

`kg_entity` + `kg_relation`, seeded from [api/app/graph/seed.py](../api/app/graph/seed.py): 9
concepts, the regimes the manifest uses, one entity per source, and **44 edges, each carrying the
provision it rests on**. `tests/test_graph.py` re-reads every one of them out of
`corpus/normalised/`, so an edge can never cite something the corpus does not have.

What it is for: `/ask` now links entities from the question by alias and folds the provisions their
edges cite into the same fusion as dense and lexical search. A question about musk reaches the Wild
Life Act without ever using the word "wildlife".

### The agent (T2.10)

`POST /agent`: a capped tool loop, implemented on both providers behind one neutral contract in
`app/llm/base.py`. Six tools, **all read-only** — corpus search, graph neighbours, the classifier,
the ABS helper, a stored material profile, the registry list. Nothing the model can call writes a
row, files a ticket, spends money or reaches the network; escalation stays something a person does.
One audit row per call, holding the tool name and arguments and never the question.

### The Workbench (T2.11–T2.12)

A basket that persists, and the classifier's minimum questions answered against the API's rule
table — one round trip per answer, so the branch is always the server's and never a stale copy.
Every requirement and posture line prints its source id, its locator, and a **verify** chip where
the corpus has not confirmed it.

---

## 3. Where to see it in the website

```bash
npm install && npm run dev      # http://localhost:5173
```

| Page | What to look for |
|---|---|
| `/` | A **third door**: Rasashala, beside the two gardens. It shows four area motifs instead of botanical plates, because it holds no plants. |
| `/rasashala` | The hall. Four areas — fermentation, culture vault, animal shelf, rasa shelf — each with a sign and a lamp. Hover any object for a card; click it for the full cited panel. The shelf index is on the left. "Walk the hall" locks the pointer; Esc leaves. |
| `/workbench` | The bench. Empty until you add something. |
| `/plant/turmeric?tab=iplaw` | The plant pages gained **Add to workbench** beside Ask Sahayak. |

**The best single thing to demo** is `/rasashala` → click **Parada** (mercury) on the rasa shelf.
Its panel says *Schedule E(1): Listed* with the source id beside it, *Indian biological resource:
No* — because a mineral is not a plant, an animal or a micro-organism under BD Act s.2(c) — and
*Patentability* explains that s.3(c) keeps out a substance occurring in nature while a process is
judged on its own. Then click **Pravala** (coral) for the opposite case: CITES Appendix III, export
restricted.

Then: add Parada to the workbench, open `/workbench`, add a plant from its IP & Law tab, and answer
the classifier's questions. That last step is the only part of the new UI that needs the API
running; with it down the bench still composes and says so.

---

## 4. What is backend-only

| Change | How to see it |
|---|---|
| Knowledge graph | `cd api && python -m app.graph seed`, then `python -m app.graph show concept:micro-organism` |
| `/graph/{kind}:{key}` | `curl localhost:8000/graph/concept:mineral` |
| `/agent` | `POST /agent` with `X-Session-Id` after granting consent; needs a provider key |
| The graph inside `/ask` | ask about musk and watch the Wild Life Act appear in the citations |

A new check runs in CI beside the other two: `npm run check:3d` builds every procedural form and
every real material spec at every detail level — 99 builds, no browser — and fails on empty
geometry, a non-finite vertex or degenerate bounds.

---

## 5. What is still missing

**Seen once, and it needed work.** The Rasashala was opened in a browser and came back with five
faults, all now fixed — see §6. The Workbench still has not been opened, the agent has never spoken
to a real model, and the graph has never been seeded into a real database.

**Still to do**, in the order the tracker has them:

1. The re-chunk and the eval run (§1), on a machine with Postgres and a key.
2. T1.27 — serve the verified profiles from `GET /materials/{kind}/{id}/ipr`; the web shows them
   and the API still 404s.
3. The 3D part-hotspot entry point to the workbench in `PlantViewer` (the panel button exists).
4. Stage 3 in full: connectors, Bhashini voice, UI i18n, Registry Marg, the "Who owns the neem
   tree?" tour, and the README and deck refresh.

---

## 6. First browser pass on the Rasashala — five faults, and what each one was

| What was seen | Cause | Fix |
|---|---|---|
| Microbes floating under the bench | `placements()` put the fermentation shelf on the floor at `y = 0` while its bench top is at `0.92` | Everything stands on the bench now. The microbes sit at plate scale (fit `0.3`) in a glass **culture dish**, and real **vats** went on the floor beside the bench, where the floor space was actually wanted |
| Label boards blank white; text only on hover | `showText={detail === 'high'}`, but `useDetail('garden')` downgrades high→medium and never returns `'high'` | `showText={detail !== 'low'}`. Names print on the plates at medium and high; low still drops them, which is what low is for |
| Several models look like the same object in a different colour | Every `vessel` was one lathe profile, every `rock` one displaced lump, every `powder` one cone | Added `SubstanceVariant`. Ghee is a wide-mouthed **jar** (h 0.61), milk a tall **pot** (0.50), mercury a sealed round-bottomed **flask** (0.43); sulphur and oyster shell are flat **shards** (0.14), musk a closed **nugget** (0.37), loha bhasma a **dish** rather than a second heap. The honeycomb was a solid yellow block and is now open hex tubes on a backing sheet; the conch lies on its side with a flared aperture |
| In walk mode you can walk but not click anything | `WalkControls` built every aim capsule from `y = 0`, so a capsule for an object on a `0.92` bench sat entirely below the crosshair | `baseOf(target)` starts the capsule at the object's own base. Boards are aimed separately, as in the garden — a crosshair on a plate means "read this" |
| Clicking in walk mode still showed nothing | The detail panel renders only when `!walking`, so a click behind a locked pointer opened a panel nobody could see or reach | Opening something now leaves the walk. Clicking a vial is a decision to stop and read it |

Also: the camera started at `z = 17`, outside the hall's south wall at `z = 11.5` — you opened the
page looking at the back of a wall. It now starts inside, at `[0, 3.6, 9.2]` looking down the aisle.
The vats and the vial stand were added to the walk obstacles, because walking through a vat of
fermenting arishta is not a feature.
