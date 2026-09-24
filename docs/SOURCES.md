# Sources register

Generated 2026-09-24 by `api/scripts/sources_register.py` from `corpus/manifest.yaml`, the files on disk and the database. **Do not edit by hand; rerun the script after ingest.**

**Ingested: 36 of 36 sources, 3315 chunks.**

Where the data lives, for every source:

- **Official page** (`url`): what a person should open and what citations link to.
- **Downloaded from** (`fetch_url`): the exact file ingest fetched, or how it was saved by hand.
- **Raw file**: `corpus/raw/<id>.<format>` (not in git; the sha256 below identifies the exact copy).
- **Text**: `corpus/normalised/<id>.txt` (in git), page breaks marked `<<page N>>`.
- **Database**: table `sources` (row `id`), `source_versions` (row below, matched by sha256), `chunks` (one row per section/rule/article piece, with its embedding).

A raw file whose sha256 differs from the database has changed since ingest: rerun `python -m app.ingest run --only <id>`.

## India

### The Patents Act, 1970

| | |
|---|---|
| Id | `in-patents-act-1970` |
| Status | ingested |
| Issuer | Legislative Department, Government of India (India Code) |
| Type / regimes | statute / patent |
| Official page | <https://indiacode.gov.in/items/a49ad42b-f2dc-4ee2-9884-11ef0839798d> |
| Obtained | Automatic download by ingest from <https://indiacode.gov.in/server/api/core/bitstreams/9e02bd6e-8946-4131-9eec-b1a0dd71cf80/content> |
| Version | India Code consolidated text |
| Licence | Official Government of India publication |
| Raw file | `corpus/raw/in-patents-act-1970.pdf`, 698 KB, sha256 `583f2461d7957269…` |
| Text | `corpus/normalised/in-patents-act-1970.txt`, 72 pages |
| Database | source_versions.id = 9, retrieved 2026-09-17 14:50, 172 chunks |

### The Patents Rules, 2003

| | |
|---|---|
| Id | `in-patents-rules-2003` |
| Status | ingested |
| Issuer | Legislative Department, Government of India (India Code) |
| Type / regimes | rules / patent |
| Official page | <https://indiacode.gov.in/items/06d5b3ec-938f-4b0e-ac5a-b52d962d8b24> |
| Obtained | Automatic download by ingest from <https://indiacode.gov.in/server/api/core/bitstreams/335e0cd0-019b-4505-b4c0-904a9d42bfb7/content> |
| Version | Updated till 23 June 2017 (per file name) (issued 2003-05-02) |
| Licence | Official Government of India publication |
| Raw file | `corpus/raw/in-patents-rules-2003.pdf`, 3546 KB, sha256 `c283a729302f8efc…` |
| Text | `corpus/normalised/in-patents-rules-2003.txt`, 102 pages |
| Database | source_versions.id = 25, retrieved 2026-09-17 14:55, 144 chunks |
| Notes | Does not include the Patents (Amendment) Rules, 2024; read with in-patents-amendment-rules-2024. Replace with a consolidated text when one is found. |

### The Patents (Amendment) Rules, 2024

| | |
|---|---|
| Id | `in-patents-amendment-rules-2024` |
| Status | ingested |
| Issuer | Ministry of Commerce and Industry (via WIPO Lex) |
| Type / regimes | notification / patent |
| Official page | <https://www.wipo.int/wipolex/en/legislation/details/23105> |
| Obtained | Downloaded by Tushar on 2026-09-17 from the WIPO Lex details page (English PDF, file `in195en…`), renamed. |
| Version | As notified (issued 2024-03-15) |
| Licence | Official Government of India publication |
| Raw file | `corpus/raw/in-patents-amendment-rules-2024.pdf`, 827 KB, sha256 `44ab185f13fe7582…` |
| Text | `corpus/normalised/in-patents-amendment-rules-2024.txt`, 19 pages |
| Database | source_versions.id = 271, retrieved 2026-09-17 16:00, 63 chunks |
| Notes | WIPO Lex serves the PDF through signed links; download it from the details page. It amends the Patents Rules, 2003 paragraph by paragraph, so locators are this notification's paragraph numbers ("para 2"), not rule numbers. |

### Manual of Patent Office Practice and Procedure, Version 3.0

| | |
|---|---|
| Id | `in-mppp-v3` |
| Status | ingested |
| Issuer | Office of the Controller General of Patents, Designs and Trade Marks |
| Type / regimes | manual / patent |
| Official page | <https://ipindia.gov.in/frontend/pdf/patents/Manual_for_Patent_Office_Practice_and_Procedure_.pdf> |
| Obtained | Automatic download by ingest from <https://ipindia.gov.in/frontend/pdf/patents/Manual_for_Patent_Office_Practice_and_Procedure_.pdf> |
| Version | Version 3.0 |
| Licence | Official Government of India publication |
| Raw file | `corpus/raw/in-mppp-v3.pdf`, 1619 KB, sha256 `73d52f8b8073d3d0…` |
| Text | `corpus/normalised/in-mppp-v3.txt`, 174 pages |
| Database | source_versions.id = 48, retrieved 2026-09-17 14:57, 180 chunks |

### The Geographical Indications of Goods (Registration and Protection) Act, 1999

| | |
|---|---|
| Id | `in-gi-act-1999` |
| Status | ingested |
| Issuer | Legislative Department, Government of India (India Code) |
| Type / regimes | statute / gi |
| Official page | <https://indiacode.gov.in/items/1905d861-7dcd-46d6-a03b-4fe6009dea5b> |
| Obtained | Automatic download by ingest from <https://indiacode.gov.in/server/api/core/bitstreams/55740471-35c8-4016-a122-c20c019b91ab/content> |
| Version | India Code consolidated text |
| Licence | Official Government of India publication |
| Raw file | `corpus/raw/in-gi-act-1999.pdf`, 417 KB, sha256 `f627842df535a20b…` |
| Text | `corpus/normalised/in-gi-act-1999.txt`, 31 pages |
| Database | source_versions.id = 126, retrieved 2026-09-17 15:00, 90 chunks |

### The Geographical Indications of Goods (Registration and Protection) Rules, 2002

| | |
|---|---|
| Id | `in-gi-rules-2002` |
| Status | ingested |
| Issuer | Legislative Department, Government of India (India Code) |
| Type / regimes | rules / gi |
| Official page | <https://indiacode.gov.in/items/41f0dba0-3d94-4a53-bdd3-1bfc1c2efce9> |
| Obtained | Automatic download by ingest from <https://indiacode.gov.in/server/api/core/bitstreams/aed1ea9d-2bb4-4e37-943f-f9a7503cae9d/content> |
| Version | India Code text (issued 2002-03-08) |
| Licence | Official Government of India publication |
| Raw file | `corpus/raw/in-gi-rules-2002.pdf`, 253 KB, sha256 `80124898dd2193f5…` |
| Text | `corpus/normalised/in-gi-rules-2002.txt`, 71 pages |
| Database | source_versions.id = 138, retrieved 2026-09-17 15:01, 133 chunks |

### The Trade Marks Act, 1999

| | |
|---|---|
| Id | `in-trade-marks-act-1999` |
| Status | ingested |
| Issuer | Legislative Department, Government of India (India Code) |
| Type / regimes | statute / trademark |
| Official page | <https://indiacode.gov.in/items/62219d21-0553-405b-9ccb-a11b4d9c41c2> |
| Obtained | Automatic download by ingest from <https://indiacode.gov.in/server/api/core/bitstreams/7648d2d2-4e14-40dc-80d0-db8f99716fd5/content> |
| Version | India Code consolidated text |
| Licence | Official Government of India publication |
| Raw file | `corpus/raw/in-trade-marks-act-1999.pdf`, 765 KB, sha256 `3ee682af4ec4701a…` |
| Text | `corpus/normalised/in-trade-marks-act-1999.txt`, 56 pages |
| Database | source_versions.id = 139, retrieved 2026-09-17 15:03, 167 chunks |
| Notes | The Trade Marks Rules, 2017 are still to be added. |

### The Designs Act, 2000

| | |
|---|---|
| Id | `in-designs-act-2000` |
| Status | ingested |
| Issuer | Legislative Department, Government of India (India Code) |
| Type / regimes | statute / design |
| Official page | <https://indiacode.gov.in/items/cd8f2852-7085-432b-a264-7b73a6f01fff> |
| Obtained | Automatic download by ingest from <https://indiacode.gov.in/server/api/core/bitstreams/94cc7bf7-96c1-4dbe-b3b3-9b3287296573/content> |
| Version | India Code consolidated text |
| Licence | Official Government of India publication |
| Raw file | `corpus/raw/in-designs-act-2000.pdf`, 404 KB, sha256 `25d76416d93f1c4b…` |
| Text | `corpus/normalised/in-designs-act-2000.txt`, 18 pages |
| Database | source_versions.id = 140, retrieved 2026-09-17 15:06, 50 chunks |

### The Copyright Act, 1957

| | |
|---|---|
| Id | `in-copyright-act-1957` |
| Status | ingested |
| Issuer | Legislative Department, Government of India (India Code) |
| Type / regimes | statute / copyright |
| Official page | <https://indiacode.gov.in/items/6b893162-631a-453b-a7b9-89685716889b> |
| Obtained | Automatic download by ingest from <https://indiacode.gov.in/server/api/core/bitstreams/696240f0-b1ef-42f3-972d-9d03b1a6066f/content> |
| Version | India Code consolidated text |
| Licence | Official Government of India publication |
| Raw file | `corpus/raw/in-copyright-act-1957.pdf`, 600 KB, sha256 `fc1e8ab7dee763fc…` |
| Text | `corpus/normalised/in-copyright-act-1957.txt`, 50 pages |
| Database | source_versions.id = 152, retrieved 2026-09-17 15:07, 117 chunks |

### The Protection of Plant Varieties and Farmers' Rights Act, 2001

| | |
|---|---|
| Id | `in-ppvfr-act-2001` |
| Status | ingested |
| Issuer | Legislative Department, Government of India (India Code) |
| Type / regimes | statute / pvp |
| Official page | <https://indiacode.gov.in/items/66408705-b196-477f-9229-dc633f393a23> |
| Obtained | Automatic download by ingest from <https://indiacode.gov.in/server/api/core/bitstreams/e04ea3dd-cccf-4562-82ee-d661b9af0c8e/content> |
| Version | India Code consolidated text |
| Licence | Official Government of India publication |
| Raw file | `corpus/raw/in-ppvfr-act-2001.pdf`, 642 KB, sha256 `e6aa5f91db111a13…` |
| Text | `corpus/normalised/in-ppvfr-act-2001.txt`, 38 pages |
| Database | source_versions.id = 153, retrieved 2026-09-17 15:09, 102 chunks |

### The Biological Diversity Act, 2002

| | |
|---|---|
| Id | `in-bd-act-2002` |
| Status | ingested |
| Issuer | Legislative Department, Government of India (India Code) |
| Type / regimes | statute / abs |
| Official page | <https://indiacode.gov.in/items/000de0a3-39ce-4e18-85f0-0c51b4bdab5d> |
| Obtained | Automatic download by ingest from <https://indiacode.gov.in/server/api/core/bitstreams/bf83f6e3-2c10-4dab-9daa-da46662849d2/content> |
| Version | India Code consolidated text |
| Licence | Official Government of India publication |
| Raw file | `corpus/raw/in-bd-act-2002.pdf`, 394 KB, sha256 `729b07e581fe5531…` |
| Text | `corpus/normalised/in-bd-act-2002.txt`, 25 pages |
| Database | source_versions.id = 154, retrieved 2026-09-17 15:10, 73 chunks |
| Notes | Check at ingest whether the text includes the Biological Diversity (Amendment) Act, 2023. |

### The Biological Diversity Rules, 2024

| | |
|---|---|
| Id | `in-bd-rules-2024` |
| Status | ingested |
| Issuer | National Biodiversity Authority |
| Type / regimes | rules / abs |
| Official page | <https://www.nbaindia.nic.in/acts-and-rules/rules> |
| Obtained | Automatic download by ingest from <https://www.nbaindia.nic.in/sites/default/files/2026-05/BD_Rules.pdf> |
| Version | As notified (issued 2024-10-22) |
| Licence | Official Government of India publication |
| Raw file | `corpus/raw/in-bd-rules-2024.pdf`, 2358 KB, sha256 `33ec189d783e1124…` |
| Text | `corpus/normalised/in-bd-rules-2024.txt`, 86 pages |
| Database | source_versions.id = 155, retrieved 2026-09-17 15:11, 81 chunks |

### The Biological Diversity (Amendment) Rules, 2025

| | |
|---|---|
| Id | `in-bd-amendment-rules-2025` |
| Status | ingested |
| Issuer | National Biodiversity Authority |
| Type / regimes | rules / abs |
| Official page | <https://www.nbaindia.nic.in/acts-and-rules/rules> |
| Obtained | Automatic download by ingest from <https://www.nbaindia.nic.in/sites/default/files/2026-05/AmendmentBD_Rules.pdf> |
| Version | As notified (issued 2025-05-06) |
| Licence | Official Government of India publication |
| Raw file | `corpus/raw/in-bd-amendment-rules-2025.pdf`, 1869 KB, sha256 `a32a3bcac48955f0…` |
| Text | `corpus/normalised/in-bd-amendment-rules-2025.txt`, 5 pages |
| Database | source_versions.id = 156, retrieved 2026-09-17 15:12, 4 chunks |

### The Drugs and Cosmetics Act, 1940

| | |
|---|---|
| Id | `in-dc-act-1940` |
| Status | ingested |
| Issuer | Legislative Department, Government of India (India Code) |
| Type / regimes | statute / drug_licensing, labelling, cosmetic |
| Official page | <https://indiacode.gov.in/items/8725a8a7-45a4-42e3-9046-e2a6383cd049> |
| Obtained | Automatic download by ingest from <https://indiacode.gov.in/server/api/core/bitstreams/3b64f195-bdb9-4837-afb2-7d7b24ac83d2/content> |
| Version | India Code consolidated text |
| Licence | Official Government of India publication |
| Raw file | `corpus/raw/in-dc-act-1940.pdf`, 963 KB, sha256 `f3e9a9b7c9d5060f…` |
| Text | `corpus/normalised/in-dc-act-1940.txt`, 45 pages |
| Database | source_versions.id = 157, retrieved 2026-09-17 15:13, 96 chunks |

### The Drugs and Cosmetics Rules, 1945

| | |
|---|---|
| Id | `in-dc-rules-1945` |
| Status | ingested |
| Issuer | Legislative Department, Government of India (India Code) |
| Type / regimes | rules / drug_licensing, labelling, advertising |
| Official page | <https://indiacode.gov.in/items/9a917765-d98d-4bdf-92ee-8b6332b91956> |
| Obtained | Automatic download by ingest from <https://indiacode.gov.in/server/api/core/bitstreams/655d0cf8-b0c3-4a20-a703-224c832db910/content> |
| Version | India Code combined Act and Rules text (as-on date to confirm at ingest) (issued 1945-12-21) |
| Licence | Official Government of India publication |
| Raw file | `corpus/raw/in-dc-rules-1945.pdf`, 7644 KB, sha256 `f6419beeaa0bf3a0…` |
| Text | `corpus/normalised/in-dc-rules-1945.txt`, 635 pages |
| Database | source_versions.id = 158, retrieved 2026-09-17 15:14, 555 chunks |
| Notes | Key parts are Part XVI-XVII (ASU), Rule 158B, Rule 161, Schedules E(1) and T. Check the status of Rule 170 separately. |

### The Drugs and Magic Remedies (Objectionable Advertisements) Act, 1954

| | |
|---|---|
| Id | `in-dmr-act-1954` |
| Status | ingested |
| Issuer | Legislative Department, Government of India (India Code) |
| Type / regimes | statute / advertising |
| Official page | <https://indiacode.gov.in/items/a0e67f19-8e2e-4ba2-bde4-6354e5ff7dee> |
| Obtained | Automatic download by ingest from <https://indiacode.gov.in/server/api/core/bitstreams/6381cc69-0b65-4e0f-9754-71f0f3bf91b7/content> |
| Version | India Code consolidated text |
| Licence | Official Government of India publication |
| Raw file | `corpus/raw/in-dmr-act-1954.pdf`, 339 KB, sha256 `9dd51c69a283ade1…` |
| Text | `corpus/normalised/in-dmr-act-1954.txt`, 12 pages |
| Database | source_versions.id = 225, retrieved 2026-09-17 15:22, 19 chunks |

### The New Drugs and Clinical Trials Rules, 2019

| | |
|---|---|
| Id | `in-ndct-rules-2019` |
| Status | ingested |
| Issuer | Central Drugs Standard Control Organisation |
| Type / regimes | rules / drug_licensing |
| Official page | <https://cdsco.gov.in/opencms/opencms/en/Acts-and-rules/New-Drugs/> |
| Obtained | Automatic download by ingest from <https://cdsco.gov.in/opencms/resources/UploadCDSCOWeb/2022/new_DC_rules/NEW%20DRUGS%20ANDctrS%20RULE,%202019.pdf> |
| Version | CDSCO published text |
| Licence | Official Government of India publication |
| Raw file | `corpus/raw/in-ndct-rules-2019.pdf`, 1810 KB, sha256 `e9c8a461a137d0c2…` |
| Text | `corpus/normalised/in-ndct-rules-2019.txt`, 242 pages |
| Database | source_versions.id = 226, retrieved 2026-09-17 15:23, 143 chunks |

### The Cosmetics Rules, 2020

| | |
|---|---|
| Id | `in-cosmetics-rules-2020` |
| Status | ingested |
| Issuer | Central Drugs Standard Control Organisation |
| Type / regimes | rules / cosmetic, labelling |
| Official page | <https://cdsco.gov.in/opencms/opencms/en/Acts-and-rules/Cosmetics-Rules/> |
| Obtained | Automatic download by ingest from <https://www.cdsco.gov.in/opencms/resources/UploadCDSCOWeb/2022/cos_rules/Cosmetics%20Rules%202020.pdf> |
| Version | CDSCO published text |
| Licence | Official Government of India publication |
| Raw file | `corpus/raw/in-cosmetics-rules-2020.pdf`, 773 KB, sha256 `baf622fd41acd2bd…` |
| Text | `corpus/normalised/in-cosmetics-rules-2020.txt`, 112 pages |
| Database | source_versions.id = 227, retrieved 2026-09-17 15:26, 126 chunks |

### Food Safety and Standards (Ayurveda Aahara) Regulations, 2022

| | |
|---|---|
| Id | `in-fssai-ayurveda-aahara-2022` |
| Status | ingested |
| Issuer | Food Safety and Standards Authority of India |
| Type / regimes | regulations / food, labelling |
| Official page | <https://fssai.gov.in/upload/notifications/2022/05/62789a20b54bdGazette_Notification_Ayurveda_Aahara_09_05_2022.pdf> |
| Obtained | Automatic download by ingest from <https://stg-old.fssai.gov.in/upload/notifications/2022/05/62789a20b54bdGazette_Notification_Ayurveda_Aahara_09_05_2022.pdf> |
| Version | Gazette notification dated 2022-05-09 (per file name) |
| Licence | Official Government of India publication |
| Raw file | `corpus/raw/in-fssai-ayurveda-aahara-2022.pdf`, 2253 KB, sha256 `1ae8cfc632fad0a7…` |
| Text | `corpus/normalised/in-fssai-ayurveda-aahara-2022.txt`, 27 pages |
| Database | source_versions.id = 270, retrieved 2026-09-17 15:57, 24 chunks |
| Notes | The main fssai.gov.in site returns its web app to scripts and browsers; the same PDF is served from FSSAI's archive host stg-old.fssai.gov.in. |

### The Food Safety and Standards Act, 2006

| | |
|---|---|
| Id | `in-fss-act-2006` |
| Status | ingested |
| Issuer | Legislative Department, Government of India (India Code) |
| Type / regimes | statute / food |
| Official page | <https://indiacode.gov.in/items/901412c2-ea41-4afb-b6d2-8686b27623e6> |
| Obtained | Automatic download by ingest from <https://indiacode.gov.in/server/api/core/bitstreams/85d01867-be01-4a3f-9c7c-94e2d0fa5c18/content> |
| Version | India Code consolidated text |
| Licence | Official Government of India publication |
| Raw file | `corpus/raw/in-fss-act-2006.pdf`, 545 KB, sha256 `3fb792191b18a519…` |
| Text | `corpus/normalised/in-fss-act-2006.txt`, 45 pages |
| Database | source_versions.id = 239, retrieved 2026-09-17 15:32, 118 chunks |

### The Wild Life (Protection) Act, 1972

| | |
|---|---|
| Id | `in-wlpa-1972` |
| Status | ingested |
| Issuer | Legislative Department, Government of India (India Code) |
| Type / regimes | statute / wildlife |
| Official page | <https://indiacode.gov.in/items/3df23bd4-5433-4baf-92e9-56b72f4f1008> |
| Obtained | Automatic download by ingest from <https://indiacode.gov.in/server/api/core/bitstreams/028cf190-8c70-42d0-baf0-d15be4ba14e7/content> |
| Version | India Code consolidated text |
| Licence | Official Government of India publication |
| Raw file | `corpus/raw/in-wlpa-1972.pdf`, 5471 KB, sha256 `28f00628c1a68b1e…` |
| Text | `corpus/normalised/in-wlpa-1972.txt`, 222 pages |
| Database | source_versions.id = 240, retrieved 2026-09-17 15:35, 255 chunks |

### The Consumer Protection Act, 2019

| | |
|---|---|
| Id | `in-consumer-protection-act-2019` |
| Status | ingested |
| Issuer | Legislative Department, Government of India (India Code) |
| Type / regimes | statute / advertising |
| Official page | <https://indiacode.gov.in/items/1b6c1754-47b1-411e-9607-1712a9caf368> |
| Obtained | Automatic download by ingest from <https://indiacode.gov.in/server/api/core/bitstreams/d546dfb5-3044-4661-981d-3e1771c290b9/content> |
| Version | India Code consolidated text |
| Licence | Official Government of India publication |
| Raw file | `corpus/raw/in-consumer-protection-act-2019.pdf`, 612 KB, sha256 `4bbed366bc2206bb…` |
| Text | `corpus/normalised/in-consumer-protection-act-2019.txt`, 42 pages |
| Database | source_versions.id = 241, retrieved 2026-09-17 15:35, 112 chunks |

### The Digital Personal Data Protection Act, 2023

| | |
|---|---|
| Id | `in-dpdp-act-2023` |
| Status | ingested |
| Issuer | Legislative Department, Government of India (India Code) |
| Type / regimes | statute / privacy |
| Official page | <https://indiacode.gov.in/items/c058fa9f-eaf0-4ca3-98f1-3443b087bca9> |
| Obtained | Automatic download by ingest from <https://indiacode.gov.in/server/api/core/bitstreams/52f9ecbb-b927-4ba6-ae6f-ca2fac50d4df/content> |
| Version | India Code text |
| Licence | Official Government of India publication |
| Raw file | `corpus/raw/in-dpdp-act-2023.pdf`, 435 KB, sha256 `dda561b9fd6420e1…` |
| Text | `corpus/normalised/in-dpdp-act-2023.txt`, 25 pages |
| Database | source_versions.id = 242, retrieved 2026-09-17 15:35, 53 chunks |
| Notes | For the checks in docs/dpdp-and-security.md. |

## International

### Agreement on Trade-Related Aspects of Intellectual Property Rights (TRIPS)

| | |
|---|---|
| Id | `intl-trips` |
| Status | ingested |
| Issuer | World Trade Organization |
| Type / regimes | treaty / treaty, patent, gi, trademark, copyright, design, trade_secret |
| Official page | <https://www.wipo.int/wipolex/en/treaties/textdetails/12746> |
| Obtained | Automatic download by ingest from <https://www.wto.org/english/docs_e/legal_e/27-trips.pdf> |
| Version | WTO legal text (check at ingest whether Art. 31bis from the 2017 amendment is included) |
| Licence | Official treaty text |
| Raw file | `corpus/raw/intl-trips.pdf`, 193 KB, sha256 `baa5beb7dda530e5…` |
| Text | `corpus/normalised/intl-trips.txt`, 33 pages |
| Database | source_versions.id = 243, retrieved 2026-09-17 15:35, 76 chunks |

### Paris Convention for the Protection of Industrial Property (as amended on September 28, 1979)

| | |
|---|---|
| Id | `intl-paris-convention` |
| Status | ingested |
| Issuer | World Intellectual Property Organization |
| Type / regimes | treaty / treaty, patent, trademark, design |
| Official page | <https://www.wipo.int/wipolex/en/treaties/textdetails/12633> |
| Obtained | Downloaded by Tushar on 2026-09-17 from the WIPO Lex treaty page (English PDF). |
| Version | As amended on 28 September 1979 |
| Licence | Official treaty text |
| Raw file | `corpus/raw/intl-paris-convention.pdf`, 111 KB, sha256 `57b56e8aec7c7d30…` |
| Text | `corpus/normalised/intl-paris-convention.txt`, 20 pages |
| Database | source_versions.id = 272, retrieved 2026-09-17 16:00, 54 chunks |
| Notes | WIPO Lex serves the PDF through signed links; download from the details page. |

### Convention on Biological Diversity

| | |
|---|---|
| Id | `intl-cbd` |
| Status | ingested |
| Issuer | Secretariat of the Convention on Biological Diversity |
| Type / regimes | treaty / treaty, abs |
| Official page | <https://www.cbd.int/doc/legal/cbd-en.pdf> |
| Obtained | Automatic download by ingest from <https://www.cbd.int/doc/legal/cbd-en.pdf> |
| Version | Text and annexes |
| Licence | Official treaty text |
| Raw file | `corpus/raw/intl-cbd.pdf`, 4444 KB, sha256 `9acd3886bfb0b3c3…` |
| Text | `corpus/normalised/intl-cbd.txt`, 36 pages |
| Database | source_versions.id = 244, retrieved 2026-09-17 15:35, 43 chunks |

### Nagoya Protocol on Access to Genetic Resources and the Fair and Equitable Sharing of Benefits Arising from their Utilization

| | |
|---|---|
| Id | `intl-nagoya-protocol` |
| Status | ingested |
| Issuer | Secretariat of the Convention on Biological Diversity |
| Type / regimes | treaty / treaty, abs |
| Official page | <https://www.wipo.int/wipolex/en/treaties/textdetails/12294> |
| Obtained | Automatic download by ingest from <https://www.cbd.int/abs/doc/protocol/nagoya-protocol-en.pdf> |
| Version | Text adopted 29 October 2010 |
| Licence | Official treaty text |
| Raw file | `corpus/raw/intl-nagoya-protocol.pdf`, 490 KB, sha256 `cdbd496bd361317d…` |
| Text | `corpus/normalised/intl-nagoya-protocol.txt`, 15 pages |
| Database | source_versions.id = 245, retrieved 2026-09-17 15:35, 38 chunks |

### WIPO Treaty on Intellectual Property, Genetic Resources and Associated Traditional Knowledge

| | |
|---|---|
| Id | `intl-gratk-2024` |
| Status | ingested |
| Issuer | World Intellectual Property Organization |
| Type / regimes | treaty / treaty, patent, abs |
| Official page | <https://www.wipo.int/en/web/treaties/ip/gratk/index> |
| Obtained | Automatic download by ingest from <https://www.wipo.int/edocs/mdocs/tk/en/gratk_dc/gratk_dc_7.pdf> |
| Version | GRATK/DC/7, adopted 24 May 2024 (issued 2024-05-24) |
| Licence | Official treaty text |
| Raw file | `corpus/raw/intl-gratk-2024.pdf`, 271 KB, sha256 `1b898fd1a1655cd3…` |
| Text | `corpus/normalised/intl-gratk-2024.txt`, 10 pages |
| Database | source_versions.id = 246, retrieved 2026-09-17 15:36, 23 chunks |

### Patent Cooperation Treaty (PCT)

| | |
|---|---|
| Id | `intl-pct` |
| Status | ingested |
| Issuer | World Intellectual Property Organization |
| Type / regimes | treaty / treaty, patent |
| Official page | <https://www.wipo.int/documents/d/pct-system/docs-en-texts-pct.pdf> |
| Obtained | Automatic download by ingest from <https://www.wipo.int/documents/d/pct-system/docs-en-texts-pct.pdf> |
| Version | WIPO published text (check the in-force date on the cover at ingest) |
| Licence | Official treaty text |
| Raw file | `corpus/raw/intl-pct.pdf`, 444 KB, sha256 `31c1cf128ff57384…` |
| Text | `corpus/normalised/intl-pct.txt`, 53 pages |
| Database | source_versions.id = 247, retrieved 2026-09-17 15:36, 78 chunks |

### Budapest Treaty on the International Recognition of the Deposit of Microorganisms for the Purposes of Patent Procedure

| | |
|---|---|
| Id | `intl-budapest-treaty` |
| Status | ingested |
| Issuer | World Intellectual Property Organization |
| Type / regimes | treaty / treaty, patent |
| Official page | <https://www.wipo.int/wipolex/en/treaties/textdetails/12244> |
| Obtained | Downloaded by Tushar on 2026-09-17 from the WIPO Lex treaty page (English PDF). |
| Version | As amended on 26 September 1980 |
| Licence | Official treaty text |
| Raw file | `corpus/raw/intl-budapest-treaty.pdf`, 77 KB, sha256 `aefecadb3b9f6330…` |
| Text | `corpus/normalised/intl-budapest-treaty.txt`, 10 pages |
| Database | source_versions.id = 273, retrieved 2026-09-17 16:00, 22 chunks |
| Notes | WIPO Lex serves the PDF through signed links; download from the details page. |

### Budapest Treaty — International Depositary Authorities

| | |
|---|---|
| Id | `intl-budapest-ida-list` |
| Status | ingested |
| Issuer | World Intellectual Property Organization |
| Type / regimes | registry_record / treaty, patent |
| Official page | <https://www.wipo.int/en/web/treaties/registration/budapest/index> |
| Obtained | Automatic download by ingest from <https://www.wipo.int/documents/d/treaties/docs-en-registration-budapest-idalist.pdf> |
| Version | WIPO list as fetched; re-fetch to pick up a newly recognised authority |
| Licence | Official WIPO publication |
| Raw file | `corpus/raw/intl-budapest-ida-list.pdf` (not present) |
| Text | `corpus/normalised/intl-budapest-ida-list.txt`, 1 pages |
| Database | source_versions.id = 654, retrieved 2026-09-24 15:09, 4 chunks |
| Notes | A registry record, not law. It says which depositaries a Budapest deposit can be made at and since when; the obligation to deposit is Patents Act s.10(4)(d)(ii) and Budapest Art. 3. Checked 2026-09-23 — lists MTCC (4 Oct 2002), MCC (9 Apr 2011) and NAIMCC (28 Jul 2020) for India. |

### Directive 2004/24/EC on traditional herbal medicinal products

| | |
|---|---|
| Id | `intl-eu-thmpd-2004-24` |
| Status | ingested |
| Issuer | European Parliament and Council (EUR-Lex) |
| Type / regimes | regulation / market_access |
| Official page | <https://eur-lex.europa.eu/eli/dir/2004/24/oj/eng> |
| Obtained | Downloaded by Tushar on 2026-09-17 from the EU Publications Office search (op.europa.eu, EU law collection, PDF), because EUR-Lex was partly down. |
| Version | Original text, OJ L 136, 30.4.2004 |
| Licence | Official EU legal text (EUR-Lex terms) |
| Raw file | `corpus/raw/intl-eu-thmpd-2004-24.pdf`, 99 KB, sha256 `4be45bf84654d5e3…` |
| Text | `corpus/normalised/intl-eu-thmpd-2004-24.txt`, 6 pages |
| Database | source_versions.id = 274, retrieved 2026-09-17 16:00, 15 chunks |
| Notes | EUR-Lex answers scripted requests with a 202 challenge page; open https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:32004L0024 in a browser and save the PDF. |

### Protocol Relating to the Madrid Agreement Concerning the International Registration of Marks

| | |
|---|---|
| Id | `intl-madrid-protocol` |
| Status | ingested |
| Issuer | World Intellectual Property Organization |
| Type / regimes | treaty / treaty, trademark |
| Official page | <https://www.wipo.int/wipolex/en/treaties/textdetails/12603> |
| Obtained | Automatic download by ingest from <https://www.wipo.int/wipolex/en/text/283484> |
| Version | As amended on 12 November 2007 (TRT/MADRIDP-GP/001) |
| Licence | Official treaty text |
| Raw file | `corpus/raw/intl-madrid-protocol.html`, 93 KB, sha256 `e5148cd03eccc552…` |
| Text | `corpus/normalised/intl-madrid-protocol.txt`, 1 pages |
| Database | source_versions.id = 655, retrieved 2026-09-24 15:09, 28 chunks |
| Notes | The international route for a trade mark — one application through the home office, designating other members. India's national law is the Trade Marks Act, 1999; the Protocol is what takes a mark abroad. WIPO Lex serves the authentic text as HTML; the PDF is behind a signed link. |

### Madrid Agreement and Protocol — Contracting Parties

| | |
|---|---|
| Id | `intl-madrid-parties` |
| Status | ingested |
| Issuer | World Intellectual Property Organization |
| Type / regimes | registry_record / treaty, trademark |
| Official page | <https://www.wipo.int/en/web/treaties/registration/madrid_protocol/index> |
| Obtained | Automatic download by ingest from <https://www.wipo.int/treaties/en/docs/pdf/madrid_marks.pdf> |
| Version | WIPO status list as fetched; re-fetch to pick up a new accession |
| Licence | Official WIPO publication |
| Raw file | `corpus/raw/intl-madrid-parties.pdf`, 188 KB, sha256 `7c5d1d62ac6b58c4…` |
| Text | `corpus/normalised/intl-madrid-parties.txt`, 4 pages |
| Database | source_versions.id = 656, retrieved 2026-09-24 15:09, 10 chunks |
| Notes | A registry record, not law. It is the authority for whether a country can be designated. Checked 2026-09-24 — the list gives India as party to the Protocol from 8 July 2013, and no date in the Madrid Agreement column. |

### Hague Agreement Concerning the International Registration of Industrial Designs — Geneva Act (1999)

| | |
|---|---|
| Id | `intl-hague-geneva-act` |
| Status | ingested |
| Issuer | World Intellectual Property Organization |
| Type / regimes | treaty / treaty, design |
| Official page | <https://www.wipo.int/wipolex/en/treaties/textdetails/12531> |
| Obtained | Automatic download by ingest from <https://www.wipo.int/wipolex/en/text/285214> |
| Version | Geneva Act of 2 July 1999 (TRT/HAGUE/006) |
| Licence | Official treaty text |
| Raw file | `corpus/raw/intl-hague-geneva-act.html`, 97 KB, sha256 `0b5285d2f634e0d3…` |
| Text | `corpus/normalised/intl-hague-geneva-act.txt`, 1 pages |
| Database | source_versions.id = 657, retrieved 2026-09-24 15:09, 40 chunks |
| Notes | The international route for an industrial design. India is not in the contracting-party list (see intl-hague-parties), so this text says what the route is, not that it is open from India. WIPO Lex serves the authentic text as HTML. |

### Hague Agreement — Contracting Parties

| | |
|---|---|
| Id | `intl-hague-parties` |
| Status | ingested |
| Issuer | World Intellectual Property Organization |
| Type / regimes | registry_record / treaty, design |
| Official page | <https://www.wipo.int/en/web/hague-system/legal_texts> |
| Obtained | Automatic download by ingest from <https://www.wipo.int/treaties/en/docs/pdf/hague.pdf> |
| Version | WIPO status list as fetched; re-fetch to pick up a new accession |
| Licence | Official WIPO publication |
| Raw file | `corpus/raw/intl-hague-parties.pdf`, 178 KB, sha256 `48126892ddebfb56…` |
| Text | `corpus/normalised/intl-hague-parties.txt`, 3 pages |
| Database | source_versions.id = 658, retrieved 2026-09-24 15:09, 7 chunks |
| Notes | A registry record, not law, and the authority for the negative answer. Checked 2026-09-24 — 85 parties listed and India is not among them, so an Indian applicant files for a design nationally or in each country, not through the Hague route. |

