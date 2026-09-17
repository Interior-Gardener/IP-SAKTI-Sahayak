"""The provider seam. Nothing outside `app/llm/` imports a vendor SDK."""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any, Literal

from pydantic import BaseModel

Role = Literal["answer", "fast", "judge"]


@dataclass(frozen=True)
class Document:
    """A retrieved chunk handed to the model. Corpus text is untrusted data."""

    chunk_id: str
    title: str
    text: str


@dataclass(frozen=True)
class RawCitation:
    """What a provider returns, before the verifier maps it onto a `Citation`."""

    chunk_id: str
    cited_text: str


@dataclass(frozen=True)
class CitedAnswer:
    markdown: str
    citations: list[RawCitation]
    model: str


class LLMProvider(ABC):
    name: str

    def __init__(self, model: str) -> None:
        self.model = model

    @abstractmethod
    def complete(self, system: str, prompt: str, max_tokens: int = 1024) -> str: ...

    @abstractmethod
    def complete_structured[T: BaseModel](self, system: str, prompt: str, schema: type[T]) -> T: ...

    @abstractmethod
    def answer_with_citations(
        self, system: str, question: str, documents: list[Document]
    ) -> CitedAnswer: ...

    def tool_loop(self, system: str, prompt: str, tools: list[Any]) -> str:
        raise NotImplementedError("the tool loop lands in stage 2")

    def transcribe(self, audio: bytes, language: str | None = None) -> str:
        raise NotImplementedError(f"{self.name} has no speech-to-text")
