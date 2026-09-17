"""Role -> provider and model, from LLM_PROVIDER_<ROLE> and LLM_MODEL_<ROLE>."""

import os
from collections.abc import Callable

from app.llm.base import LLMProvider, Role

DEFAULTS: dict[Role, tuple[str, str]] = {
    "answer": ("anthropic", "claude-opus-5"),
    "fast": ("anthropic", "claude-haiku-4-5"),
    "judge": ("anthropic", "claude-sonnet-5"),
}

# Providers register themselves here, so the router carries no vendor imports.
_REGISTRY: dict[str, Callable[[str], LLMProvider]] = {}


def register(name: str, factory: Callable[[str], LLMProvider]) -> None:
    _REGISTRY[name] = factory


def resolve(role: Role) -> tuple[str, str]:
    default_provider, default_model = DEFAULTS[role]
    provider = os.environ.get(f"LLM_PROVIDER_{role.upper()}", default_provider).lower()
    # A default model id only makes sense for the default provider; Groq ids
    # change with its catalogue, so they must be set explicitly.
    model = os.environ.get(f"LLM_MODEL_{role.upper()}") or (
        default_model if provider == default_provider else ""
    )
    if not model:
        raise RuntimeError(f"set LLM_MODEL_{role.upper()} for provider '{provider}'")
    return provider, model


def get_provider(role: Role) -> LLMProvider:
    provider, model = resolve(role)
    if provider not in _REGISTRY:
        raise RuntimeError(f"unknown LLM provider '{provider}' for role '{role}'")
    return _REGISTRY[provider](model)
