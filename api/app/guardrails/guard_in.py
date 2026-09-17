"""Checks that run before any retrieval or generation (docs/architecture.md §2, step 1).

Cheap checks come first (size, rate, obvious medical or injection patterns) so
most bad requests never cost a model call; the fast model then decides scope.
"""

import re
import threading
import time
from dataclasses import dataclass, field
from typing import Literal

from pydantic import BaseModel, Field

from app.llm.base import LLMProvider

MAX_QUESTION_CHARS = 2000

Verdict = Literal["ok", "out_of_scope", "medical_advice", "unsafe"]


@dataclass(frozen=True)
class GuardResult:
    verdict: Verdict
    reason: str = ""
    injection_flags: list[str] = field(default_factory=list)

    @property
    def allowed(self) -> bool:
        return self.verdict == "ok"


class QuestionTooLong(ValueError):
    pass


class RateLimited(RuntimeError):
    pass


class RateLimiter:
    """Token bucket per session id. In-process only: with several API workers each
    keeps its own buckets, which is acceptable for the demo deployment."""

    def __init__(self, per_minute: int = 10, burst: int = 5) -> None:
        self.rate = per_minute / 60
        self.burst = burst
        self._buckets: dict[str, tuple[float, float]] = {}
        self._lock = threading.Lock()

    def check(self, session_id: str, now: float | None = None) -> None:
        now = time.monotonic() if now is None else now
        with self._lock:
            tokens, last = self._buckets.get(session_id, (float(self.burst), now))
            tokens = min(self.burst, tokens + (now - last) * self.rate)
            if tokens < 1:
                raise RateLimited("too many questions; wait a minute")
            self._buckets[session_id] = (tokens - 1, now)


# Asking for dosing or treatment is medical advice, whatever the herb.
MEDICAL_RE = re.compile(
    r"\b(how much|what dose|dosage|how many (tablets|capsules|grams)|should i take|"
    r"can i take|cure (my|for)|treat my|is it safe for me|my (child|baby|mother|father) has|"
    r"i have (diabetes|cancer|bp|blood pressure|a fever))\b",
    re.IGNORECASE,
)

# Patterns are deliberately narrow: legal questions say "Act as amended", "ignore rule 158B
# for exports?" or "cite section 6", and those must not be refused.
INJECTION_PATTERNS = {
    "ignore_instructions": r"\b(ignore|disregard|forget|override)\s+(all\s+|any\s+|the\s+)?(previous|prior|above|earlier|your|system)\s+(instructions|rules|prompts?|guidelines)",
    "role_override": r"\b(you are now|from now on,? you|pretend (to be|you are)|act as (an? |if you)(?!.{0,20}\b(licen[cs]|agent|authority|distributor)))",
    "system_prompt_probe": r"\b(reveal|show|print|repeat)\b.{0,30}\b(system prompt|your (instructions|rules|prompt))\b",
    "fake_citation": r"\b(cite|say|state|claim)\b.{0,60}\b(section|article|rule)\s*\d+.{0,60}\b(even if|regardless|anyway|whether or not)\b",
    "delimiter_spoof": r"</?(source|document|system)\b|\[\[c:|【c:",
}  # fmt: skip
_INJECTION_RES = {k: re.compile(v, re.IGNORECASE) for k, v in INJECTION_PATTERNS.items()}

PII_PATTERNS = [
    (re.compile(r"[\w.+-]+@[\w-]+\.[\w.]+"), "[email]"),
    (re.compile(r"\b[A-Z]{5}\d{4}[A-Z]\b"), "[pan]"),
    (re.compile(r"\b\d{4}\s?\d{4}\s?\d{4}\b"), "[aadhaar]"),
    (re.compile(r"(?:\+91[\s-]?)?\b[6-9]\d{9}\b"), "[phone]"),
]


def scrub_pii(text: str) -> str:
    """For logs and audit rows only; the model still sees the original question."""
    for pattern, label in PII_PATTERNS:
        text = pattern.sub(label, text)
    return text


def injection_flags(text: str) -> list[str]:
    return [name for name, rx in _INJECTION_RES.items() if rx.search(text)]


class ScopeDecision(BaseModel):
    verdict: Verdict = Field(
        description="ok = about IP, biodiversity/ABS or regulation of Ayurvedic, herbal, "
        "microbial, animal or mineral products; out_of_scope = anything else; "
        "medical_advice = asks how to use or dose a remedy for a person's health; "
        "unsafe = asks for help breaking the law or harming people"
    )
    reason: str = Field(description="one short sentence")


SCOPE_SYSTEM = (
    "You screen questions for IP-SAKTI Sahayak, which gives information (not legal advice) "
    "on intellectual property and regulatory law for Ayurveda and related products in "
    "India and internationally: patents, GI, trade marks, copyright, designs, trade secrets, "
    "plant varieties, biodiversity access and benefit sharing, traditional knowledge, drug "
    "and cosmetic licensing, food rules, advertising, labelling, export and treaties. "
    "Classify the question. Questions in any language count. Questions about the law on "
    "selling or advertising a remedy are ok; questions about taking or dosing one are "
    "medical_advice."
)


def check_question(question: str, fast: LLMProvider | None) -> GuardResult:
    question = question.strip()
    if len(question) > MAX_QUESTION_CHARS:
        raise QuestionTooLong(f"questions are limited to {MAX_QUESTION_CHARS} characters")
    if not question:
        return GuardResult("out_of_scope", "empty question")

    flags = injection_flags(question)
    if flags:
        # Trying to steer the assistant (ignore rules, cite a made-up section, spoof source
        # markers) is refused outright rather than left to the model's judgement.
        return GuardResult("unsafe", f"instruction-injection pattern: {', '.join(flags)}", flags)
    if MEDICAL_RE.search(question):
        return GuardResult("medical_advice", "asks for personal health or dosing advice", flags)
    if fast is None:
        return GuardResult("ok", "no scope model configured", flags)
    try:
        decision = fast.complete_structured(SCOPE_SYSTEM, question, ScopeDecision)
    except Exception:  # noqa: BLE001 - a failed screen must not block legitimate users
        return GuardResult("ok", "scope check unavailable", flags)
    return GuardResult(decision.verdict, decision.reason, flags)


ABSTAIN_SUGGESTIONS: dict[str, str] = {
    "out_of_scope": "Sahayak answers questions on IP and regulation for Ayurvedic and "
    "related products. Try asking about patents, GI, trade marks, biodiversity approval, "
    "licensing, labelling or advertising.",
    "medical_advice": "Sahayak cannot advise on using or dosing a remedy. Please consult a "
    "registered Ayurveda practitioner or doctor. You can still ask about the law that "
    "applies to making or selling the product.",
    "unsafe": "Sahayak cannot help with that request.",
}
