"""
Re-runs the reference-free metrics that pass 1 of 19-deepeval-score.py failed to
produce, and fixes the two defects that made its output untrustworthy.

What went wrong before:
  - evaluate() returned ~20 results for 164 cases and zip() silently truncated,
    so scores were attributed to whichever rows happened to line up. The table
    looked complete but covered FloatCo only.
  - ErrorConfig(ignore_errors=True) swallowed every failure without logging, so
    a crash became a plausible wrong answer instead of an obvious error.

What this does differently:
  - batches of BATCH cases, asserting len(results) == len(batch) each time, so a
    short return raises instead of misaligning
  - per-case scores written to disk after every batch, keyed by site+variant+
    question, so a failure costs one batch rather than the whole run and a
    restart skips what is already scored
  - precision and recall are NOT recomputed; pass 2 completed correctly and its
    numbers are merged in from deepeval-scores.json

  evals-deepeval/.venv/Scripts/python.exe evals-crawler/20-score-pass1.py
"""

import json
import os
import pathlib
from collections import defaultdict

ROOT = pathlib.Path(__file__).resolve().parents[1]
RESULTS = pathlib.Path(__file__).resolve().parent / "results"
PARTIAL = RESULTS / "pass1-partial.json"

from dotenv import load_dotenv

load_dotenv(ROOT / ".env.local")
os.environ.setdefault("OPENAI_API_KEY", (os.environ.get("NEXT_PUBLIC_OPENAI_KEY") or "").strip())

from deepeval import evaluate
from deepeval.evaluate.configs import AsyncConfig, CacheConfig, DisplayConfig
from deepeval.metrics import (
    AnswerRelevancyMetric,
    ContextualRelevancyMetric,
    FaithfulnessMetric,
)
from deepeval.models import OpenAIModel
from deepeval.test_case import LLMTestCase

JUDGE = "gpt-4.1"
BATCH = 10


def key(r):
    return f"{r['site']}|{r['variant']}|{r['input']}"


def main():
    payload = json.loads((RESULTS / "stage4.json").read_text(encoding="utf-8"))
    rows = [r for r in payload["results"] if r.get("retrieval_context")]
    print(f"{len(rows)} cases to score")

    done = json.loads(PARTIAL.read_text(encoding="utf-8")) if PARTIAL.exists() else {}
    todo = [r for r in rows if key(r) not in done]
    print(f"{len(done)} already scored, {len(todo)} remaining\n")

    model = OpenAIModel(
        model=JUDGE,
        temperature=0,
        cost_per_input_token=2.0 / 1e6,
        cost_per_output_token=8.0 / 1e6,
        generation_kwargs={"timeout": 240, "max_tokens": 16000},
    )
    display = DisplayConfig(show_indicator=False, print_results=False)
    cache = CacheConfig(write_cache=False, use_cache=False)
    # the async path fails with "length limit was reached" while the synchronous
    # path scores the identical case fine - verified in 21-diagnose-judge.py
    aconf = AsyncConfig(run_async=False)

    spend = 0.0
    failed_batches = []

    for i in range(0, len(todo), BATCH):
        batch = todo[i : i + BATCH]
        cases = [
            LLMTestCase(
                input=r["input"],
                actual_output=r["actual_output"],
                retrieval_context=r["retrieval_context"],
            )
            for r in batch
        ]
        label = f"batch {i // BATCH + 1}/{(len(todo) + BATCH - 1) // BATCH}"
        try:
            res = evaluate(
                test_cases=cases,
                metrics=[
                    ContextualRelevancyMetric(model=model, threshold=0.5),
                    FaithfulnessMetric(model=model, threshold=0.7),
                    AnswerRelevancyMetric(model=model, threshold=0.7),
                ],
                async_config=aconf,
                display_config=display,
                cache_config=cache,
            )
        except Exception as e:
            print(f"{label}: FAILED {str(e)[:100]}")
            failed_batches.append(i // BATCH + 1)
            continue

        # the defect that produced the misleading table: a short return
        if len(res.test_results) != len(batch):
            print(f"{label}: LENGTH MISMATCH {len(res.test_results)} != {len(batch)} - discarding batch")
            failed_batches.append(i // BATCH + 1)
            continue

        scored = 0
        for r, tr in zip(batch, res.test_results):
            entry = {}
            for m in tr.metrics_data or []:
                if m.score is not None:
                    entry[m.name] = m.score
                spend_add = m.evaluation_cost or 0
                nonlocal_spend[0] += spend_add
            if entry:
                done[key(r)] = {"site": r["site"], "variant": r["variant"], **entry}
                scored += 1
        PARTIAL.write_text(json.dumps(done, indent=2), encoding="utf-8")
        print(f"{label}: {scored}/{len(batch)} scored, running spend ${nonlocal_spend[0]:.4f}")

    spend = nonlocal_spend[0]
    print(f"\nscored {len(done)}/{len(rows)} cases")
    if failed_batches:
        print(f"failed batches: {failed_batches}")

    # ---- merge with pass 2 (precision/recall), which completed correctly -----
    prev = json.loads((RESULTS / "deepeval-scores.json").read_text(encoding="utf-8"))

    agg = defaultdict(lambda: defaultdict(list))
    counts = defaultdict(lambda: defaultdict(int))
    for v in done.values():
        for m, s in v.items():
            if m in ("site", "variant"):
                continue
            agg[v["variant"]][m].append(s)
            counts[v["variant"]][m] += 1

    metrics = ["Contextual Relevancy", "Faithfulness", "Answer Relevancy"]
    print("\n" + "=" * 92)
    print("variant".ljust(7) + "description".ljust(28) + "".join(m[:14].rjust(16) for m in metrics) + "n".rjust(6))
    print("=" * 92)
    out = {}
    for v in sorted(agg):
        label = prev.get(v, {}).get("label", "")
        line = v.ljust(7) + label.ljust(28)
        out[v] = {"label": label}
        n = 0
        for m in metrics:
            vals = agg[v].get(m, [])
            n = max(n, len(vals))
            out[v][m] = round(sum(vals) / len(vals), 4) if vals else None
            line += (f"{sum(vals)/len(vals):.3f}" if vals else "  -  ").rjust(16)
        # carry the valid pass-2 numbers through unchanged
        for m in ("Contextual Precision", "Contextual Recall"):
            if prev.get(v, {}).get(m) is not None:
                out[v][m] = prev[v][m]
        line += str(n).rjust(6)
        print(line)
    print("=" * 92)
    print("Contextual Precision / Recall carried over from the pass that completed cleanly:")
    for v in sorted(out):
        print(f"  {v}  precision {out[v].get('Contextual Precision')}  recall {out[v].get('Contextual Recall')}")

    out["_spend"] = {
        "js_side": payload["meter"]["usd"],
        "deepeval_pass1_rerun": spend,
        "deepeval_pass1_failed_earlier": prev.get("_spend", {}).get("deepeval_judge"),
    }
    (RESULTS / "deepeval-final.json").write_text(json.dumps(out, indent=2), encoding="utf-8")
    print(f"\npass 1 re-run spend: ${spend:.6f}")
    print(f"-> {RESULTS / 'deepeval-final.json'}")


nonlocal_spend = [0.0]

if __name__ == "__main__":
    main()
