"""
Scores the Stage 4 output with DeepEval, so the numbers sit on the same scale as
the 0.467 contextual-relevancy baseline from the original evaluation.

Five metrics, split by what each one needs:

  reference-free, run on every test case
    ContextualRelevancyMetric   is the retrieved context on topic
    FaithfulnessMetric          is the answer grounded in that context
    AnswerRelevancyMetric       does the answer address the question

  reference-required, run only where a verified expected_output exists
    ContextualPrecisionMetric   are relevant chunks ranked above irrelevant ones
    ContextualRecallMetric      did retrieval find what the answer needed

Expected outputs were read off the live pages and confirmed by
18-verify-facts.js. FloatCo deliberately has none: $900 is both the single
session price and the two-per-month membership, so any single reference answer
would be arguable - and that ambiguity is the defect under test.

  evals-deepeval/.venv/Scripts/python.exe evals-crawler/19-deepeval-score.py
"""

import json
import os
import pathlib
from collections import defaultdict

ROOT = pathlib.Path(__file__).resolve().parents[1]
RESULTS = pathlib.Path(__file__).resolve().parent / "results"

from dotenv import load_dotenv

load_dotenv(ROOT / ".env.local")
os.environ.setdefault("OPENAI_API_KEY", (os.environ.get("NEXT_PUBLIC_OPENAI_KEY") or "").strip())

from deepeval import evaluate
from deepeval.evaluate.configs import AsyncConfig, CacheConfig, DisplayConfig, ErrorConfig
from deepeval.metrics import (
    AnswerRelevancyMetric,
    ContextualPrecisionMetric,
    ContextualRecallMetric,
    ContextualRelevancyMetric,
    FaithfulnessMetric,
)
from deepeval.models import OpenAIModel
from deepeval.test_case import LLMTestCase

JUDGE = "gpt-4.1"


def main():
    src = RESULTS / "stage4.json"
    if not src.exists():
        raise SystemExit(f"missing {src} - run 17-stage4.js first")

    payload = json.loads(src.read_text(encoding="utf-8"))
    rows = payload["results"]
    print(f"loaded {len(rows)} rows from stage4.json")
    print(f"js-side spend so far: ${payload['meter']['usd']:.6f}\n")

    # cost_per_*_token makes DeepEval report exact spend; the default request
    # timeout was too short for gpt-4.1 on 9k-character contexts and the run
    # died with connection timeouts at concurrency 4.
    model = OpenAIModel(
        model=JUDGE,
        temperature=0,
        cost_per_input_token=2.0 / 1e6,
        cost_per_output_token=8.0 / 1e6,
        generation_kwargs={"timeout": 180},
    )

    # cases usable at all: must have retrieved something
    usable = [r for r in rows if r.get("retrieval_context")]
    with_ref = [r for r in usable if r.get("expected_output")]
    print(f"{len(usable)} cases with retrieval context")
    print(f"{len(with_ref)} of those carry a verified expected_output\n")

    def build(r, with_expected):
        return LLMTestCase(
            input=r["input"],
            actual_output=r["actual_output"],
            retrieval_context=r["retrieval_context"],
            expected_output=r["expected_output"] if with_expected else None,
        )

    display = DisplayConfig(show_indicator=False, print_results=False)
    cache = CacheConfig(write_cache=False, use_cache=False)
    aconf = AsyncConfig(max_concurrent=2)
    # a single slow judge call previously aborted the whole run; skip the case
    # instead and let the per-metric counts below reveal any gaps
    econf = ErrorConfig(ignore_errors=True)

    scores = defaultdict(lambda: defaultdict(list))

    # ---- reference-free pass, every case -----------------------------------
    print("pass 1/2 - reference-free metrics on all cases")
    free_cases = [build(r, False) for r in usable]
    res1 = evaluate(
        test_cases=free_cases,
        metrics=[
            ContextualRelevancyMetric(model=model, threshold=0.5),
            FaithfulnessMetric(model=model, threshold=0.7),
            AnswerRelevancyMetric(model=model, threshold=0.7),
        ],
        async_config=aconf,
        display_config=display,
        cache_config=cache,
        error_config=econf,
    )
    for r, tr in zip(usable, res1.test_results):
        for m in tr.metrics_data or []:
            if m.score is not None:
                scores[r["variant"]][m.name].append(m.score)

    # ---- reference-required pass -------------------------------------------
    if with_ref:
        print("\npass 2/2 - precision and recall on cases with a verified reference")
        ref_cases = [build(r, True) for r in with_ref]
        res2 = evaluate(
            test_cases=ref_cases,
            metrics=[
                ContextualPrecisionMetric(model=model, threshold=0.7),
                ContextualRecallMetric(model=model, threshold=0.7),
            ],
            async_config=aconf,
            display_config=display,
            cache_config=cache,
            error_config=econf,
        )
        for r, tr in zip(with_ref, res2.test_results):
            for m in tr.metrics_data or []:
                if m.score is not None:
                    scores[r["variant"]][m.name].append(m.score)

    # ---- report -------------------------------------------------------------
    labels = {}
    for r in rows:
        labels[r["variant"]] = r["label"]

    metric_names = sorted({m for v in scores.values() for m in v})
    print("\n" + "=" * 100)
    header = "variant".ljust(7) + "description".ljust(28)
    for m in metric_names:
        header += m.replace("Metric", "").replace("Contextual", "Ctx")[:12].rjust(14)
    print(header)
    print("=" * 100)

    out = {}
    for v in sorted(scores):
        line = v.ljust(7) + labels.get(v, "").ljust(28)
        out[v] = {"label": labels.get(v, "")}
        for m in metric_names:
            vals = scores[v].get(m, [])
            avg = sum(vals) / len(vals) if vals else float("nan")
            out[v][m] = None if not vals else round(avg, 4)
            line += (f"{avg:.3f}" if vals else "  -  ").rjust(14)
        print(line)
    print("=" * 100)

    for m in metric_names:
        n = len(scores[sorted(scores)[0]].get(m, []))
        print(f"  {m}: {n} cases per variant")

    judge_cost = 0.0
    for res in (r for r in (res1, locals().get("res2")) if r is not None):
        judge_cost += sum(
            (tr.metrics_data and sum(m.evaluation_cost or 0 for m in tr.metrics_data)) or 0
            for tr in res.test_results
        )
    print(f"\nDeepEval judge spend: ${judge_cost:.6f}")
    print(f"Stage 4 total:        ${payload['meter']['usd'] + judge_cost:.6f}")
    out["_spend"] = {"js_side": payload["meter"]["usd"], "deepeval_judge": judge_cost}

    (RESULTS / "deepeval-scores.json").write_text(json.dumps(out, indent=2), encoding="utf-8")
    print(f"\n-> {RESULTS / 'deepeval-scores.json'}")
    print(
        "\nNOTE: these use DeepEval's own metric implementations, so contextual\n"
        "relevancy here is comparable to the 0.467 baseline. The deterministic\n"
        "fact counts in stage4.json are separate and involve no judge."
    )


if __name__ == "__main__":
    main()
