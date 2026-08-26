"""
Single place where the evaluation environment is configured.

Import this BEFORE deepeval - several of these are read at import time, notably
the telemetry opt-out, so setting them afterwards silently does nothing.

Every setting here traces to a failure from the previous round of runs:

  IGNORE_DEEPEVAL_ERRORS=0     ignore_errors=True turned a broken pass into a
                               plausible table covering one site out of eight
  ENABLE_DEEPEVAL_CACHE=0      cache lookup crashed a run at batch 28
  PYTHONIOENCODING=utf-8       deepeval's banner emoji crashed on cp1252
  PER_TASK/PER_ATTEMPT         runs died on deepeval's own inner deadline
  SKIP_DEEPEVAL_MISSING_PARAMS cases without expected_output should skip
                               precision/recall, not error

Usage:
    from evalconfig import judge, generator, RESULTS, load_env
"""

import os
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
HERE = pathlib.Path(__file__).resolve().parent
RESULTS = HERE / "results"
RESULTS.mkdir(parents=True, exist_ok=True)

# ── 1. env vars, before any deepeval import ──────────────────────────────────
_SETTINGS = {
    "DEEPEVAL_TELEMETRY_OPT_OUT": "1",
    "ENABLE_DEEPEVAL_CACHE": "0",
    "IGNORE_DEEPEVAL_ERRORS": "0",
    "SKIP_DEEPEVAL_MISSING_PARAMS": "1",
    "DEEPEVAL_LOG_STACK_TRACES": "1",
    "DEEPEVAL_RESULTS_FOLDER": str(RESULTS),
    "DEEPEVAL_PER_TASK_TIMEOUT_SECONDS_OVERRIDE": "900",
    "DEEPEVAL_PER_ATTEMPT_TIMEOUT_SECONDS_OVERRIDE": "300",
    "DEEPEVAL_RETRY_MAX_ATTEMPTS": "3",
    "DEEPEVAL_DISABLE_DOTENV": "1",   # we load .env.local ourselves, below
    "PYTHONIOENCODING": "utf-8",
    "PYTHONUTF8": "1",
}
for k, v in _SETTINGS.items():
    os.environ[k] = v

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass


def load_env():
    """Credentials from the app's .env.local, which is gitignored."""
    from dotenv import load_dotenv

    load_dotenv(ROOT / ".env.local", override=False)
    os.environ.setdefault("OPENAI_API_KEY", (os.environ.get("NEXT_PUBLIC_OPENAI_KEY") or "").strip())
    # GOOGLE_API_KEY is read straight from .env.local by deepeval's GeminiModel
    return {
        "openai": bool(os.environ.get("OPENAI_API_KEY", "").strip()),
        "google": bool(os.environ.get("GOOGLE_API_KEY", "").strip()),
        "pinecone": bool(os.environ.get("NEXT_PUBLIC_PINECONE_KEY", "").strip()),
        "mongo": bool(os.environ.get("NEXT_PUBLIC_MONGO_URI", "").strip()),
    }


load_env()

# ── 2. model roles ───────────────────────────────────────────────────────────
# Judge is deliberately NOT an OpenAI model: the generator under test is gpt-4o,
# and same-family judging inflates scores - reported at up to 50% more likely to
# mark a rubric satisfied when the output is the judge's own family.
JUDGE_MODEL = "gemini-2.5-pro"
JUDGE_IN, JUDGE_OUT = 1.25 / 1e6, 10.0 / 1e6

GENERATOR_MODEL = "gpt-4o"          # matches production, see route.ts:92
GENERATOR_IN, GENERATOR_OUT = 2.50 / 1e6, 10.0 / 1e6

EXTRACTOR_MODEL = "gpt-4o-mini"     # proven response_format json_schema support
SYNTH_MODEL = "gpt-4.1"

EMBEDDING_CURRENT = "text-embedding-ada-002"   # what production uses today
EMBEDDING_RATES = {
    "text-embedding-ada-002": 0.10 / 1e6,
    "text-embedding-3-small": 0.02 / 1e6,
    "text-embedding-3-large": 0.13 / 1e6,
}


def judge():
    """The metric judge. Costs are attached so spend is metered, not estimated."""
    from deepeval.models import GeminiModel

    return GeminiModel(
        model=JUDGE_MODEL,
        temperature=0,
        cost_per_input_token=JUDGE_IN,
        cost_per_output_token=JUDGE_OUT,
    )


class Meter:
    """Running cost, so every report states measured spend rather than a guess."""

    def __init__(self):
        self.usd = 0.0
        self.by_model = {}

    def charge(self, model, in_tok, out_tok=0, rate_in=None, rate_out=None):
        ri = rate_in if rate_in is not None else 0.0
        ro = rate_out if rate_out is not None else 0.0
        cost = in_tok * ri + out_tok * ro
        self.usd += cost
        b = self.by_model.setdefault(model, {"calls": 0, "in": 0, "out": 0, "usd": 0.0})
        b["calls"] += 1
        b["in"] += in_tok
        b["out"] += out_tok
        b["usd"] += cost
        return cost

    def report(self):
        lines = [f"TOTAL SPEND ${self.usd:.6f}"]
        for m, b in self.by_model.items():
            lines.append(f"  {m:<28} {b['calls']:>4} calls  {b['in']:>9} in / {b['out']:>7} out  ${b['usd']:.6f}")
        return "\n".join(lines)


def banner():
    keys = load_env()
    print("=" * 68)
    print("eval environment")
    print("=" * 68)
    print(f"  judge      {JUDGE_MODEL}   (non-OpenAI, avoids self-preference bias)")
    print(f"  generator  {GENERATOR_MODEL}   (matches production)")
    print(f"  extractor  {EXTRACTOR_MODEL}")
    print(f"  keys       " + "  ".join(f"{k}={'ok' if v else 'MISSING'}" for k, v in keys.items()))
    print(f"  results    {RESULTS}")
    print("  errors     NOT ignored, cache off, stack traces on")
    print("=" * 68)
    return keys
