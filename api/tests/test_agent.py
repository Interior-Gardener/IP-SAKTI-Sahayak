"""The agentic tool loop.

Driven by a fake provider, because the point of these tests is the loop and
the tools, not the model: whether a multi-step question reaches more than one
tool, whether the cap holds, whether a broken tool ends the conversation, and
whether every call is audited.
"""

import json

from app.agent.loop import DISCLAIMER, run_agent
from app.agent.tools import Toolbox, specs
from app.llm.base import LLMProvider, ToolInvocation, ToolRun


class ScriptedProvider(LLMProvider):
    """Calls the tools it was told to, in order, then answers.

    It implements `tool_loop` itself, the way a real provider does, so the
    thing under test is the toolbox and the auditing rather than a mock of
    them."""

    name = "scripted"

    def __init__(self, script: list[tuple[str, dict]], reply: str = "done") -> None:
        super().__init__("scripted-1")
        self.script = script
        self.reply = reply
        self.offered: list[str] = []

    def complete(self, system, prompt, max_tokens=1024):  # pragma: no cover - unused
        return ""

    def complete_structured(self, system, prompt, schema):  # pragma: no cover - unused
        raise NotImplementedError

    def answer_with_citations(self, system, question, documents):  # pragma: no cover - unused
        raise NotImplementedError

    def tool_loop(self, system, prompt, tools, execute, max_iterations=6):
        self.offered = [t.name for t in tools]
        run = ToolRun(text="", model=self.model)
        for i, (name, args) in enumerate(self.script):
            if i >= max_iterations:
                run.truncated = True
                run.text = "cut short"
                return run
            result = execute(name, args)
            run.calls.append(ToolInvocation(name, args, result))
        run.text = self.reply
        return run


class FakeEmbedder:
    model = "fake"

    def embed_query(self, text: str) -> list[float]:  # pragma: no cover - not reached here
        return [0.0] * 8


def test_multi_step_question_uses_more_than_one_tool(db_session):
    """The task's 'done when': a multi-step question reaches at least two tools."""
    provider = ScriptedProvider(
        [
            ("graph_neighbors", {"entity": "concept:micro-organism"}),
            ("classify_formulation", {"answers": {}}),
        ],
        reply=f"An answer.\n{DISCLAIMER}",
    )
    run = run_agent("Can I patent a fermented herbal drink?", provider, db_session, FakeEmbedder())

    assert len({c.name for c in run.calls}) >= 2
    assert run.text.endswith(DISCLAIMER)
    assert not run.truncated
    # Every tool in the box is offered to the model.
    assert set(provider.offered) == {t.name for t in specs()}


def test_the_cap_is_enforced_and_reported(db_session):
    provider = ScriptedProvider([("classify_formulation", {"answers": {}})] * 5)
    run = run_agent("…", provider, db_session, FakeEmbedder(), max_iterations=2)
    assert run.truncated, "a run that hits the cap must say so"
    assert len(run.calls) == 2


def test_every_tool_call_is_audited_without_the_question(db_session):
    from sqlalchemy import select

    from app.db.models import AuditEvent

    before = db_session.execute(
        select(AuditEvent).where(AuditEvent.session_id == "test-agent")
    ).all()
    provider = ScriptedProvider(
        [("classify_formulation", {"answers": {"external_no_claim": True}})]
    )
    run_agent(
        "a question with words in it", provider, db_session, FakeEmbedder(), session_id="test-agent"
    )

    rows = db_session.execute(
        select(AuditEvent).where(
            AuditEvent.session_id == "test-agent", AuditEvent.kind == "tool_call"
        )
    ).scalars()
    rows = list(rows)
    assert len(rows) == len(before) + 1
    payload = rows[-1].payload
    assert payload["tool"] == "classify_formulation"
    assert "a question with words in it" not in json.dumps(payload)

    db_session.execute(AuditEvent.__table__.delete().where(AuditEvent.session_id == "test-agent"))
    db_session.commit()


def test_an_unknown_tool_is_an_answer_not_a_crash(db_session):
    box = Toolbox(db_session, FakeEmbedder())
    assert box.run("no_such_tool", {}).startswith("error: no tool called")


def test_rule_table_tools_need_no_database_or_model(db_session):
    """The classifier and the ABS helper are pure tables, so the agent can use
    them even when retrieval finds nothing."""
    box = Toolbox(db_session, FakeEmbedder())
    step = json.loads(box.run("classify_formulation", {"answers": {"external_no_claim": True}}))
    assert step["result"]["category"] == "cosmetic"
    assert step["result"]["requires"][0]["cite"]["source_id"].startswith("in-")

    abs_step = json.loads(box.run("abs_check", {"answers": {"applicant_foreign": True}}))
    assert abs_step["next_question"] or abs_step["result"]
