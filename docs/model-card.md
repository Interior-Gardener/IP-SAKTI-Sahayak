# Model card — IP-SAKTI Sahayak

A system card for the assistant as a whole (retrieval + language models + guardrails), not for any single model. Vocabulary follows the NIST AI Risk Management Framework (Govern, Map, Measure, Manage) and ISO/IEC 42001 so judges can map it to recognised AI-application standards. Numbers are filled in from `eval/runs/` as stages land; until then they read **TBD**.

## 1. System details

| | |
|---|---|
| Name | IP-SAKTI Sahayak (product: Vanaspati Sahayak) |
| Version | 0.1 (stage 0) |
| Type | Retrieval-augmented question answering with mandatory citations |
| Answer model | Configurable per role ([providers.md](providers.md)): Anthropic `claude-opus-5` by default, or a Groq-hosted open model |
| Fast / judge models | `claude-haiku-4-5` / `claude-sonnet-5` by default, or Groq models |
| Embeddings / reranker | BGE-M3 and bge-reranker-v2-m3 (local) by default; `voyage-law-2` optional |
| Language services | Bhashini (ASR, NMT, TTS), with LLM / Groq Whisper / browser fallbacks |
| Knowledge source | Version-tracked corpus in `corpus/manifest.yaml`; corpus version shown by `GET /health` |
| Owners | SIH-26 PS-45 team (see [CONTRIBUTING.md](CONTRIBUTING.md)) |

## 2. Intended use (Map)

**For**: practitioners, researchers, AYUSH startups and MSMEs, and cultivators who want plain-language, cited **information** on IP and regulatory questions about Ayurvedic products, separately for India and international regimes, and a pointer to the right registry, record or form.

**Not for**: legal advice or a legal opinion on a specific filing; medical or dosage advice; deciding whether a real product is lawful to sell; replacing a patent search, a registered patent agent or a lawyer. Every answer carries the disclaimer and an escalation path to a human IP facilitator.

**Users can't rely on it for**: law newer than the corpus version; documents not in the corpus; paid databases the user hasn't connected.

## 3. How it avoids making things up

- Answers are generated only from retrieved corpus chunks, one answer per jurisdiction, never merged.
- Every citation's quoted text must be found in the named chunk, and every section/rule/article number in the answer must appear in a cited chunk of the same jurisdiction (verifier, [PLAN.md](PLAN.md#the-rag-pipeline-in-detail)).
- Unverified claims lower confidence; below the floor the system abstains with `insufficient_sources` and offers escalation.
- Static data (plant IP profiles, classification table) uses `unknown` or a citation id; nothing is asserted without a source.

## 4. Evaluation (Measure)

Golden set ~120 items (PLAN.md stage 1). Results per provider:

| Metric | Target (MVP) | Groq (2026-09-18, 46 items) | Anthropic |
|---|---|---|---|
| Retrieval recall@8 | ≥ 0.85 | 1.00 | not run |
| Citation correctness | ≥ 0.95 | 0.886 | not run |
| Answer accuracy (judge) | ≥ 0.80 | 0.843 | not run |
| Abstention on out-of-scope | ≥ 0.95 | 1.00 | not run |
| False abstention on in-scope | ≤ 0.10 | 0.028 | not run |
| Multilingual agreement (hi / mr / ta) | ≥ 0.85 | 1.00 | not run |

Run file: `eval/runs/2026-09-18-groq-after-window.json`. Treat these as early and indicative: 46
items (plan: ~120), written in-house, and graded by the same model family that writes the answers.
Known wrong answer in that run: Rule 158B's requirement table was misread (a flattened table).

Known limitation of the method: the accuracy judge is itself a model; a sample of judged items is checked by a team member each run and the agreement rate recorded here.

## 5. Risks and limitations (Map / Manage)

| Risk | Effect | Mitigation | Residual |
|---|---|---|---|
| Stale law | Answer cites a superseded rule | Versioned corpus, `check-currency` job, superseded chunks excluded, corpus version on every answer | Gap between a legal change and re-ingest |
| Wrong but cited | Correct quote, wrong conclusion | Judge-scored accuracy; confidence bands; disclaimer; escalation | Not zero; users told to verify |
| Weaker Indian-language quality | Hindi / Marathi / Tamil answers drift | Multilingual twins in eval; answer written directly in language; provider shown in UI | Larger on the Groq path |
| Provider quality gap | Groq path less accurate | Measured separately; footer shows which provider answered | Known and reported |
| Scanned gazette OCR errors | Chunk text slightly wrong | OCR fallback + manual review of the most-cited sections | Low-traffic sections may carry OCR noise |
| Over-trust | User acts on it as advice | Standing disclaimer, confidence chip, escalation | Behavioural; can't be removed |

Security and privacy risks: see [dpdp-and-security.md](dpdp-and-security.md).

## 6. Governance (Govern)

- Legal content changes go through `corpus/manifest.yaml` + `CHANGELOG.md` in a reviewed commit; reviewers reject uncited legal statements ([CONTRIBUTING.md §4](CONTRIBUTING.md#4-workflow)).
- Model or provider changes require an eval run committed under `eval/runs/` before merge.
- Incidents (a wrong answer reported by a user or facilitator) are added to the golden set as a regression item.

## 7. NIST AI RMF and ISO/IEC 42001 mapping (summary)

| NIST AI RMF function | What we do | ISO/IEC 42001 theme |
|---|---|---|
| Govern | Ownership table, review rules, corpus change process | Leadership, roles, policy |
| Map | Intended use and misuse (§2), risk table (§5), threat model | Context, risk assessment |
| Measure | Eval harness, per-provider metrics, judge spot-checks (§4) | Performance evaluation |
| Manage | Guardrails, abstention, escalation, retention, incident → regression item | Operation, improvement |

Check function and clause names against the current NIST AI RMF and ISO/IEC 42001 texts when this card is next reviewed.
