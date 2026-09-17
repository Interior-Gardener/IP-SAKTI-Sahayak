# LLM, embedding and language providers

The API never hard-codes a vendor. Every model-backed role goes through a small interface so the team can demo on whichever key it has.

## 1. Roles and env vars

| Role | Used for | Env var (provider) | Env var (model) | Default |
|---|---|---|---|---|
| `answer` | the cited answer, classification explanations, agent loop | `LLM_PROVIDER_ANSWER` | `LLM_MODEL_ANSWER` | `groq` / `openai/gpt-oss-120b` |
| `fast` | scope classifier, regime router, query rewrite, contextual chunk headers | `LLM_PROVIDER_FAST` | `LLM_MODEL_FAST` | `groq` / `openai/gpt-oss-120b` |
| `judge` | eval harness grading | `LLM_PROVIDER_JUDGE` | `LLM_MODEL_JUDGE` | `groq` / `openai/gpt-oss-120b` |
| `embed` | chunk and query embeddings | `EMBED_PROVIDER` | `EMBED_MODEL` | `local` / `BAAI/bge-m3` |
| `rerank` | cross-encoder rerank | `RERANK_PROVIDER` | `RERANK_MODEL` | `local` / `BAAI/bge-reranker-v2-m3` |
| `asr` / `tts` / `nmt` | voice and translation | `SPEECH_PROVIDER` | — | `bhashini` with fallbacks |

Keys: `ANTHROPIC_API_KEY`, `GROQ_API_KEY`, `VOYAGE_API_KEY` (optional), `BHASHINI_USER_ID` + `BHASHINI_API_KEY`.

**Current team default (2026-09-17): Groq with `openai/gpt-oss-120b` for all three roles.** Switching a role's provider to `anthropic` picks that provider's default model automatically.

A minimal free setup is `GROQ_API_KEY` only, with `LLM_PROVIDER_*=groq`, `EMBED_PROVIDER=local`, `RERANK_PROVIDER=local`. A best-quality setup is `ANTHROPIC_API_KEY` with the defaults above.

## 2. Anthropic (best quality, optional)

- SDK: official `anthropic` Python package. Adaptive thinking on; effort `high` for the answer role.
- **Citations**: retrieved chunks are passed as `document` content blocks with `citations: {enabled: true}`. The response carries `cited_text` plus the document index, which maps straight to a chunk id. This is character-anchored, so the verifier's substring check is exact.
- Prompt caching: the system prompt and tool definitions are frozen and cached; volatile content (question, chunks) comes after the cache breakpoint.
- Tool loop (stage 2): the SDK's tool runner with per-turn hooks that write `audit_events`.
- Models: `claude-opus-5` (answer), `claude-sonnet-5` (judge), `claude-haiku-4-5` (fast). Use these exact ids; no date suffixes.

## 3. Groq (current default)

- SDK: official `groq` Python package (OpenAI-compatible chat completions). Groq offers free credits on sign-up; check the console for the current allowance and rate limits.
- Models: pick from the live catalogue in the Groq console. Reasonable choices at time of writing: a Llama 3.3 70B or Llama 4 class model for `answer`, a Llama 3.1 8B class model for `fast`, and `whisper-large-v3` for ASR. Confirm ids in the console before setting `LLM_MODEL_*`; catalogues change.
- **Citations**: there is no native citation feature, so the prompt numbers each chunk and asks for markers of the form `[[c:<chunk_id>|"<verbatim span>"]]`. Where the model supports JSON-schema structured output, the answer is requested as `{ markdown, citations: [{chunk_id, span}] }` instead. Either way the markers are parsed into the same `Citation` shape and the same verifier runs, so "citation correctness" is measured identically across providers.
- Tool loop: Groq tool calling behind the same `tool_loop` interface; fewer parallel calls and stricter iteration caps.
- No embeddings on Groq: pair it with `EMBED_PROVIDER=local` (or Voyage).

Expect a quality gap versus Claude on legal reasoning and on writing in Indian languages. The eval harness runs per provider (`make eval PROVIDER=groq`) so the gap is measured, not guessed, and the UI footer always shows which provider answered.

## 4. Embeddings and reranking

- `local`: BGE-M3 via `sentence-transformers` (multilingual, runs on CPU; a few thousand statute chunks embed in minutes). Reranker `bge-reranker-v2-m3` likewise. No keys, no cost.
- `voyage`: `voyage-law-2` for legal text (needs `VOYAGE_API_KEY`). Better English legal retrieval; queries are translated to English first anyway.
- Every chunk stores `embed_model`. Changing the embedder triggers a re-embed of all chunks; the API refuses to search across mixed models.

## 5. Bhashini (national language infrastructure)

- Register on the ULCA / Bhashini portal for a user id and API key; approval can take days, so apply first.
- Used for: ASR (voice in), NMT (query to English for retrieval; answer translation only as a fallback), TTS (voice out).
- Fallbacks so nothing blocks on approval: NMT → the `fast` LLM; ASR → Groq Whisper; TTS → the browser's SpeechSynthesis already in `src/lib/speech.ts`.
- Answer language: the answer model writes directly in the user's language. Legal prose survives that better than machine-translating an English answer, and the eval's multilingual runner compares against the English twin to catch drift.

## 6. Adding a provider

Implement `LLMProvider` in `api/app/llm/base.py` (`complete`, `complete_structured`, `answer_with_citations`, `tool_loop`, `transcribe`), register it in `router.py`, and add a citation adapter that produces `Citation[]`. The verifier and the eval harness need no changes; that is the point of the layer.
