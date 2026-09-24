# Status and handover — 2026-09-24

Where the build stands, what has actually been tested, what is known to be wrong, and how to
pick it up on another machine. Task-by-task detail is in [TASKS.md](TASKS.md); the corpus
provenance is in [SOURCES.md](SOURCES.md). The latest work, and where to see it in the website,
is in [WHAT-CHANGED-2026-09-23.md](WHAT-CHANGED-2026-09-23.md) (stage 2 closed, stage 3 built);
before that [2026-09-22](WHAT-CHANGED-2026-09-22.md) and [2026-09-21](WHAT-CHANGED-2026-09-21.md).

**Stages:** 0, 1 and 2 are done. Stage 3 is built except for a slide deck (T3.8). Nothing is left
unbuilt in stages 0–2; what is left is measurement (§2) and the gaps in §7.

## 1. What works today

- **Added 2026-09-24**: the two international routes PS-45 names that the corpus was missing —
  the **Madrid Protocol** (a trade mark abroad) and the **Geneva Act 1999 of the Hague Agreement**
  (a design abroad) — each with WIPO's official list of contracting parties beside it, because the
  two answers differ: India is party to the Madrid Protocol from 8 July 2013, and is **not** among
  the 85 parties to the Hague Agreement. Corpus: **36 sources, 3,315 chunks**.

- **Added 2026-09-23 (stage 3)**: voice in and out (`/voice/asr` on Groq Whisper, tested live;
  Bhashini written, waiting on an account); the interface in Hindi and Tamil; eight free official
  databases on `/sources` with an honest API status each, and a consent-gated connector for The Lens
  on the person's own token; **Registry Marg** (`/registry-marg`), eight registries each citing the
  provision that sends you there and quoting the rule that names each form, which `/ask` now also
  returns as "Where to go next"; the tour *Who Owns the Neem Tree?*; a page per Rasashala material
  (`/material/:id`) and the materials in Explore, the Atlas and search. Corpus: **32 sources,
  3,230 chunks** — WIPO's list of depositary authorities is the new one.

- **Corpus**: 31 official sources (23 India, 8 international) → 3,147 chunks in Postgres with
  embeddings. Every link was opened and checked; four PDFs had to be saved by hand (see §5).
- **Retrieval**: pgvector + Postgres full-text + exact section lookup, fused, reranked on GPU,
  hard-filtered by jurisdiction, superseded versions excluded.
- **Answers**: one per jurisdiction, never merged, each citation checked word-for-word against
  the stored text, confidence score, abstention below the floor, standing disclaimer.
- **API**: `/health`, `/ask` (SSE), `/sources`, `/registry`, `/materials/{kind}/{id}/ipr`,
  `/consent`, `/escalate`, `DELETE /me`, `/classify`, `/abs`, and since 2026-09-22
  `GET /graph/{kind}:{key}` and `POST /agent`.
- **Knowledge graph**: `kg_entity` + `kg_relation`, seeded from `api/app/graph/seed.py`
  (9 concepts, the manifest's regimes, one entity per source, 44 edges). Every edge carries the
  provision it rests on, and the tests re-read all of them out of the corpus. `/ask` links
  entities from the question by alias and folds the provisions they cite into the same fusion as
  dense and lexical search.
- **Agent**: `POST /agent` runs a capped tool loop over six read-only tools (corpus search, graph,
  classifier, ABS helper, material profile, registry). Consent-gated like `/ask`, one audit row per
  tool call, `truncated` reported when the cap is what stopped it.
- **Web**: Ask Sahayak drawer everywhere, `/sahayak` (two panes for India vs international),
  `/sources`, an "IP & Law" tab on all 30 plants, an IP line on the garden card and the walkable
  garden board, and a seal hotspot in the 3D plant viewer. The garden still works with the API down.
- **Plant IP profiles**: 8 of 30 plants verified against the corpus (turmeric, neem, ashwagandha,
  sandalwood, sarpagandha, guggulu, amla, tulsi). The other 22 stay honestly 'unknown'. Every
  quoted provision is re-read from `corpus/normalised/` by `npm run check:ipr`, which CI runs.
- **Rasashala** (`/rasashala`, 2026-09-22): a walkable pharmacy holding the 20 non-plant sources —
  6 microbes, 8 animal-derived, 6 mineral — each generated procedurally and each with the same
  cited IP & law panel a plant has. Two of the minerals are named in Schedule E(1); coral and musk
  carry real wildlife schedules. Third door on the Gateway.
- **Workbench** (`/workbench`): a bench of chosen materials, and the classifier's minimum questions
  answered against the API's rule table, with every requirement and posture line carrying its
  source id and locator.
- **Tests**: 108 (`cd api && .venv/Scripts/python -m pytest -q`) — 87 pass without a database, 20
  need Postgres and skip without it, and `/health` reports "degraded" (so its test fails) on a
  machine with no database. CI runs web lint+build and API ruff+pytest with Postgres, seeds the
  graph, and runs three cheap correctness gates that need no database or keys:
  `npm run check:ipr` (every legal claim in the material profiles),
  `npm run check:3d` (every procedural form and every material spec builds), and
  `python api/scripts/locators.py --check-golden` (every locator a golden eval item expects).

## 2. Measured quality (eval)

**2026-09-23, on the 102-item set** (first run since it grew from 46; this machine, Groq
`openai/gpt-oss-120b`, one key):

| Metric | Result | Target | |
|---|---|---|---|
| Retrieval recall@8, all 67 items with expected provisions, no model calls | **0.955** | ≥ 0.85 | met |
| Judge accuracy (first 43 items) | 0.881 | ≥ 0.80 | met |
| Citation correctness (first 43) | 0.857 | ≥ 0.95 | **not met** |
| Abstention on out-of-scope / medical / unsafe (first 43) | 0.95 | ≥ 0.95 | met, just |
| False abstention (first 43) | 0.045 | ≤ 0.10 | met |
| Multilingual agreement | not reached | ≥ 0.85 | — |

The full run stopped at item 44 on Groq's daily limit (one key). Resume it with
`python eval/run.py --provider groq --tag full --resume eval/runs/2026-09-23-groq-full-partial.json`
once the limit resets. Retrieval rose from 0.857 to 0.952 today: the eval now gives `search` the
same graph entities `/ask` does, and a graph hit may take one of two reserved slots where the
reranker is unsure (WHAT-CHANGED-2026-09-23.md §4). What failed and matters:
`unsafe-gi-passing-off` ("label ordinary turmeric as a registered GI") was not refused by the guard,
and `both-plants-patent` was withheld in both panes because the model's quotes did not match.


**2026-09-24 — the four new Madrid/Hague items, answered end to end** (`eval/runs/2026-09-24-groq-madrid-hague-answers.json`):
retrieval 1.0, citation 1.0, false abstention 0, judge accuracy 0.625 (2 of 4 full marks, one
half for an omitted sub-rule, one zero). Retrieval across the whole set went 0.952 (63 items) to
**0.955** (67), with no regressions: `eval/runs/2026-09-24-groq-madrid-hague-retrieval.json`.

The zero is worth keeping rather than tuning away. Asked whether an Indian applicant can use the
Hague route, the assistant said it could not confirm membership instead of answering. It is right
that it did not guess, and the list that settles it *is* in the corpus — but **a fact that exists
only as a missing row cannot be retrieved by similarity**: there is nothing in the party list for
"India" to match on. The graded provision for that item is therefore Geneva Act Art. 3 (who is
entitled to file), with the party list checked by hand, and the graph carries a cited edge saying
India is not listed. Making a curated edge note visible to the answer model would close it, and
that is a prompt-authority change that needs its own measurement.

The tables below are the earlier 46-item runs, kept for comparison.

> **The golden set grew from 46 to 102 items on 2026-09-21 and has not been run yet.** The numbers
> below are the last measured ones, on the 46-item set. Treat them as the baseline to beat, not as
> the current score; the new items cover eight sources that were never tested.

Latest: **`eval/runs/2026-09-19-groq-hint-and-size.json` — all 46 items** (Groq
`openai/gpt-oss-120b`, judge the same model). Full runs are possible because `GROQ_API_KEYS` holds
several keys and the provider switches when one hits its daily limit.

| Metric | 09-19 hint-and-size | 09-19 tables | 09-18 after-window | Target | |
|---|---|---|---|---|---|
| Retrieval recall@8 | 1.00 | 1.00 | 1.00 | ≥ 0.85 | met |
| Abstention on out-of-scope / medical / unsafe | 1.00 | 1.00 | 1.00 | ≥ 0.95 | met |
| False abstention | 0.083 | 0.107 | 0.028 | ≤ 0.10 | met |
| Multilingual agreement | 0.75 | — | 1.00 | ≥ 0.85 | **not met** |
| Judge accuracy | 0.909 | 0.86 | 0.843 | ≥ 0.80 | met |
| Citation correctness | 0.848 | 0.88 | 0.886 | ≥ 0.95 | **not met** |

Retrieval-only (no model calls, all 29 English items): recall@8 = 1.00.

What moved the numbers, in order: quote matching that tolerates the model's dash and ellipsis
habits; a retry when it uses its own `【1†source】` style; showing all 8 retrieved passages instead
of 6 (sections ranked 7th–8th were being cut); prompt rules on primary law, on not claiming
"insufficient sources" when a document does answer, and on not shortening non-English answers.

**2026-09-19, in order of what it cost us**

- *Tables*: a table is now written out again below the page text as one labelled line per row
  ("Category: (A) Classical formulation | Safety study: Not Required | ..."), so a row can be
  quoted. Rule 158B, the one wrong legal statement in the 09-18 run, is answered correctly now.
  An earlier version of this replaced the page text instead of adding to it and deleted real law
  (the Wildlife Act lost 11,253 lines). Only ruled tables are touched, and nothing is removed.
- *My own test item was wrong*: the expected answer for `in-dc-158b-classical-evidence` was
  written from the same flattened table the assistant misread. Read by cell position the rule
  says: safety study Not Required, published literature Required, proof of effectiveness Not
  Required. The golden item is corrected and records that the earlier expectation was wrong.
  Check every new golden item against the ingested text before trusting it.
- *Oversized requests*: one question (patent fees) got no answer at all — the prompt exceeded
  Groq's per-request limit. A rejected request is now retried with 4 documents instead of 8.
- *Trimming was breaking quotes*: long passages were cut mid-sentence; the model finished the
  sentence itself, quoted the join, and the quote matched nothing in the stored text, so whole
  answers were withheld (Rule 158B, FSS s.22, GI rule 31). Trimming now cuts on a line break,
  marks the gap, and the provision the question names is trimmed last. The run measuring this
  (`-linecut`) ran out of quota at 30 items; in that partial, all three answer instead of being
  withheld. Re-run it when quota is back.
- *Still missed*: citation correctness. The answers are right (accuracy 0.909) but rest on a
  neighbouring provision — Trade Marks s.36/s.13 where s.9 is the point. A hint naming the two
  best-ranked passages did not fix it.

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

**How to read these numbers (agreed with Tushar, 2026-09-18)**

They are honest but early. Fine-tuning comes after the product is complete; for now the eval is a
regression net, not a score to quote.

- *The tests are practical*: every item runs the whole pipeline as the website does — real question,
  real search over the 3,147 ingested chunks, real model answer, real citation checking. Nothing is
  stubbed, so a pass means the product did it.
- *Small set*: 46 items (plan: ~120). One bad answer moves a metric by ~3 points.
- *Written in-house*: the questions were written alongside the system, which flatters it. Questions
  from teammates or real users would be a harder test.
- *Self-graded accuracy*: the judge is the same model family that writes the answers. Hand-check a
  sample each run and record the agreement rate in `docs/model-card.md`.
- *The failure that matters most*: a confident, well-cited, wrong statement (Rule 158B's table).
  Citation misses are cosmetic next to that.

Before the submission: grow the golden set, get someone else to write a batch of questions,
hand-check a sample of judged answers, and re-tune only then.

## 3. Live checks actually performed

- Full ingest on GPU (~4 min for 3,147 chunks) and a re-chunk pass after parser fixes.
- End-to-end over HTTP through uvicorn: `/health`; `/ask` refused with 403 without consent;
  after consent, a streamed answer (status → answer → done) in ~29 s citing Rules 157, 158 and
  158B with 5 of 5 citations verified, high confidence, disclaimer present.
- Live provider calls: English, Hindi (Hindi answer with untranslated English quote), Marathi,
  Tamil; out-of-scope and dosing questions refused.
- Docker: `docker compose up` → Postgres + API, `/health` 200, Alembic migrations on start.
- **2026-09-23, on a machine with Docker, an RTX 3050 and a Groq key**:
  - Postgres in Docker, all five migrations, `ingest load` of all 32 sources (3,230 chunks,
    GPU), graph seed (57 entities, 55 edges), 28 material profiles, 8 registries.
  - API tests: **125 passed, 0 skipped**, the embedding, reranker and graph-expansion tests
    included.
  - The agent against Groq, live: it found two bugs, both fixed (WHAT-CHANGED-2026-09-23.md §4).
  - Voice, live: a spoken question transcribed by Groq Whisper, then the whole mic round trip in
    headless Edge with a WAV as the microphone.
  - Screenshots, desktop and phone width, of `/rasashala`, `/material/*`, `/explore`, `/atlas`,
    `/registry-marg`, `/sources`, `/tours/neem-tree`, and the interface in Hindi.
- **Still not done**: Bhashini (no account); The Lens with a real token; the Workbench's
  classifier clicked through against the running API; an `/ask` answer checked by hand for its
  "Where to go next" panel.
- **Checked without a database**: the procedural generators build every form and every material
  spec at every detail level (`npm run check:3d`, 99 builds); the graph seed's edges all cite
  provisions that are in the corpus; every registry form's quote is in the rule it cites.

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

1. **Finish the eval run** (§2): resume it when the Groq limit resets, ideally with several keys
   in `GROQ_API_KEYS`. Then look at the two failures that matter: the GI passing-off question the
   guard let through, and the plants-patent question withheld for quote mismatches.
2. Split Patents Act s.3 by clause in the chunker: it is one 2,700-character chunk holding (a) to
   (p), and two of the three remaining retrieval misses are questions about one clause. Measure
   before and after with `python eval/run.py --only retrieval`.
3. Connect Bhashini when the account is approved (`BHASHINI_USER_ID`, `BHASHINI_API_KEY`); then
   call it once for each language and record the result. Try The Lens connector with a real token.
4. Finish the golden set: one more microbe/animal/mineral item and six more multilingual twins
   (19 of the planned 25). Check every new item with
   `python api/scripts/locators.py --check-golden` before trusting it.
5. Add the missing sources listed in `corpus/CHANGELOG.md` (Madrid and Hague landed 2026-09-24;
   Trade Marks Rules 2017 next: answers
   already want to cite it), then re-run ingest. The plant profiles are waiting on several of them —
   GI register entries, patent records, the Ayurvedic Pharmacopoeia index, DGFT export policy.
6. The other "verify" flags in `api/app/classify/rules.py` (Cosmetics Rules detail, the Rule 158B
   evidence requirements, the NDCT approval data). The D&C Act `s.3(a)` one was cleared on
   2026-09-21; the rest each need a reading of the provision, not just a locator check. Note the
   Rule 158B table is the place a wrong answer came from once — read it by cell, not by line.
7. A slide deck for the submission (T3.8): none exists in the repo. The in-app presentation
   reel (press `P`) is up to date and walks every part of the product.

## 8. Rules that must not be broken

- Never state a legal point without a citation into the corpus, in code, data, docs or answers.
  `unknown` and "verify" are first-class values.
- India and international answers stay separate objects and separate panes.
- The garden keeps working with the API down.
- Provider keys only in the API environment.
- Corpus changes go through `corpus/manifest.yaml` + `CHANGELOG.md`, never by editing the database.
