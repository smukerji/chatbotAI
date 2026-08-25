"""
Stage 2b + 3b - multi-turn suite.

DeepEval's ConversationSimulator plays the USER, driven by the conversational
goldens generated in stage 1. Our real app plays the ASSISTANT: the
model_callback below makes actual HTTP calls to /messages, /api/pinecone and
/actions, exactly as the browser does. Nothing is simulated on our side.

The resulting ConversationalTestCases are then scored with the multi-turn
metrics.

Run:
  evals-deepeval/.venv/Scripts/python.exe evals-deepeval/2-execute/run-multi-turn.py
  ... --limit 2 --turns 4
"""

import argparse
import asyncio
import json
import os
import pathlib
import uuid

import httpx
from dotenv import load_dotenv

ROOT = pathlib.Path(__file__).resolve().parents[2]
BASE = pathlib.Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env.local")

BASE_URL = os.environ.get("EVAL_BASE", "http://localhost:3000")
USER_ID = "65d2f2c1e41b6e876c267350"
RESULTS = BASE / "results"
RESULTS.mkdir(parents=True, exist_ok=True)

# session id per simulated conversation, so turns chain the way the app expects
_sessions: dict[str, str] = {}
_transcript: list[dict] = []


def _parse_sse(text: str):
    events = []
    for line in text.split("\n"):
        if not line.startswith("data: "):
            continue
        payload = line[6:].strip()
        if payload == "[DONE]":
            continue
        try:
            events.append(json.loads(payload))
        except Exception:
            pass
    return events


def _collect(events):
    resp_id, text, calls = None, None, []
    for e in events:
        if e.get("type") == "response.created":
            resp_id = (e.get("response") or {}).get("id")
        if e.get("type") == "response.output_item.done":
            item = e.get("item") or {}
            if item.get("type") == "function_call":
                calls.append(
                    {"name": item.get("name"), "args": item.get("arguments"), "call_id": item.get("call_id")}
                )
        if e.get("type") == "response.output_text.done":
            text = e.get("text")
    return resp_id, text, calls


async def ask_app(chatbot_id: str, thread_key: str, message: str) -> dict:
    """One real turn against the running app."""
    session = _sessions.setdefault(thread_key, f"DEVAL-MT-{uuid.uuid4()}")
    retrieved: list[str] = []
    tools: list[str] = []

    async with httpx.AsyncClient(timeout=180) as client:
        r = await client.post(
            f"{BASE_URL}/api/assistants/threads/{session}/messages",
            json={"content": message, "assistantId": chatbot_id},
        )
        resp_id, text, calls = _collect(_parse_sse(r.text))
        tools += [c["name"] for c in calls]

        guard = 0
        while calls and guard < 3:
            guard += 1
            outputs = []
            for call in calls:
                if call["name"] == "get_reference":
                    args = json.loads(call["args"] or "{}")
                    pr = await client.post(
                        f"{BASE_URL}/api/pinecone",
                        json={
                            "userQuery": args.get("userQuery", message),
                            "chatbotId": chatbot_id,
                            "userId": USER_ID,
                            "messages": [],
                        },
                    )
                    if pr.status_code == 200:
                        chunks = pr.json()
                        chunks = chunks if isinstance(chunks, list) else []
                        retrieved += [str(c.get("content", "")) for c in chunks]
                        out = json.dumps({"success": True, "data": chunks})
                    else:
                        out = json.dumps({"success": False, "message": f"HTTP {pr.status_code}"})
                else:
                    out = json.dumps({"success": False, "message": "tool not executed during evaluation"})
                outputs.append({"tool_call_id": call["call_id"], "output": out})

            ar = await client.post(
                f"{BASE_URL}/api/assistants/threads/{session}/actions",
                json={
                    "assistantId": chatbot_id,
                    "previousResponseId": resp_id,
                    "toolCallOutputs": outputs,
                },
            )
            nid, ntext, calls = _collect(_parse_sse(ar.text))
            resp_id = nid or resp_id
            text = ntext if ntext is not None else text
            tools += [c["name"] for c in calls]

    _transcript.append(
        {
            "thread": thread_key,
            "session": session,
            "user": message,
            "assistant": text,
            "tools": tools,
            "retrieved_chunks": len(retrieved),
        }
    )
    return {"text": text or "", "retrieved": retrieved, "tools": tools}


async def cleanup_sessions():
    from pymongo import MongoClient

    ids = list(_sessions.values())
    if not ids:
        return 0
    c = MongoClient(os.environ["NEXT_PUBLIC_MONGO_URI"])
    n = c.get_database().get_collection("chatbot-sessions").delete_many({"sessionId": {"$in": ids}}).deleted_count
    c.close()
    return n


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--turns", type=int, default=4, help="max simulated user turns")
    ap.add_argument("--model", default="gpt-4.1-mini")
    ap.add_argument("--file", default="multi-turn.json", help="goldens file in goldens/")
    args = ap.parse_args()

    os.environ.setdefault("OPENAI_API_KEY", os.environ["NEXT_PUBLIC_OPENAI_KEY"].strip())

    from deepeval import evaluate
    from deepeval.dataset import ConversationalGolden
    from deepeval.evaluate.configs import AsyncConfig, CacheConfig, DisplayConfig
    from deepeval.metrics import (
        ConversationCompletenessMetric,
        KnowledgeRetentionMetric,
        RoleAdherenceMetric,
        TopicAdherenceMetric,
    )
    from deepeval.models import OpenAIModel
    from deepeval.test_case import Turn
    from deepeval.simulator import ConversationSimulator
    from deepeval.simulator.controller import proceed, end

    model = OpenAIModel(model=args.model)
    raw = json.loads((BASE / "goldens" / args.file).read_text(encoding="utf-8"))
    raw = [g for g in raw if g.get("scenario")]
    if args.limit:
        raw = raw[: args.limit]

    print(f"simulating {len(raw)} conversations, up to {args.turns} user turns each")
    print(f"assistant = the real app at {BASE_URL}\n")

    goldens, bot_of = [], {}
    for i, g in enumerate(raw):
        key = f"conv-{i}"
        bot_of[key] = g["chatbot_id"]
        goldens.append(
            ConversationalGolden(
                scenario=g["scenario"],
                expected_outcome=g.get("expected_outcome"),
                user_description=g.get("user_description"),
                additional_metadata={
                    "thread": key,
                    "chatbot_id": g["chatbot_id"],
                    "bot": g["bot"],
                    "id": g.get("id"),
                    "targets": g.get("targets"),
                },
            )
        )

    thread_to_bot: dict[str, str] = {}
    bot_ids = [g["chatbot_id"] for g in raw]

    async def model_callback(input: str, turns=None, thread_id=None) -> Turn:
        # the simulator generates its own thread_id; bind each new thread to the
        # next golden's bot, in order, so turns of one conversation stay together
        key = str(thread_id or "conv-0")
        if key not in thread_to_bot:
            thread_to_bot[key] = bot_ids[len(thread_to_bot) % len(bot_ids)]
        chatbot_id = thread_to_bot[key]
        res = await ask_app(chatbot_id, key, input)
        # the simulator requires a Turn, not a string
        return Turn(
            role="assistant",
            content=res["text"],
            retrieval_context=res["retrieved"] or None,
        )

    def run_to_max_turns(simulated_user_turns, max_user_simulations):
        """
        The default controller ends a conversation as soon as the golden's
        expected_outcome looks satisfied, which collapsed every scenario to 1-2
        turns. KnowledgeRetention cannot fail when there is no earlier turn to
        forget, so those scores were meaningless. Run to the turn budget instead.
        """
        return proceed() if simulated_user_turns < max_user_simulations else end("turn budget reached")

    simulator = ConversationSimulator(
        model_callback=model_callback,
        simulator_model=model,
        stopping_controller=run_to_max_turns,
        # conversations MUST run one at a time: the callback only receives a
        # generated thread_id, so the only reliable way to know which golden a
        # thread belongs to is the order it starts in. Running concurrently bound
        # scenarios to the wrong chatbots (a FloatCo scenario answered from the
        # React DevTools bot).
        max_concurrent=1,
    )
    test_cases = simulator.simulate(conversational_goldens=goldens, max_user_simulations=args.turns)

    (RESULTS / "multi-turn-transcript.json").write_text(
        json.dumps(_transcript, indent=2), encoding="utf-8"
    )
    print(f"\nsimulated {len(test_cases)} conversations, {len(_transcript)} real app turns")

    # RoleAdherence needs a chatbot_role on the test case; without it the metric
    # has no standard to judge against
    for tc in test_cases:
        if not getattr(tc, "chatbot_role", None):
            tc.chatbot_role = (
                "A customer support assistant for one specific business. It answers only "
                "from that business's own indexed content, searches before deciding whether "
                "it can help, declines unrelated general-knowledge questions, and never "
                "claims capabilities it does not have."
            )

    # TopicAdherence requires an explicit topic list
    topics = sorted({t for g in raw for t in str(g.get("bot", "")).split()} | {
        "business services", "pricing", "opening hours", "policies", "products",
        "documentation", "support",
    })

    result = evaluate(
        test_cases=test_cases,
        metrics=[
            KnowledgeRetentionMetric(model=model, threshold=0.7),
            ConversationCompletenessMetric(model=model, threshold=0.7),
            RoleAdherenceMetric(model=model, threshold=0.7),
            TopicAdherenceMetric(relevant_topics=topics, model=model, threshold=0.7),
        ],
        async_config=AsyncConfig(max_concurrent=2),
        display_config=DisplayConfig(show_indicator=True, print_results=False),
        cache_config=CacheConfig(write_cache=False, use_cache=False),
    )

    out, agg = [], {}
    for idx, tr in enumerate(result.test_results):
        golden = raw[idx] if idx < len(raw) else {}
        row = {
            "id": golden.get("id"),
            "bot": golden.get("bot"),
            "targets": golden.get("targets"),
            "turns": len(getattr(tr, "turns", []) or []),
            "metrics": {},
        }
        for m in tr.metrics_data or []:
            row["metrics"][m.name] = {"score": m.score, "success": m.success, "reason": (m.reason or "")[:400]}
            a = agg.setdefault(m.name, {"s": [], "p": 0, "n": 0})
            if m.score is not None:
                a["s"].append(m.score)
            a["n"] += 1
            if m.success:
                a["p"] += 1
        out.append(row)

    (RESULTS / "multi-turn-scores.json").write_text(json.dumps(out, indent=2), encoding="utf-8")

    print("\n" + "=" * 58)
    print(f"{'multi-turn metric':<30}{'avg':>8}{'pass':>10}")
    print("=" * 58)
    for name, a in agg.items():
        avg = sum(a["s"]) / len(a["s"]) if a["s"] else float("nan")
        print(f"{name:<30}{avg:>8.3f}{a['p']:>7}/{a['n']}")
    print("=" * 58)

    removed = asyncio.run(cleanup_sessions())
    print(f"\ncleaned {removed} test session docs")
    print(f"-> {RESULTS/'multi-turn-scores.json'}")


if __name__ == "__main__":
    main()
