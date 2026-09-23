"""The provider seam. Nothing outside `app/llm/` imports a vendor SDK."""

from abc import ABC, abstractmethod
from collections.abc import Callable
from dataclasses import dataclass, field
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


@dataclass(frozen=True)
class ToolSpec:
    """A tool offered to the model. `parameters` is a JSON schema object, which
    is what both provider SDKs want, under different key names."""

    name: str
    description: str
    parameters: dict[str, Any]


@dataclass(frozen=True)
class ToolInvocation:
    """One call the model made, for the audit trail and the UI's trace."""

    name: str
    arguments: dict[str, Any]
    #: What the tool returned, as the model saw it.
    result: str


@dataclass
class ToolRun:
    text: str
    calls: list[ToolInvocation] = field(default_factory=list)
    model: str = ""
    #: True when the loop stopped because it hit the cap, not because the model
    #: was finished — the caller must say so rather than present a half answer.
    truncated: bool = False


#: How much of each tool result the wrap-up prompt repeats.
WRAP_UP_RESULT_CHARS = 2400


#: Appended to the system prompt for the wrap-up request.
WRAP_UP_SYSTEM = (
    "\n\nYour research is finished and no tools are available any more. Write the answer "
    "in prose now, from the research notes you are given. Do not call or name any tool."
)

#: What the caller gets when even the wrap-up cannot produce prose.
CUT_SHORT = (
    "I could not finish this answer within the research budget, so I am not giving one: "
    "an unfinished legal answer is worse than none. Ask again more narrowly, or use Ask "
    "Sahayak, which answers from retrieved passages in a single step."
)


def wrap_up_prompt(prompt: str, calls: list[ToolInvocation]) -> str:
    """The last request when a tool loop hits its cap, as plain text.

    Replaying the tool transcript without declaring tools is refused by both
    providers once the model reaches for a tool again (Groq: "Tool choice is
    none, but model called a tool"; Anthropic will not accept tool blocks in a
    request that defines no tools). So the results go in as research notes,
    written as prose rather than as calls: the live run showed that notes
    shaped like `search_corpus({...})` are enough to set the model calling
    tools again even when it has none.
    """
    parts = [f"Question: {prompt}", "", "Research notes:"]
    for i, call in enumerate(calls, 1):
        result = call.result
        if len(result) > WRAP_UP_RESULT_CHARS:
            result = result[:WRAP_UP_RESULT_CHARS] + " […]"
        asked = "; ".join(f"{k} = {v}" for k, v in call.arguments.items()) or "no details"
        parts.append(f"\nNote {i}, looked up {call.name.replace('_', ' ')} ({asked}):\n{result}")
    parts.append(
        "\nAnswer the question now from these notes alone, citing the sources and provisions "
        "they name. Where they do not settle a point, say it is unverified rather than filling "
        "it in."
    )
    return "\n".join(parts)


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

    def tool_loop(
        self,
        system: str,
        prompt: str,
        tools: list["ToolSpec"],
        execute: "Callable[[str, dict], str]",
        max_iterations: int = 6,
    ) -> "ToolRun":
        """Let the model call the tools until it answers, or until the cap.

        The provider drives its own protocol; `execute` runs one tool and hands
        back a string. The cap is the provider's business as well as the
        caller's: a loop that cannot end is worse than a missing answer.
        """
        raise NotImplementedError(f"{self.name} has no tool loop")

    def transcribe(self, audio: bytes, language: str | None = None) -> str:
        raise NotImplementedError(f"{self.name} has no speech-to-text")
