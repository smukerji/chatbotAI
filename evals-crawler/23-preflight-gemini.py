"""
Preflight for the Gemini judge. Proves, before any real run:

  - the key is present and works
  - deepeval can construct GeminiModel and reach the API
  - every metric we intend to use returns a score on a real case
  - the cost meter reports non-zero, so spend is measured not estimated
  - the settings that broke earlier runs are actually in effect

Costs roughly a cent. If anything here fails, the full run would have failed
too - which is the point.

  evals-deepeval/.venv/Scripts/python.exe evals-crawler/23-preflight-gemini.py
"""

import warnings
import logging
import evalconfig as cfg  # MUST come before deepeval - sets env at import time

# google-genai logs an automatic-function-calling advisory on every call; it is
# not relevant to us and drowns the actual results
logging.getLogger("google_genai.models").setLevel(logging.ERROR)
warnings.filterwarnings("ignore", message=".*automatic function calling.*")

import json
import os

from deepeval.metrics import (
    AnswerRelevancyMetric,
    ContextualPrecisionMetric,
    ContextualRecallMetric,
    ContextualRelevancyMetric,
    FaithfulnessMetric,
)
from deepeval.test_case import LLMTestCase

FAILED = []


def ok(msg):
    print(f"  PASS  {msg}")


def bad(msg):
    print(f"  FAIL  {msg}")
    FAILED.append(msg)


def main():
    keys = cfg.banner()
    print()

    # ── 1. settings actually applied ─────────────────────────────────────────
    print("1. settings in effect")
    expect = {
        "DEEPEVAL_TELEMETRY_OPT_OUT": "1",
        "ENABLE_DEEPEVAL_CACHE": "0",
        "IGNORE_DEEPEVAL_ERRORS": "0",
        "SKIP_DEEPEVAL_MISSING_PARAMS": "1",
    }
    for k, v in expect.items():
        got = os.environ.get(k)
        ok(f"{k}={got}") if got == v else bad(f"{k}={got} expected {v}")

    # ── 2. keys ──────────────────────────────────────────────────────────────
    print("\n2. credentials")
    # not `cond and ok(...) or bad(...)` - ok() returns None, so the or-branch
    # always fired and reported present keys as missing
    if keys["google"]:
        ok("GOOGLE_API_KEY present")
    else:
        bad("GOOGLE_API_KEY missing")
    if keys["openai"]:
        ok("OPENAI_API_KEY present")
    else:
        bad("OPENAI_API_KEY missing")

    if not keys["google"]:
        print("\nno Google key - stopping before spending anything")
        return

    # ── 3. judge reachable ───────────────────────────────────────────────────
    print("\n3. judge model")
    try:
        model = cfg.judge()
        reply = model.generate("Reply with exactly one word: ready")
        text = reply[0] if isinstance(reply, tuple) else reply
        ok(f'{cfg.JUDGE_MODEL} responded: "{str(text).strip()[:40]}"')
    except Exception as e:
        bad(f"{cfg.JUDGE_MODEL}: {str(e)[:160]}")
        print("\njudge unreachable - stopping")
        return

    # ── 4. every metric on a real case ───────────────────────────────────────
    print("\n4. metrics on a real retrieved case")
    src = cfg.RESULTS / "stage4.json"
    if src.exists():
        rows = json.loads(src.read_text(encoding="utf-8"))["results"]
        case = next((r for r in rows if r.get("retrieval_context") and r.get("expected_output")), None)
        if case is None:
            case = next(r for r in rows if r.get("retrieval_context"))
        tc = LLMTestCase(
            input=case["input"],
            actual_output=case["actual_output"],
            retrieval_context=case["retrieval_context"],
            expected_output=case.get("expected_output"),
        )
        print(f'  case: "{case["input"]}"  ({len(case["retrieval_context"])} chunks)')
    else:
        tc = LLMTestCase(
            input="What is the capital of France?",
            actual_output="Paris is the capital of France.",
            retrieval_context=["France is a country in Europe. Its capital city is Paris."],
            expected_output="The capital of France is Paris.",
        )
        print("  (stage4.json absent - using a synthetic case)")

    spend = 0.0
    for cls, name, needs_ref in (
        (ContextualRelevancyMetric, "Contextual Relevancy", False),
        (FaithfulnessMetric, "Faithfulness", False),
        (AnswerRelevancyMetric, "Answer Relevancy", False),
        (ContextualPrecisionMetric, "Contextual Precision", True),
        (ContextualRecallMetric, "Contextual Recall", True),
    ):
        if needs_ref and not tc.expected_output:
            print(f"  SKIP  {name} (no expected_output on this case)")
            continue
        try:
            m = cls(model=cfg.judge(), threshold=0.5)
            m.measure(tc)
            spend += m.evaluation_cost or 0
            ok(f"{name:<22} score {m.score:.3f}   cost ${m.evaluation_cost or 0:.6f}")
        except Exception as e:
            bad(f"{name}: {str(e)[:150]}")

    # ── 5. cost meter non-zero ───────────────────────────────────────────────
    print("\n5. cost metering")
    if spend > 0:
        ok(f"metered ${spend:.6f} across the metrics above")
    else:
        bad("evaluation_cost came back zero - spend would be unmeasurable")

    print("\n" + "=" * 68)
    if FAILED:
        print(f"RESULT: {len(FAILED)} FAILURES - do not start the run")
        for f in FAILED:
            print(f"  - {f}")
    else:
        print("RESULT: all checks passed - safe to start Stage A")
    print("=" * 68)


if __name__ == "__main__":
    main()
