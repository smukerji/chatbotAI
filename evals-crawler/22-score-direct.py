"""
Scores the reference-free metrics by calling metric.measure() directly.

DeepEval's evaluate() fails on this data with "Could not parse response content
as the length limit was reached", both async and with run_async=False, while
21-diagnose-judge.py showed the identical case scoring cleanly through
metric.measure(). So evaluate() is bypassed rather than fought.

Design follows from what already went wrong once: results are written after
every case and keyed by site+variant+question, so a crash costs one case, a
restart resumes, and no spend is repeated. Failures are recorded per case
instead of being swallowed - the earlier run's ignore_errors turned a broken
pass into a plausible-looking table covering only FloatCo.

  evals-deepeval/.venv/Scripts/python.exe evals-crawler/22-score-direct.py
"""

import json
import os
import pathlib
import threading
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed

ROOT = pathlib.Path(__file__).resolve().parents[1]
RESULTS = pathlib.Path(__file__).resolve().parent / "results"
PARTIAL = RESULTS / "pass1-direct.json"

from dotenv import load_dotenv

load_dotenv(ROOT / ".env.local")
os.environ.setdefault("OPENAI_API_KEY", (os.environ.get("NEXT_PUBLIC_OPENAI_KEY") or "").strip())

from deepeval.metrics import (
    AnswerRelevancyMetric,
    ContextualRelevancyMetric,
    FaithfulnessMetric,
)
from deepeval.models import OpenAIModel
from deepeval.test_case import LLMTestCase

JUDGE = "gpt-4.1"
WORKERS = 3

lock = threading.Lock()
state = {"done": {}, "spend": 0.0, "failed": []}


def key(r):
    return f"{r['site']}|{r['variant']}|{r['input']}"


def score_case(r):
    model = OpenAIModel(
        model=JUDGE,
        temperature=0,
        cost_per_input_token=2.0 / 1e6,
        cost_per_output_token=8.0 / 1e6,
        generation_kwargs={"timeout": 240},
    )
    tc = LLMTestCase(
        input=r["input"],
        actual_output=r["actual_output"],
        retrieval_context=r["retrieval_context"],
    )
    entry = {"site": r["site"], "variant": r["variant"]}
    cost = 0.0
    errors = []
    for cls, name in (
        (ContextualRelevancyMetric, "Contextual Relevancy"),
        (FaithfulnessMetric, "Faithfulness"),
        (AnswerRelevancyMetric, "Answer Relevancy"),
    ):
        try:
            m = cls(model=model, threshold=0.5)
            m.measure(tc)
            if m.score is not None:
                entry[name] = m.score
            cost += m.evaluation_cost or 0
        except Exception as e:
            errors.append(f"{name}: {str(e)[:80]}")
    return r, entry, cost, errors


def main():
    payload = json.loads((RESULTS / "stage4.json").read_text(encoding="utf-8"))
    rows = [r for r in payload["results"] if r.get("retrieval_context")]

    # Stratified but PAIRED: choose N questions, then score all four variants of
    # each. Comparing variants on identical inputs removes sampling noise
    # between them, which independent random sampling would not.
    # Questions carrying a verified fact are taken first - they are the ones
    # that can also be checked without a judge.
    QUESTIONS = int(os.environ.get("SCORE_QUESTIONS", "20"))
    by_q = defaultdict(list)
    for r in rows:
        by_q[(r["site"], r["input"])].append(r)

    ranked = sorted(
        by_q.keys(),
        key=lambda k: (
            -max(x.get("factsExpected", 0) for x in by_q[k]),  # fact-bearing first
            k[0],                                              # then spread by site
            k[1],
        ),
    )
    # round-robin across sites so one site cannot dominate the sample
    per_site = defaultdict(list)
    for k in ranked:
        per_site[k[0]].append(k)
    chosen, i = [], 0
    while len(chosen) < QUESTIONS and any(per_site.values()):
        for site in sorted(per_site):
            if per_site[site] and len(chosen) < QUESTIONS:
                chosen.append(per_site[site].pop(0))
        i += 1
        if i > 50:
            break

    selected = set(chosen)
    rows = [r for r in rows if (r["site"], r["input"]) in selected]
    sites_covered = sorted({s for s, _ in selected})
    print(f"stratified sample: {len(selected)} questions x 4 variants = {len(rows)} cases")
    print(f"sites covered: {', '.join(sites_covered)}")
    print(f"questions with a verified fact: {sum(1 for k in selected if max(x.get('factsExpected',0) for x in by_q[k]) > 0)}\n")

    if PARTIAL.exists():
        prev = json.loads(PARTIAL.read_text(encoding="utf-8"))
        state["done"] = prev.get("done", {})
        state["spend"] = prev.get("spend", 0.0)

    todo = [r for r in rows if key(r) not in state["done"]]
    print(f"{len(rows)} cases total, {len(state['done'])} already scored, {len(todo)} to do")
    print(f"judge {JUDGE}, {WORKERS} workers, resumable\n")

    n = 0
    with ThreadPoolExecutor(max_workers=WORKERS) as pool:
        futures = {pool.submit(score_case, r): r for r in todo}
        for fut in as_completed(futures):
            n += 1
            try:
                r, entry, cost, errors = fut.result()
            except Exception as e:
                print(f"  [{n}/{len(todo)}] worker crashed: {str(e)[:80]}")
                continue
            with lock:
                metrics_got = [k for k in entry if k not in ("site", "variant")]
                if metrics_got:
                    state["done"][key(r)] = entry
                else:
                    state["failed"].append({"key": key(r), "errors": errors})
                state["spend"] += cost
                PARTIAL.write_text(json.dumps(state, indent=2), encoding="utf-8")
            if n % 10 == 0 or not metrics_got:
                print(
                    f"  [{n}/{len(todo)}] {r['site']} {r['variant']}  "
                    f"{len(metrics_got)}/3 metrics  ${state['spend']:.4f}"
                    + (f"  ERR {errors[0]}" if errors else "")
                )

    done = state["done"]
    print(f"\nscored {len(done)}/{len(rows)} cases   failures {len(state['failed'])}")

    agg = defaultdict(lambda: defaultdict(list))
    for v in done.values():
        for m, s in v.items():
            if m not in ("site", "variant"):
                agg[v["variant"]][m].append(s)

    prev_scores = {}
    p = RESULTS / "deepeval-scores.json"
    if p.exists():
        prev_scores = json.loads(p.read_text(encoding="utf-8"))

    metrics = ["Contextual Relevancy", "Faithfulness", "Answer Relevancy"]
    print("\n" + "=" * 96)
    print("variant".ljust(7) + "description".ljust(28) + "".join(m[:15].rjust(17) for m in metrics) + "n".rjust(6))
    print("=" * 96)
    out = {}
    for v in sorted(agg):
        label = prev_scores.get(v, {}).get("label", "")
        out[v] = {"label": label}
        line = v.ljust(7) + label.ljust(28)
        n_cases = 0
        for m in metrics:
            vals = agg[v].get(m, [])
            n_cases = max(n_cases, len(vals))
            out[v][m] = round(sum(vals) / len(vals), 4) if vals else None
            line += (f"{sum(vals)/len(vals):.3f}" if vals else "  -  ").rjust(17)
        for m in ("Contextual Precision", "Contextual Recall"):
            if prev_scores.get(v, {}).get(m) is not None:
                out[v][m] = prev_scores[v][m]
        print(line + str(n_cases).rjust(6))
    print("=" * 96)
    print("precision / recall carried from the pass that completed cleanly (8 cases each):")
    for v in sorted(out):
        print(f"  {v}  precision {out[v].get('Contextual Precision')}   recall {out[v].get('Contextual Recall')}")

    out["_spend"] = {
        "js_retrieval_generation": payload["meter"]["usd"],
        "deepeval_direct": state["spend"],
        "deepeval_failed_run_earlier": prev_scores.get("_spend", {}).get("deepeval_judge"),
    }
    (RESULTS / "deepeval-final.json").write_text(json.dumps(out, indent=2), encoding="utf-8")
    print(f"\nthis run: ${state['spend']:.6f}")
    print(f"-> {RESULTS / 'deepeval-final.json'}")


if __name__ == "__main__":
    main()
