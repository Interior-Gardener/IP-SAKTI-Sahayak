"""Evaluation harness: the four things the problem statement scores, plus retrieval.

    python eval/run.py --provider groq            # everything, writes eval/runs/<date>-groq.json
    python eval/run.py --only retrieval --limit 10
    python eval/run.py --smoke                    # the CI subset

Runners (PLAN.md stage 1, "Eval harness v1"):
  retrieval     recall@8: an expected (source, locator) is among the top 8 hits
  citation      every shown citation verified AND an expected provision is cited
  accuracy      judge model grades the answer against the item's key points (0 / 0.5 / 1)
  abstention    out-of-scope / medical / unsafe items abstain; in-scope items do not
  multilingual  a non-English twin reaches the same conclusion as its English item
                (judge), plus chrF of the answer against the twin's reference if given

Run from the repo root with the API's virtualenv; the API code is imported directly.
"""

import argparse
import json
import os
import sys
import time
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import date
from pathlib import Path
from typing import Literal

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "api"))

from pydantic import BaseModel, Field  # noqa: E402

GOLDEN = ROOT / "eval" / "golden"
RUNS = ROOT / "eval" / "runs"
TARGETS = {
    "retrieval_recall_at_8": 0.85,
    "citation_correctness": 0.95,
    "judge_accuracy": 0.80,
    "abstention_rate": 0.95,
    "false_abstention_rate": 0.10,  # at most
    "multilingual_agreement": 0.85,
}


class Expected(BaseModel):
    """What a correct answer must rest on, per jurisdiction. Locators match by prefix,
    so "s.3" accepts a chunk located at "s.3(k)–(p)"."""

    sources: list[str] = Field(default_factory=list)
    locators: list[str] = Field(default_factory=list)


class Item(BaseModel):
    id: str
    question: str
    language: str = "en"
    jurisdiction_mode: Literal["IN", "INTL", "BOTH"] = "IN"
    category: Literal["in_scope", "out_of_scope", "medical_advice", "unsafe"] = (
        "in_scope"
    )
    material_kind: Literal["plant", "microbe", "animal", "mineral"] | None = None
    expected: dict[Literal["IN", "INTL"], Expected] = Field(default_factory=dict)
    key_points: list[str] = Field(default_factory=list, description="for the judge")
    twin_of: str | None = None
    reference_answer: str | None = Field(
        default=None, description="for chrF, same language"
    )
    verified_by: str = Field(
        description="who checked the expected locators against the corpus"
    )


def load_items(paths: list[Path]) -> list[Item]:
    items = []
    for path in paths:
        for n, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
            if line.strip():
                try:
                    items.append(Item.model_validate_json(line))
                except Exception as e:
                    raise SystemExit(f"{path.name}:{n}: {e}") from e
    ids = [i.id for i in items]
    if len(ids) != len(set(ids)):
        raise SystemExit("duplicate item ids in golden set")
    return items


# ------------------------------------------------------------------ scoring helpers


from app.retrieval.hybrid import locator_matches  # noqa: E402  (one definition, shared)


def hit_expected(exp: Expected, source_id: str, locator: str) -> bool:
    source_ok = not exp.sources or source_id in exp.sources
    locator_ok = not exp.locators or any(
        locator_matches(e, locator) for e in exp.locators
    )
    return source_ok and locator_ok


def chrf(hypothesis: str, reference: str, n: int = 6, beta: float = 2.0) -> float:
    """Character n-gram F-score (Popović 2015), whitespace removed, averaged over n=1..6."""
    hyp, ref = "".join(hypothesis.split()), "".join(reference.split())
    precisions, recalls = [], []
    for k in range(1, n + 1):
        h = defaultdict(int)
        r = defaultdict(int)
        for i in range(len(hyp) - k + 1):
            h[hyp[i : i + k]] += 1
        for i in range(len(ref) - k + 1):
            r[ref[i : i + k]] += 1
        overlap = sum(min(c, r[g]) for g, c in h.items())
        if sum(h.values()):
            precisions.append(overlap / sum(h.values()))
        if sum(r.values()):
            recalls.append(overlap / sum(r.values()))
    if not precisions or not recalls:
        return 0.0
    p, rc = sum(precisions) / len(precisions), sum(recalls) / len(recalls)
    return 0.0 if p + rc == 0 else (1 + beta**2) * p * rc / (beta**2 * p + rc)


class Grade(BaseModel):
    score: Literal[0, 0.5, 1] = Field(
        description="1 all key points correct, 0.5 partly, 0 wrong or missing"
    )
    reason: str


class Agreement(BaseModel):
    same_conclusion: bool
    reason: str


JUDGE_SYSTEM = (
    "You grade answers from a legal information assistant. Compare the answer with the key "
    "points. Judge substance, not wording or language. An answer that correctly says the "
    "sources are insufficient gets 0 unless the key points say that is correct."
)
AGREE_SYSTEM = (
    "Two answers to the same question were written in different languages. Say whether they "
    "reach the same legal conclusion and rely on the same provisions."
)


# ------------------------------------------------------------------ the run


@dataclass
class Result:
    item: str
    metrics: dict[str, float | None] = field(default_factory=dict)
    notes: list[str] = field(default_factory=list)
    seconds: float = 0.0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--provider", default=os.environ.get("LLM_PROVIDER_ANSWER", "groq")
    )
    parser.add_argument("--only", choices=["retrieval", "full"], default="full")
    parser.add_argument("--limit", type=int)
    parser.add_argument("--smoke", action="store_true", help="the 15-item CI subset")
    parser.add_argument("--files", nargs="*", type=Path)
    parser.add_argument(
        "--resume", type=Path, help="a partial run file: skip items already scored"
    )
    parser.add_argument(
        "--tag", default="", help="added to the result file name so runs never overwrite each other"
    )
    args = parser.parse_args()

    os.environ["LLM_PROVIDER_ANSWER"] = args.provider
    from app import services
    from app.ask.pipeline import AskRequest, Services, run
    from app.db import SessionLocal
    from app.retrieval.hybrid import search

    files = args.files or sorted(GOLDEN.glob("*.jsonl"))
    items = load_items(files)
    if args.smoke:
        items = [
            i for i in items if i.id in set((GOLDEN / "smoke.txt").read_text().split())
        ]
    if args.limit:
        items = items[: args.limit]
    by_id = {i.id: i for i in items}

    embedder = services.embedder()
    reranker = services.reranker()
    svc = None
    judge = None
    if args.only == "full":
        from app.llm.router import get_provider

        svc = Services(
            SessionLocal,
            services.answer_llm(),
            services.fast_llm(),
            embedder,
            reranker,
            "eval",
        )
        judge = get_provider("judge")

    results: list[Result] = []
    answers: dict[str, object] = {}
    done: set[str] = set()
    if args.resume and args.resume.exists():
        previous = json.loads(args.resume.read_text(encoding="utf-8"))
        for r in previous["results"]:
            if not any(n.startswith("error:") for n in r["notes"]):
                results.append(
                    Result(r["item"], r["metrics"], r["notes"], r["seconds"])
                )
                done.add(r["item"])
        print(f"resuming: {len(done)} items already scored")
    # The item count (or --tag) keeps a small re-run from overwriting a full run's results.
    tag = f"-{args.tag}" if args.tag else f"-{len(items)}items"
    partial = RUNS / f"{date.today().isoformat()}-{args.provider}{tag}-partial.json"

    def save_partial() -> None:
        RUNS.mkdir(parents=True, exist_ok=True)
        partial.write_text(json.dumps({"provider": args.provider, "results": [r.__dict__ for r in results]},
                                      indent=2, ensure_ascii=False), encoding="utf-8")  # fmt: skip

    for item in items:
        if item.id in done:
            continue
        t = time.perf_counter()
        res = Result(item.id)
        # 1. retrieval
        # Non-English items are translated inside the pipeline, so retrieval is scored there.
        if item.category == "in_scope" and item.expected and item.language == "en":
            with SessionLocal() as session:
                found = []
                for j, exp in item.expected.items():
                    hits = search(
                        session, item.question, j, embedder, reranker, top_k=8
                    )
                    found.append(
                        any(hit_expected(exp, h.source_id, h.locator) for h in hits)
                    )
            res.metrics["retrieval"] = float(all(found))

        if svc is not None:
            try:
                events = list(run(AskRequest(question=item.question, language=item.language,
                                             jurisdiction_mode=item.jurisdiction_mode), svc))  # fmt: skip
            except Exception as e:  # noqa: BLE001 - e.g. provider rate limit: keep what we have
                res.notes.append(f"error: {type(e).__name__}: {str(e)[:200]}")
                results.append(res)
                save_partial()
                print(
                    f"{item.id:28} ERROR {type(e).__name__} — stopping; rerun with --resume {partial.as_posix()}"
                )
                break
            env = events[-1].data
            trace = next((e.data for e in events if e.name == "trace"), None)
            answers[item.id] = env
            # Why it came out this way, so a wrong abstention can be diagnosed from the run file.
            if env.abstained:
                res.notes.append(f"abstained: {env.abstained.reason}")
            for a in env.answers:
                res.notes.append(
                    f"{a.jurisdiction} confidence {a.confidence.band} {a.confidence.score}: {'; '.join(a.confidence.reasons)}"
                )
            if trace is not None:
                res.notes.extend(
                    f"{j} flag: {f}" for j, fl in trace.flags.items() for f in fl
                )
            abstained = env.abstained is not None
            # 4. abstention
            if item.category == "in_scope":
                res.metrics["false_abstention"] = float(abstained)
            else:
                res.metrics["abstention"] = float(abstained)

            if item.category == "in_scope" and not abstained:
                # 3. citation correctness
                ok = True
                for a in env.answers:
                    exp = item.expected.get(a.jurisdiction)
                    all_verified = all(c.verified for c in a.citations) and bool(
                        a.citations
                    )
                    expected_cited = exp is None or any(
                        hit_expected(exp, c.source_id, c.locator) for c in a.citations
                    )
                    ok = ok and all_verified and expected_cited
                res.metrics["citation"] = float(ok)
                # 2. accuracy
                if item.key_points and judge is not None:
                    body = "\n\n".join(
                        f"[{a.jurisdiction}]\n{a.markdown}" for a in env.answers
                    )
                    prompt = (
                        f"Question: {item.question}\n\nKey points:\n- "
                        + "\n- ".join(item.key_points)
                        + f"\n\nAnswer:\n{body}"
                    )
                    try:
                        grade = judge.complete_structured(JUDGE_SYSTEM, prompt, Grade)
                        res.metrics["accuracy"] = float(grade.score)
                        res.notes.append(f"judge: {grade.reason}")
                    except Exception as e:  # noqa: BLE001
                        res.notes.append(f"judge failed: {e}")
        res.seconds = round(time.perf_counter() - t, 2)
        results.append(res)
        save_partial()
        print(f"{item.id:28} {json.dumps(res.metrics)}", flush=True)

    # 5. multilingual, once both twins have answers
    if judge is not None:
        for item in items:
            twin = by_id.get(item.twin_of or "")
            if not twin or item.id not in answers or twin.id not in answers:
                continue
            a, b = answers[item.id], answers[twin.id]
            res = next(r for r in results if r.item == item.id)
            prompt = (
                "Answer 1:\n"
                + "\n".join(x.markdown for x in a.answers)
                + "\n\nAnswer 2:\n"
                + "\n".join(x.markdown for x in b.answers)
            )
            try:
                verdict = judge.complete_structured(AGREE_SYSTEM, prompt, Agreement)
                res.metrics["multilingual"] = float(verdict.same_conclusion)
            except Exception as e:  # noqa: BLE001
                res.notes.append(f"agreement judge failed: {e}")
            if item.reference_answer:
                res.metrics["chrf"] = round(
                    chrf(
                        " ".join(x.markdown for x in a.answers), item.reference_answer
                    ),
                    3,
                )

    def mean(key: str) -> float | None:
        vals = [r.metrics[key] for r in results if r.metrics.get(key) is not None]
        return round(sum(vals) / len(vals), 3) if vals else None

    summary = {
        "retrieval_recall_at_8": mean("retrieval"),
        "citation_correctness": mean("citation"),
        "judge_accuracy": mean("accuracy"),
        "abstention_rate": mean("abstention"),
        "false_abstention_rate": mean("false_abstention"),
        "multilingual_agreement": mean("multilingual"),
        "chrf": mean("chrf"),
    }
    out = {
        "date": date.today().isoformat(),
        "provider": args.provider,
        "models": {
            "answer": svc.answer_llm.model if svc else None,
            "judge": judge.model if judge else None,
        },
        "embed_model": embedder.model,
        "reranker": getattr(reranker, "model", None),
        "items": len(items),
        "summary": summary,
        "targets": TARGETS,
        "results": [r.__dict__ for r in results],
    }
    RUNS.mkdir(parents=True, exist_ok=True)
    name = f"{out['date']}-{args.provider}{tag}{'-retrieval' if args.only == 'retrieval' else ''}.json"
    (RUNS / name).write_text(
        json.dumps(out, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print("\n" + json.dumps(summary, indent=2))
    print(f"wrote eval/runs/{name}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
