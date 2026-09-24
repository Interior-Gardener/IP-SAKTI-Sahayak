# Corpus changelog

Every change to `manifest.yaml` gets a line here: what changed, why, who checked it. Newest first.

## 2026-09-24 (later) — the status lists become readable, row by row

- `layout: rows` on `intl-madrid-parties` and `intl-hague-parties`. Plain PDF extraction reads a
  status list column by column, so a country and its date of accession landed lines apart with two
  other countries in between. `app/ingest/normalise.py` now rebuilds those two files one printed
  row per line, so "India .... – July 8, 2013" is a single line: quotable as a citation, and
  readable by code. Chunk counts unchanged (10 and 7).
- Nothing else in the corpus uses `layout: rows`, and the default is unchanged.

## 2026-09-24 — the Madrid and Hague routes added (36 sources)

- Added the two international routes the problem statement names and the corpus did not have:
  `intl-madrid-protocol` (Madrid Protocol, the route for a trade mark, 28 chunks) and
  `intl-hague-geneva-act` (Geneva Act 1999 of the Hague Agreement, the route for an industrial
  design, 40 chunks). Both are WIPO Lex authentic texts, fetched automatically as HTML because
  WIPO serves the PDFs through signed links.
- Added the two status lists they have to be read with, as registry records:
  `intl-madrid-parties` (10 chunks) and `intl-hague-parties` (7 chunks). Checked on 2026-09-24
  against the downloaded PDFs: India is in the Madrid list, party to the Protocol from
  8 July 2013; India is **not** among the 85 parties in the Hague list, so that route is not open
  on an Indian connection alone. The entitlement rule itself is Geneva Act Art. 3.
- **Parser fix, treaties only.** WIPO Lex puts every cross-reference on its own line, so
  "…the Assembly referred to in / Article 10 / (hereinafter…)" read as a heading: it took the
  locator and the real Article 10 was dropped. A bare `Article N` is now only a heading when the
  line after it is not the continuation of a sentence (`app/ingest/structure.py`, with a test).
  Madrid 20 -> 28 chunks, Articles 1 to 16 in order. The other seven treaties are unchanged,
  chunk for chunk, and so is every Indian source.
- Four golden items added (`eval/golden/inscope4.jsonl`), all verified against the ingested text.
  Retrieval recall@8 across the whole set: 0.952 (63 items) -> **0.955** (67 items), no regressions.
- Known gaps still to fill: Trade Marks Rules 2017; Designs Rules; Copyright Rules; consolidated
  Patents Rules including the 2024 amendment; normally-traded-commodities notification; heavy-metal
  testing notification; Schedule E(1) text check; US FDA botanical guidance and DSHEA; Health Canada
  NHP Regulations; TGA; MHRA THR; WHO herbal guidelines; Ayurvedic Pharmacopoeia index; registry
  records (GI Register, InPASS); case law (turmeric, neem, basmati, Novartis, Divya Pharmacy,
  Dimminaco, IMA v UoI).

## 2026-09-23 — WIPO's list of depositary authorities added (32 sources)

- Added `intl-budapest-ida-list`, WIPO's list of International Depositary Authorities under the
  Budapest Treaty (`doc_type: registry_record`, fetched automatically from wipo.int). It is a
  registry record, not law: it says where a deposit can be made and since when. Registry Marg's
  depositary office cites it. Checked by Kushal on 2026-09-23 against the downloaded PDF: it lists
  MTCC (4 Oct 2002), MCC (9 Apr 2011) and NAIMCC (28 Jul 2020) for India. 4 chunks.
- The first registry record in the corpus. Records change faster than law; re-fetch it
  (`python -m app.ingest run --only intl-budapest-ida-list`) to pick up a new authority.

## 2026-09-21 — schedule headings become citable (re-chunk needed)

- No source changed. The parser missed a schedule heading written with a dash separator, a trailing
  full stop or bracket, or a space before a parenthesised part, so those schedules were swallowed by
  the preceding section and could not be cited. `api/app/ingest/structure.py` now recognises all of
  them (`SCHEDULE - H`, `SCHEDULE — I`, `THE FIRST SCHEDULE.`, `SCHEDULE G]`, `SCHEDULE C (1)`,
  `SCHEDULE-E`), and `THE SCHEDULES` still is not a heading.
- Effect on the three sources it touches, measured with `python api/scripts/locators.py`:
  Wild Life Act 256 -> 255 chunks (the whole Schedule I species list moves out of `s.66` into
  `Schedule I`); Drugs and Cosmetics Rules 553 -> 561 (Schedules C(1), D(III), F(II), F(III), G and
  H — the prescription-drug list — become addressable, instead of hiding inside Schedule FF);
  FSSAI Ayurveda Aahara gains `Schedule E`. The other 28 sources are unchanged, chunk for chunk.
- **Run `python -m app.ingest run --no-ocr --rechunk` before the next eval**, or the database still
  holds the old chunks and the golden item `in-wlpa-musk-49b` cannot hit `Schedule I`.

## 2026-09-17 — all 31 sources ingested

- FSSAI Ayurveda Aahara Regulations switched to automatic download from FSSAI's archive host `stg-old.fssai.gov.in` (the main site serves its web app instead of the PDF).
- EU Directive 2004/24/EC switched from HTML to PDF; EUR-Lex was partly down, so the PDF was taken from the EU Publications Office search (op.europa.eu).
- Manual files saved by Tushar and checked (valid PDF, right title on page 1): Patents (Amendment) Rules 2024 (WIPO Lex, 19 pp), Paris Convention (WIPO Lex, 20 pp), Budapest Treaty (WIPO Lex, 10 pp), Directive 2004/24/EC (6 pp).
- Ingest on GPU: ~3,160 chunks across 31 sources.

## 2026-09-17 — initial manifest (31 sources)

- Added 23 Indian sources (patents, GI, trade marks, designs, copyright, plant varieties, biodiversity, drugs and cosmetics, advertising, food, wildlife, consumer protection, data protection) and 8 international ones (TRIPS, Paris, CBD, Nagoya, GRATK, PCT, Budapest, EU Directive 2004/24/EC).
- India Code moved from indiacode.nic.in to indiacode.gov.in (old links 404). Download links use its DSpace API: `/server/api/core/bitstreams/<uuid>/content`. The central Act was picked by `act_id` starting `AC_CEN_` (state copies share titles).
- Every `fetch: auto` link returned a PDF when checked. `fetch: manual` sources block scripts (WIPO Lex signed links, fssai.gov.in web app, EUR-Lex challenge): download them by hand into `corpus/raw/`.
- Known gaps to fill next: consolidated Patents Rules including the 2024 amendment; Trade Marks Rules 2017; Designs Rules; Copyright Rules; normally-traded-commodities notification; heavy-metal testing notification; Schedule E(1) text check; US FDA botanical guidance and DSHEA; Health Canada NHP Regulations; TGA; MHRA THR; WHO herbal guidelines; Ayurvedic Pharmacopoeia index; registry records (GI Register, InPASS); case law (turmeric, neem, basmati, Novartis, Divya Pharmacy, Dimminaco, IMA v UoI).
