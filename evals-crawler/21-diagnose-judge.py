"""
The judge fails with "Could not parse response content as the length limit was
reached". Raising max_tokens via generation_kwargs did not change it, so find
out what is actually capping the output before spending more.

  evals-deepeval/.venv/Scripts/python.exe evals-crawler/21-diagnose-judge.py
"""

import json
import os
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
RESULTS = pathlib.Path(__file__).resolve().parent / "results"

from dotenv import load_dotenv

load_dotenv(ROOT / ".env.local")
os.environ.setdefault("OPENAI_API_KEY", (os.environ.get("NEXT_PUBLIC_OPENAI_KEY") or "").strip())

from deepeval.metrics import ContextualRelevancyMetric, FaithfulnessMetric, AnswerRelevancyMetric
from deepeval.models import OpenAIModel
from deepeval.test_case import LLMTestCase

rows = json.loads((RESULTS / "stage4.json").read_text(encoding="utf-8"))["results"]
case = next(r for r in rows if r.get("retrieval_context"))

ctx_chars = sum(len(c) for c in case["retrieval_context"])
print(f"case: {case['site']} {case['variant']}")
print(f"question: {case['input']}")
print(f"retrieval_context: {len(case['retrieval_context'])} chunks, {ctx_chars} chars\n")

# does generation_kwargs reach the request at all?
model = OpenAIModel(
    model="gpt-4.1",
    temperature=0,
    generation_kwargs={"max_tokens": 16000},
)
print("generation_kwargs on the model:", getattr(model, "generation_kwargs", "<absent>"))

tc = LLMTestCase(
    input=case["input"],
    actual_output=case["actual_output"],
    retrieval_context=case["retrieval_context"],
)

for MetricCls in (AnswerRelevancyMetric, FaithfulnessMetric, ContextualRelevancyMetric):
    m = MetricCls(model=model, threshold=0.5)
    name = MetricCls.__name__
    try:
        m.measure(tc)
        print(f"{name:28} OK   score {m.score}")
    except Exception as e:
        print(f"{name:28} FAIL {str(e)[:220]}")

# how large does the context have to be before it breaks?
print("\ntruncating context to find the threshold:")
for limit in (4000, 2500, 1500, 800):
    small = LLMTestCase(
        input=case["input"],
        actual_output=case["actual_output"],
        retrieval_context=[c[:limit] for c in case["retrieval_context"]],
    )
    m = ContextualRelevancyMetric(model=model, threshold=0.5)
    try:
        m.measure(small)
        print(f"  chunk limit {limit:>5}: OK   score {m.score}")
    except Exception as e:
        print(f"  chunk limit {limit:>5}: FAIL {str(e)[:90]}")
