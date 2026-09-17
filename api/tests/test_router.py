import pytest

from app.llm import router
from app.llm.base import CitedAnswer, LLMProvider


class Fake(LLMProvider):
    name = "fake"

    def complete(self, system, prompt, max_tokens=1024):
        return ""

    def complete_structured(self, system, prompt, schema):
        raise NotImplementedError

    def answer_with_citations(self, system, question, documents):
        return CitedAnswer("", [], self.model)


def test_defaults_to_groq_gpt_oss(monkeypatch):
    monkeypatch.delenv("LLM_PROVIDER_ANSWER", raising=False)
    monkeypatch.delenv("LLM_MODEL_ANSWER", raising=False)
    assert router.resolve("answer") == ("groq", "openai/gpt-oss-120b")


def test_switching_provider_picks_its_default_model(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER_JUDGE", "anthropic")
    monkeypatch.delenv("LLM_MODEL_JUDGE", raising=False)
    assert router.resolve("judge") == ("anthropic", "claude-sonnet-5")


def test_env_picks_provider_and_model(monkeypatch):
    router.register("fake", Fake)
    monkeypatch.setenv("LLM_PROVIDER_FAST", "fake")
    monkeypatch.setenv("LLM_MODEL_FAST", "tiny")
    provider = router.get_provider("fast")
    assert isinstance(provider, Fake) and provider.model == "tiny"


def test_unknown_provider_needs_a_model(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER_JUDGE", "somebody-else")
    monkeypatch.delenv("LLM_MODEL_JUDGE", raising=False)
    with pytest.raises(RuntimeError):
        router.resolve("judge")
