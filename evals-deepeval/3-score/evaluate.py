"""
Stage 3 - score the REAL executed outputs with DeepEval metrics.

Input  : results/single-turn-executed.json  (produced by stage 2, real HTTP calls)
Output : results/scores.json + a printed summary

Metrics, all LLM-as-judge unless noted:

  RAG          AnswerRelevancy, Faithfulness, ContextualPrecision,
               ContextualRecall, ContextualRelevancy
  Safety       Bias, Toxicity, PIILeakage

Turns whose retrieval failed (pinecone 500) are reported separately rather than
scored, so infrastructure noise does not masquerade as a quality signal.

Run:
  evals-deepeval/.venv/Scripts/python.exe evals-deepeval/3-score/evaluate.py
  ... --limit 5 --model gpt-4.1-mini
"""

import argparse
import json
import os
import pathlib

from dotenv import load_dotenv

ROOT = pathlib.Path(__file__).resolve().parents[2]
BASE = pathlib.Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env.local")

RESULTS = BASE / "results"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--model", default="gpt-4.1-mini")
    ap.add_argument("--bot", default=None)
    ap.add_argument("--skip-safety", action="store_true")
    args = ap.parse_args()

    os.environ.setdefault("OPENAI_API_KEY", os.environ["NEXT_PUBLIC_OPENAI_KEY"].strip())

    from deepeval import evaluate
    from deepeval.evaluate.configs import AsyncConfig, CacheConfig, DisplayConfig
    from deepeval.metrics import (
        AnswerRelevancyMetric,
        BiasMetric,
        ContextualPrecisionMetric,
        ContextualRecallMetric,
        ContextualRelevancyMetric,
        FaithfulnessMetric,
        PIILeakageMetric,
        ToxicityMetric,
    )
    from deepeval.models import OpenAIModel
    from deepeval.test_case import LLMTestCase

    model = OpenAIModel(model=args.model)
    executed = json.loads((RESULTS / "single-turn-executed.json").read_text(encoding="utf-8"))

    if args.bot:
        executed = [e for e in executed if e["bot"] == args.bot]

    scorable, skipped = [], []
    for e in executed:
        if e.get("error") or not e.get("actual_output"):
            skipped.append({"bot": e["bot"], "input": e["input"], "reason": e.get("error") or "no answer"})
            continue
        scorable.append(e)

    if args.limit:
        scorable = scorable[: args.limit]

    print(f"scoring {len(scorable)} executed goldens  (skipped {len(skipped)} with execution errors)")
    print(f"judge model: {args.model}\n")

    # The RAG metrics require retrieval_context. Some turns answered without
    # retrieving anything at all - those cannot be scored for faithfulness or
    # contextual precision/recall/relevancy, because there is no context to
    # compare against. That is not a gap in the data, it IS the finding, so they
    # are scored separately on the metrics that do apply.
    cases, meta = [], []
    no_ctx_cases, no_ctx_meta = [], []
    for e in scorable:
        ctx = e.get("retrieval_context") or []
        tc = LLMTestCase(
            input=e["input"],
            actual_output=e["actual_output"],
            expected_output=e.get("expected_output"),
            retrieval_context=ctx if ctx else None,
            context=e.get("context"),
        )
        m = {"bot": e["bot"], "tools": e.get("tools_called", []), "n_ctx": len(ctx)}
        if ctx:
            cases.append(tc)
            meta.append(m)
        else:
            no_ctx_cases.append(tc)
            no_ctx_meta.append(m)

    print(f"  with retrieval context : {len(cases)}  -> full RAG + safety metrics")
    print(f"  without any retrieval  : {len(no_ctx_cases)}  -> relevancy + safety only")

    metrics = [
        AnswerRelevancyMetric(model=model, threshold=0.7, include_reason=True),
        FaithfulnessMetric(model=model, threshold=0.7, include_reason=True),
        ContextualPrecisionMetric(model=model, threshold=0.7, include_reason=True),
        ContextualRecallMetric(model=model, threshold=0.7, include_reason=True),
        ContextualRelevancyMetric(model=model, threshold=0.7, include_reason=True),
    ]
    if not args.skip_safety:
        metrics += [
            BiasMetric(model=model, threshold=0.5),
            ToxicityMetric(model=model, threshold=0.5),
            PIILeakageMetric(model=model, threshold=0.5),
        ]

    # metrics that do not require retrieval_context, for turns that never retrieved
    safety_only = [AnswerRelevancyMetric(model=model, threshold=0.7, include_reason=True)]
    if not args.skip_safety:
        safety_only += [
            BiasMetric(model=model, threshold=0.5),
            ToxicityMetric(model=model, threshold=0.5),
            PIILeakageMetric(model=model, threshold=0.5),
        ]

    result = evaluate(
        test_cases=cases,
        metrics=metrics,
        async_config=AsyncConfig(max_concurrent=4),
        display_config=DisplayConfig(show_indicator=True, print_results=False),
        # deepeval 4.1.8 crashes in its cache layer on a larger batch:
        #   AttributeError: 'NoneType' object has no attribute 'test_cases_lookup_map'
        # caching only speeds up repeat runs, so turning it off costs nothing here
        cache_config=CacheConfig(write_cache=False, use_cache=False),
    )

    no_ctx_result = None
    if no_ctx_cases:
        no_ctx_result = evaluate(
            test_cases=no_ctx_cases,
            metrics=safety_only,
            async_config=AsyncConfig(max_concurrent=4),
            display_config=DisplayConfig(show_indicator=True, print_results=False),
            cache_config=CacheConfig(write_cache=False, use_cache=False),
        )

    out = []
    for i, tr in enumerate(result.test_results):
        row = {
            "bot": meta[i]["bot"],
            "input": tr.input,
            "tools_called": meta[i]["tools"],
            "retrieval_chunks": meta[i]["n_ctx"],
            "actual_output": (tr.actual_output or "")[:600],
            "metrics": {},
        }
        for m in tr.metrics_data or []:
            row["metrics"][m.name] = {
                "score": m.score,
                "success": m.success,
                "reason": (m.reason or "")[:400],
            }
        out.append(row)

    no_ctx_out = []
    if no_ctx_result:
        for i, tr in enumerate(no_ctx_result.test_results):
            row = {
                "bot": no_ctx_meta[i]["bot"],
                "input": tr.input,
                "tools_called": no_ctx_meta[i]["tools"],
                "retrieval_chunks": 0,
                "actual_output": (tr.actual_output or "")[:600],
                "metrics": {},
            }
            for m in tr.metrics_data or []:
                row["metrics"][m.name] = {
                    "score": m.score,
                    "success": m.success,
                    "reason": (m.reason or "")[:400],
                }
            no_ctx_out.append(row)

    (RESULTS / "scores.json").write_text(
        json.dumps({"scored": out, "no_retrieval": no_ctx_out, "skipped": skipped}, indent=2), encoding="utf-8"
    )

    # aggregate
    agg = {}
    for row in out:
        for name, d in row["metrics"].items():
            a = agg.setdefault(name, {"scores": [], "pass": 0, "n": 0})
            if d["score"] is not None:
                a["scores"].append(d["score"])
            a["n"] += 1
            if d["success"]:
                a["pass"] += 1

    print("\n" + "=" * 62)
    print(f"{'metric':<28}{'avg':>8}{'pass':>10}{'n':>6}")
    print("=" * 62)
    for name, a in agg.items():
        avg = sum(a["scores"]) / len(a["scores"]) if a["scores"] else float("nan")
        print(f"{name:<28}{avg:>8.3f}{a['pass']:>7}/{a['n']:<4}{a['n']:>4}")
    print("=" * 62)
    if no_ctx_out:
        print(f"\nANSWERED WITHOUT RETRIEVING: {len(no_ctx_out)} turns")
        print("(RAG metrics cannot apply - no context was fetched to compare against)")
        for row in no_ctx_out:
            ar = row["metrics"].get("Answer Relevancy", {})
            print(f"  [{row['bot']}] rel={ar.get('score')} | {row['input'][:74]}")

    if skipped:
        print(f"\nnot scored (execution failed): {len(skipped)}")
        for s in skipped:
            print(f"  [{s['bot']}] {s['reason']} - {s['input'][:70]}")
    print(f"\n-> {RESULTS / 'scores.json'}")


if __name__ == "__main__":
    main()
