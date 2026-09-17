"""Role -> provider and model, from LLM_PROVIDER_<ROLE> and LLM_MODEL_<ROLE>."""

import os
from collections.abc import Callable

from app.llm.base import LLMProvider, Role

# Groq is the default for now (free credits). Each provider has its own
# default model per role, so switching LLM_PROVIDER_<ROLE> alone is enough.
DEFAULT_PROVIDER = "groq"
DEFAULT_MODELS: dict[str, dict[Role, str]] = {
    "groq": {
        "answer": "openai/gpt-oss-120b",
        "fast": "openai/gpt-oss-120b",
        "judge": "openai/gpt-oss-120b",
    },
    "anthropic": {
        "answer": "claude-opus-5",
        "fast": "claude-haiku-4-5",
        "judge": "claude-sonnet-5",
    },
}

# Providers register themselves here, so the router carries no vendor imports.
_REGISTRY: dict[str, Callable[[str], LLMProvider]] = {}


def register(name: str, factory: Callable[[str], LLMProvider]) -> None:
    _REGISTRY[name] = factory


def resolve(role: Role) -> tuple[str, str]:
    provider = os.environ.get(f"LLM_PROVIDER_{role.upper()}", DEFAULT_PROVIDER).lower()
    model = os.environ.get(f"LLM_MODEL_{role.upper()}") or DEFAULT_MODELS.get(provider, {}).get(
        role, ""
    )
    if not model:
        raise RuntimeError(f"set LLM_MODEL_{role.upper()} for provider '{provider}'")
    return provider, model


def get_provider(role: Role) -> LLMProvider:
    provider, model = resolve(role)
    if provider not in _REGISTRY:
        raise RuntimeError(f"unknown LLM provider '{provider}' for role '{role}'")
    return _REGISTRY[provider](model)
