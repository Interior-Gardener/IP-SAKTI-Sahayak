# What changed on 2026-09-23 — Stage 2 closed out, and where to see it

Third session report, same shape as the last two
([2026-09-22](WHAT-CHANGED-2026-09-22.md), [2026-09-21](WHAT-CHANGED-2026-09-21.md)): what was
built, how to look at it, what was run for real, and what is still missing.

**Headline:** every Stage 2 task is done, including the two tails the last report left open (the
3D part-hotspot workbench entry, and T1.27 — the API now serves the verified profiles). The
Rasashala's models were reworked, and its twenty materials now appear everywhere the plants do.
This machine now has Docker and a Groq key, so the database, the graph and the agent were run for
real. The first live agent run found two bugs, both fixed. The corpus is ingested (3,226 chunks),
and retrieval recall@8 on the new 102-item set went from 0.857 to 0.952 (§4).

---

## 1. The Rasashala's 3D, reworked

What was there looked like grey solids on a bench. What changed:

| Where | Before | Now |
|---|---|---|
| Surfaces | one plain material per object | `src/three/materialLook.ts`: physical materials per form — nacre **iridescence** on pearls, glaze **clearcoat** on pots, wax **sheen** on the comb, flat-shaded facets on shards, gold leaf brighter than the bar |
| Honeycomb | open cells, empty | honey standing in the open cells at uneven levels, wax caps that bulge, honey pooled on the bench |
| Parada (kupi) | a grey flask | a **glass** kupi you can see into, with a bead of **mercury** in the bottom and the clay seal at the neck |
| Mukta | one white ball with a band | several pearls, one larger, on a cloth cushion |
| Swarna | an ingot | the ingot **and** a loose stack of beaten leaf beside it — the form the pharmacy actually uses |
| Microbes | a colony on a flat disc | a **Petri dish** — glass wall, agar, and colonies grown round the magnified cells in the organism's own colour |
| Size on the bench | 0.42 m / 0.3 m | 0.56 m / 0.44 m, so a pot of ghee is not a speck next to the wall jars |
| The hall | four benches in a box | stocked **wall shelving** (instanced jars, two draw calls however many), a brick **bhatti** with a flickering fire and flue, a **khalva** mortar mid-grind, **windows** lit by the sky colour, a **runner** down the aisle, and an **environment light** so metal and glass have something to reflect |

The geometry now has a third part, `liquid`, beside `body` and `accent`, because honey and mercury
need a wet material neither of the other two can carry. `npm run check:3d` checks it like the others.

## 2. The materials, everywhere the plants are

| Page | What to look for |
|---|---|
| `/material/parada` (and every other id) | **New page per material**: a 3D turntable of the model (orbit, zoom, spin, the IP & law seal), names in each language, the classical use, "the law at a glance" — one line per verified flag with its source id — the full cited IP & law tab, and what else stands on the same shelf. Buttons: **Add to workbench**, **See it in the Rasashala** (opens the hall with its panel up), Share, Listen. |
| `/explore` | A switch at the top: **Everything · Plants · Rasashala**. Material cards show a still of the actual 3D model, the kind, and the legal flags. Material filters: kind, Rasashala area, and "the law" (Schedule E(1), wildlife schedule, CITES, export restricted, deposit route, biological resource or not). Search finds "honey", "mercury", "CITES"… |
| `/atlas` | A new panel, **The Rasashala, and the law that reaches it**: the four areas with their materials, counts per kind, and a matrix of which laws reach which material. Every dot is a verified provision; hover it for the source id. A blank is "not recorded", and the page says so. |
| Search palette (`Ctrl K`) | Materials come up beside plants; the Rasashala, the materials view and the Workbench are pages you can jump to. |
| `/rasashala` | Each material's panel links to its full page. `?open=<id>` opens a material on arrival. |
| `/workbench` | Every item on the bench links to its plant or material page. |
| `/plant/turmeric` | Open a part label on the 3D specimen (e.g. *Rhizome*) → a **Workbench** button puts that plant on the bench with that part filled in. |

Card pictures are rendered once per session by one hidden renderer
(`src/three/materialThumbs.ts`) from the same geometry and surfaces the scenes use — twenty live
canvases would be twenty WebGL contexts, and browsers stop at sixteen. Without WebGL the cards fall
back to a mark and nothing breaks.

**Legal flags are only raised where the verified profile says `true` or `false` with a citation.**
An `'unknown'` raises nothing. The flag text was checked against the corpus. For example, Schedule
E(1) is described in the words of the Rules: "List of poisonous substances under the Ayurvedic
(including Siddha) and Unani…" (`in-dc-rules-1945`).

## 3. T1.27 — the API serves the verified profiles

`npm run export:ipr` writes every verified profile from `src/data/ipr/` (8 plants, 6 microbes,
8 animal, 6 mineral = 28) to `api/app/materials/profiles.json`. `python -m app.materials seed`
validates each against the `MaterialIPProfile` contract and loads it into `material_ipr`. It runs
on container start, and in CI next to the graph seed. `npm run check:export` fails CI if the JSON
falls behind the TypeScript. `/materials/plant/neem/ipr` → 200; an unverified plant (brahmi) → 404;
the agent's `lookup_material_ipr` tool reads the same table.

```bash
curl localhost:8000/materials/mineral/parada/ipr
```

## 4. What was run for real

Docker and the Groq key made most of Stage 2's "never run" list runnable. Done on this machine:

| What | Result |
|---|---|
| `docker compose up -d postgres` + `alembic upgrade head` | all four migrations applied, including the knowledge-graph tables |
| `python -m app.graph seed` | **57 entities, 55 edges** written to a real database (44 cited legal edges plus structural ones) |
| `python -m app.materials seed` | 28 profiles; `/materials/plant/neem/ipr` → 200 |
| API test suite against the live database | **107 passed, 1 skipped** (the skip needs ingested chunks). Before this machine had Postgres it was 87 passed and 20 skipped |
| `/agent` against Groq `openai/gpt-oss-120b` | **ran live for the first time, and failed. Two real bugs found and fixed:** below |

**What the first live agent run found.** The mocked tests could not have caught either problem.

1. *The capped loop crashed instead of answering.* At the iteration cap, the loop asked for a final
   answer by replaying the tool transcript without declaring any tools. Groq refuses that request
   the moment the model reaches for a tool again ("Tool choice is none, but model called a tool").
   Anthropic refuses tool blocks in a request that declares no tools, so the same flaw was there
   too. Now both providers wrap up with a plain request that carries the tool results as research
   notes. If gpt-oss still answers with a tool call, it gets one retry, and after that the caller
   gets an honest "could not finish" instead of a stack trace. Two regression tests cover this.
2. *The model repeated one search until the cap and never used the tools that held the answer.*
   It asked about "red coral" and never tried `lookup_material_ipr`, because nothing told it the
   coral's id is `pravala`. Now the tool's description lists every material with a stored profile,
   read from the same file the table is seeded from. An identical repeated call gets a nudge
   instead of a rerun. On the next live run the model switched to `lookup_material_ipr` for
   pravala and swarna after two searches.

**The ingest.** The GPU build of PyTorch (`2.14.0+cu126`, RTX 3050) and both models are installed.
The database was filled with a new command:

```bash
cd api && .venv/Scripts/python -m app.ingest load
```

`ingest load` skips fetch and normalise and ingests `corpus/normalised/` exactly as committed. That
is the text every quote check and golden item was verified against. It is how a fresh database gets
filled on a machine without the raw PDFs, including the four sources that can only be downloaded by
hand. The version is keyed by the raw file's hash when the raw file is present, and by the hash of
the text when it is not. `--rechunk` works as it does with `run`.

Result: **31 sources, 3,226 chunks** (3,147 before the schedule-heading fix), one current version
each, all embedded with bge-m3. The run was interrupted halfway once and resumed cleanly: the
finished sources reported `unchanged`, the rest were added, and there are no duplicates.

With chunks in the database, the whole API suite runs for the first time on this machine:
**115 passed, 0 skipped**, including the embedding, reranker and graph-expansion tests.

**Retrieval on the new 102-item golden set.** No model calls; 63 items have expected provisions.

| Run | recall@8 | Misses |
|---|---|---|
| As measured before today (search only) | **0.857** | 9 |
| Eval scores the search `/ask` actually runs (graph entities included) | 0.889 | 7 |
| + graph hits may claim up to 2 of the top 8 | 0.937 | 4 (1 new) |
| + only where the reranker is unsure of what they displace | **0.952** | 3 |

Target ≥ 0.85. It was 1.00 on the old 29 items; the new items test eight sources that had never been
tested before.

Two changes, each with a reason from the data:

1. **The eval measured a search the product never runs.** `/ask` passes the knowledge-graph
   entities linked from the question into `search`; the eval called `search` without them. It now
   passes the same inputs.
2. **The reranker was undoing the graph.** For "can I use musk from a musk deer", the graph
   correctly surfaces Wild Life Act s.49B, but the cross-encoder scored it at 0.002 and ranked
   D&C Rules sections above it. A graph edge is a curated, cited legal link, so up to two graph hits
   may now take a place in the top 8 (`reserve_graph_slots` in `app/retrieval/hybrid.py`). The
   first version of that cost one item: "patent or proprietary medicine" is a D&C term that links
   the patent regime, and it pulled Patents Act chunks over confident D&C results. A correct graph
   hit scores no better than a wrong one (0.002 against 0.004), so no absolute floor separates them.
   The rule that does: a graph hit may displace a result only when it scores at least a tenth of
   that result. When the reranker is sure (0.947) the graph steps aside; when it is guessing (0.009)
   the graph gets in. It never displaces a provision the user named. Three unit tests pin all three
   cases.

Still missed: `in-pat-admixture-3e`, `intl-pct-filing-11`, `both-tk-disclosure`. Patents Act s.3 is
one 2,700-character chunk holding clauses (a) to (p), so a question about one clause matches a
passage mostly about the others. Splitting s.3 by clause is the next retrieval fix. It is a chunker
change, so it needs its own before-and-after measurement.

<!-- FULL-EVAL -->

## 5. What is still missing

- **Stage 3**, in full: connectors, Bhashini voice, UI i18n, Registry Marg, the "Who owns the
  neem tree?" tour, the README and deck refresh. Not started — stages start when you say go.
- T1.24's tail: one more microbe/animal/mineral golden item and six more multilingual twins.
- 22 of 30 plants still have honestly-`'unknown'` IP profiles.
