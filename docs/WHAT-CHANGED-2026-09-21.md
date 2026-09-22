# What changed on 2026-09-21 — and where to see it

A session report: what was picked up from [TASKS.md](TASKS.md), what it actually changed, and how
to look at each change yourself. Start at [STATUS.md](STATUS.md) for the state of the whole build;
this file only covers this one batch of work.

**The honest headline: this did not finish the plan.** It finished the tasks that were next in the
tracker (T1.19, T1.20, T1.23 and most of T1.24), plus two bugs those tasks uncovered. Stage 2's 3D
and agentic half and all of stage 3 are untouched — §5 lists exactly what is left.

---

## 1. What was done

| # | Task | Status |
|---|---|---|
| T1.19 | Cited IP profiles: turmeric, neem, ashwagandha, sandalwood | done |
| T1.20 | Cited IP profiles: sarpagandha, guggulu, amla, tulsi | done |
| T1.23 | Golden set part 1 — 60 in-scope items | done (63) |
| T1.24 | Golden set part 2 — materials, abstention, twins | abstention done (20); materials 14 of 15; twins 19 of 25 |
| — | Schedule headings were not parsed, so whole schedules could not be cited | fixed |
| — | Classifier said "verify" for a definition that is in the corpus | fixed |
| T1.27 | *New task raised*: the API still 404s for profiles the web shows as verified | todo |

Nothing legal was asserted without a source. Where the corpus cannot support a field, it stays
`unknown` and the page says "Not yet verified" — that is the designed answer, not a gap in the work.

---

## 2. The eight plant IP profiles

Each profile is a file under [src/data/ipr/plant/](../src/data/ipr/plant/), with the parts every
plant shares in [common.ts](../src/data/ipr/plant/common.ts). Each one names the provisions it
rests on in `@verify` lines, and a script re-reads every one of them out of `corpus/normalised/`.

**Filled from the corpus** (same for all eight unless noted):

- *Patentability* — Patents Act s.3(c), s.3(d), s.3(e), s.3(j), s.3(p); the source-and-origin
  disclosure in s.10(4)(d)(ii)(D); GRATK Treaty Art. 3.1; the PPV&FR Act s.14 variety route.
- *Indian biological resource* — yes, under BD Act s.2(c), with the 2024 Rules' cultivated-plant
  certificate of origin (rule 19) as the route a grower would use.
- *Schedule E(1)* — not listed. Checked by reading the whole list (Ayurvedic, Siddha and Unani).
- *Wildlife / CITES* — checked against both Wild Life (Protection) Act plant schedules.

**Plant-specific findings:**

| Plant | What the corpus actually says |
|---|---|
| Turmeric | The Patent Office manual gives "the antiseptic properties of turmeric for wound healing" as *the* example of traditional knowledge that is not an invention under s.3(p) |
| Neem | Same manual, same paragraph: "the pesticidal and insecticidal properties of neem" |
| Sarpagandha | *Rauvolfia serpentina* is in Schedule IV (CITES Appendix II, annotation #2), so export needs a prior permit under s.49I — except seeds, pollen and finished retail packs |
| Sandalwood | A checked negative: the schedule's SANTALACEAE entry is *Osyris lanceolata*, not *Santalum album*. Export control over Indian sandalwood is DGFT and state law, which is not in the corpus, so it stays `unknown` |
| Guggulu | Recorded in the file, with no field to hold it: rule 161B gives "Guggulu" preparations a five-year shelf life |
| Ashwagandha, amla, tulsi | Nothing in the corpus names them; they carry the shared provisions only |

**Left `unknown` for every plant, because the corpus has no such source yet** (see
[corpus/CHANGELOG.md](../corpus/CHANGELOG.md)): TKDL holdings, GI Register entries, landmark
patents and case law, Ayurvedic Pharmacopoeia monographs, DGFT export policy, and the
normally-traded-commodities notification under BD Act s.40.

---

## 3. Where to see it in the website

Run the web app on its own — none of this needs the API or a database:

```bash
npm install
npm run dev          # http://localhost:5173
```

### 3.1 The IP & Law tab (the main thing to look at)

Open a verified plant and click **IP & Law**, or go straight to the tab with `?tab=iplaw`:

| Plant | URL |
|---|---|
| Turmeric | `/plant/turmeric?tab=iplaw` |
| Neem | `/plant/neem?tab=iplaw` |
| Ashwagandha | `/plant/ashwagandha?tab=iplaw` |
| Chandana (sandalwood) | `/plant/sandalwood?tab=iplaw` |
| Sarpagandha | `/plant/sarpagandha?tab=iplaw` |
| Guggulu | `/plant/guggulu?tab=iplaw` |
| Amla | `/plant/amla?tab=iplaw` |
| Tulsi | `/plant/tulsi?tab=iplaw` |

What is new on those pages:

1. **The banner at the top of the tab** now reads "Checked against the cited sources on
   2026-09-21", on a solid background with a shield icon. Before this, all thirty plants showed
   the dashed "has not been verified against official sources yet" box.
2. **Patentability** carries a real paragraph with source ids after it, in mono type:
   `[in-patents-act-1970, in-mppp-v3, intl-gratk-2024, in-ppvfr-act-2001]`. Those ids are the keys
   in `corpus/manifest.yaml`, and the `/sources` page lists the same ids.
3. **Indian biological resource** reads "Yes — biodiversity rules may apply
   `[in-bd-act-2002, in-bd-rules-2024]`".
4. **Schedule E(1)** reads "Not listed `[in-dc-rules-1945]`".
5. **Wildlife / CITES — a new row**, which no plant had before. On seven plants it reads "Not in
   the Wild Life (Protection) Act's plant schedules"; on **sarpagandha** it reads "Listed —
   Schedule IV, CITES Appendix II, annotation #2 (all parts and derivatives except seeds, pollen
   and finished products packaged for retail trade)", and **Export restricted** flips to
   "Restricted `[in-wlpa-1972]`".
6. Rows with no source still say **"Not yet verified"** in italics — traditional knowledge, GI,
   normally traded commodity, pharmacopoeia monograph. That is deliberate.

**Compare with a plant that was not done**, e.g. `/plant/giloy?tab=iplaw` or
`/plant/brahmi?tab=iplaw`: dashed banner, "Not yet verified" everywhere, no Wildlife row. That
contrast is the clearest way to show the change in a demo.

*Best single page to demo:* **sarpagandha** — it is the only one where the law says something
sharp, and the annotation's exceptions are visible rather than hidden behind a yes/no.

### 3.2 The one-line strip, in two more places

The same profiles feed a one-line strip that now reads "IP & law checked 2026-09-21" instead of
"IP & law: not yet verified":

- **`/garden`** — click a plant in the themed 3D garden; the strip sits in the card under the
  Ayurvedic properties, with an "Ask Sahayak" link.
- **`/medicinal-garden`** — walk up to a plant in the first-person garden; the strip sits under
  the hover board (passive, no link, since the card follows the pointer).

Both only change for the eight plants above, and only if that plant is planted in that scene.

### 3.3 What is *not* visible in the website

Most of this batch is backend and test-harness work with no UI:

| Change | How to see it instead |
|---|---|
| 56 new golden eval items (46 → 102) | `eval/golden/inscope3.jsonl`, `abstain.jsonl`, `multilingual.jsonl` |
| Schedule-heading parser fix | `cd api && python scripts/locators.py in-wlpa-1972 "Schedule I"` |
| Classifier "verify" flag cleared | `api/app/classify/rules.py`, the D&C Act s.3(a) line |
| The two new checks | `npm run check:ipr` and `cd api && python scripts/locators.py --check-golden` |

The `/sahayak` answers and the `/sources` page are unchanged by this batch — the answers will only
move once the corpus is re-chunked and the eval is re-run (§4).

---

## 4. Two things to run before the next eval

1. **Re-chunk.** The parser fix changes three sources, so the database still holds the old chunks:

   ```bash
   cd api && python -m app.ingest run --no-ocr --rechunk
   ```

   Wild Life Act: Schedule I (every scheduled animal) moves out of the `s.66` chunk and becomes
   citable. Drugs and Cosmetics Rules: Schedules C(1), D(III), F(II), F(III), G and H — the
   prescription-drug list — stop hiding inside Schedule FF. FSSAI Ayurveda Aahara gains Schedule E.
   The other 28 sources come out identical, chunk for chunk.

2. **Re-run the eval on the larger set.** The numbers in `docs/model-card.md` and STATUS §2 were
   measured on 46 items and are a baseline, not a current score:

   ```bash
   python eval/run.py --provider groq
   ```

   Expect movement: 31 of the new items are the first to touch the patent manual, the Designs Act,
   the Cosmetics Rules, the NDCT Rules, the Consumer Protection Act, the Wild Life Act, the PCT and
   the EU directive. The run is about twice as long as before, so several keys in `GROQ_API_KEYS`
   matter more than they used to.

---

## 5. What is still left in the plan

Nothing below was started in this batch.

**Stage 1 remainder**

- T1.5: hand-check the ten most-cited sections against the ingested text.
- T1.26: the eval run itself, on the 102-item set, after the re-chunk.
- T1.27: serve the eight profiles from `GET /materials/{kind}/{id}/ipr`. The web shows them; the
  API 404s, because nothing writes the `material_ipr` table.
- T1.24 tail: one more microbe/animal/mineral item, six more multilingual twins.
- Click the web UI through in a browser against a running API. Still never done: this batch was
  checked by build, typecheck, lint and the two new scripts, not by eye.
- The missing corpus sources in `corpus/CHANGELOG.md` — Trade Marks Rules 2017 first. Several
  `unknown` fields in the plant profiles are waiting on these.

**Stage 2** — T2.1–T2.5 (source-material data, microbe and substance generators, the Rasashala
scene), T2.9 (knowledge graph), T2.10 (agentic tool loop), T2.11–T2.12 (Workbench). T2.6, T2.7,
T2.8 and T2.13 were already done.

**Stage 3** — connectors, Bhashini voice, UI i18n, Registry Marg, the presentation tour, the
README and deck refresh. All untouched.

---

## 6. Every file this batch touched

**New**

- `src/data/ipr/plant/{turmeric,neem,ashwagandha,sandalwood,sarpagandha,guggulu,amla,tulsi}.ts` —
  the profiles, each with the provisions it quotes.
- `src/data/ipr/plant/common.ts` — the shared fields and the evidence for them.
- `scripts/check-ipr-cites.mjs` — re-reads all 26 quoted provisions out of the corpus; fails on a
  cite id that is not in the manifest, or a quote that is not in the text.
- `api/scripts/locators.py` — runs the real parser and chunker over `corpus/normalised/` with no
  database, to look up a locator, find which chunk holds a phrase, or check the whole golden set.
- `eval/golden/inscope3.jsonl` — 31 in-scope items.
- `docs/WHAT-CHANGED-2026-09-21.md` — this file.

**Changed**

- `src/components/MaterialIprPanel.tsx` — the Wildlife / CITES row.
- `src/data/ipr/plant/index.ts`, `src/data/ipr/unknown.ts` — registration, and the search links
  shared with unverified profiles.
- `api/app/ingest/structure.py` — schedule headings with a dash, a trailing `.` or `]`, a space
  before a parenthesised part, or no separator at all.
- `api/tests/test_structure_chunk.py` — two tests for that, including "THE SCHEDULES" staying *not*
  a heading.
- `api/app/classify/rules.py` — D&C Act s.3(a) marked verified.
- `eval/golden/abstain.jsonl` (+10), `multilingual.jsonl` (+15), `smoke.txt` (+2).
- `.github/workflows/ci.yml` — both new checks run in CI.
- `package.json` — `npm run check:ipr`.
- `docs/STATUS.md`, `docs/TASKS.md`, `docs/model-card.md`, `corpus/CHANGELOG.md`.

**Checks that passed:** web lint, a forced typecheck, the production build, `npm run check:ipr`
(26 provisions), `--check-golden` (102 items, 52 locators, 27 sources), ruff check and format, and
25 of the 88 API tests — the rest need the API virtualenv, which the machine this ran on does not
have. CI runs all of them.
