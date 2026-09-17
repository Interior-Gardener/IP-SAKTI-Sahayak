"""Anthropic provider. Citations are native: each chunk goes in as a plain-text
`document` block, and the response's `cited_text` + `document_index` map
straight back to a chunk id, so the verifier's substring check is exact."""

from anthropic import Anthropic
from pydantic import BaseModel

from app.llm import router
from app.llm.base import CitedAnswer, Document, LLMProvider, RawCitation

# On a safety decline the API re-runs the request on Anthropic's recommended
# fallback model instead of returning the refusal.
_FALLBACK_BETA = "server-side-fallback-2026-07-01"


class RefusedError(RuntimeError):
    pass


class AnthropicProvider(LLMProvider):
    name = "anthropic"

    def __init__(self, model: str, client: Anthropic | None = None) -> None:
        super().__init__(model)
        self.client = client or Anthropic()

    def _system(self, system: str) -> list[dict]:
        # The system prompt is frozen per role, so it is the cache breakpoint;
        # questions and chunks come after it.
        return [{"type": "text", "text": system, "cache_control": {"type": "ephemeral"}}]

    def _create(self, **kwargs):
        response = self.client.beta.messages.create(
            model=self.model,
            betas=[_FALLBACK_BETA],
            fallbacks="default",
            **kwargs,
        )
        if response.stop_reason == "refusal":
            raise RefusedError("the model declined this request")
        return response

    def complete(self, system: str, prompt: str, max_tokens: int = 1024) -> str:
        response = self._create(
            max_tokens=max_tokens,
            system=self._system(system),
            messages=[{"role": "user", "content": prompt}],
        )
        return "".join(b.text for b in response.content if b.type == "text")

    def complete_structured[T: BaseModel](self, system: str, prompt: str, schema: type[T]) -> T:
        response = self.client.messages.parse(
            model=self.model,
            max_tokens=4096,
            system=self._system(system),
            messages=[{"role": "user", "content": prompt}],
            output_format=schema,
        )
        if response.stop_reason == "refusal" or response.parsed_output is None:
            raise RefusedError("no structured output returned")
        return response.parsed_output

    def answer_with_citations(
        self, system: str, question: str, documents: list[Document]
    ) -> CitedAnswer:
        # Corpus text is untrusted: it only ever enters as document blocks,
        # never inside the system prompt.
        content: list[dict] = [
            {
                "type": "document",
                "source": {"type": "text", "media_type": "text/plain", "data": d.text},
                "title": d.title,
                "citations": {"enabled": True},
            }
            for d in documents
        ]
        content.append({"type": "text", "text": question})
        response = self._create(
            max_tokens=16000,
            thinking={"type": "adaptive"},
            output_config={"effort": "high"},
            system=self._system(system),
            messages=[{"role": "user", "content": content}],
        )

        parts: list[str] = []
        citations: list[RawCitation] = []
        for block in response.content:
            if block.type != "text":
                continue
            parts.append(block.text)
            for c in block.citations or []:
                citations.append(RawCitation(documents[c.document_index].chunk_id, c.cited_text))
        return CitedAnswer("".join(parts), citations, response.model)


router.register("anthropic", AnthropicProvider)
