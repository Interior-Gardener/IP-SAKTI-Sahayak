# Corpus changelog

Every change to `manifest.yaml` gets a line here: what changed, why, who checked it. Newest first.

## 2026-09-17 — initial manifest (31 sources)

- Added 23 Indian sources (patents, GI, trade marks, designs, copyright, plant varieties, biodiversity, drugs and cosmetics, advertising, food, wildlife, consumer protection, data protection) and 8 international ones (TRIPS, Paris, CBD, Nagoya, GRATK, PCT, Budapest, EU Directive 2004/24/EC).
- India Code moved from indiacode.nic.in to indiacode.gov.in (old links 404). Download links use its DSpace API: `/server/api/core/bitstreams/<uuid>/content`. The central Act was picked by `act_id` starting `AC_CEN_` (state copies share titles).
- Every `fetch: auto` link returned a PDF when checked. `fetch: manual` sources block scripts (WIPO Lex signed links, fssai.gov.in web app, EUR-Lex challenge): download them by hand into `corpus/raw/`.
- Known gaps to fill next: consolidated Patents Rules including the 2024 amendment; Trade Marks Rules 2017; Designs Rules; Copyright Rules; normally-traded-commodities notification; heavy-metal testing notification; Schedule E(1) text check; Madrid Protocol; Hague Agreement; US FDA botanical guidance and DSHEA; Health Canada NHP Regulations; TGA; MHRA THR; WHO herbal guidelines; Ayurvedic Pharmacopoeia index; registry records (GI Register, InPASS); case law (turmeric, neem, basmati, Novartis, Divya Pharmacy, Dimminaco, IMA v UoI).
