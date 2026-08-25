"""
Stage 1 - generate goldens with DeepEval's Synthesizer.

Contexts come straight from Pinecone, so the goldens are grounded in exactly
the chunks the retriever will be judged against. No re-crawl, no invented facts.

Writes:
  goldens/single-turn.json   - RAG + component suites (input, expected_output, context)
  goldens/multi-turn.json    - application suite (scenario, expected_outcome)
  goldens/generation-cost.json

Run:
  evals-deepeval/.venv/Scripts/python.exe evals-deepeval/1-generate/synthesize.py
  ... --per-bot 8 --conv-per-bot 2 --model gpt-5.6-luna
"""

import argparse
import json
import os
import pathlib
import sys

from dotenv import load_dotenv

ROOT = pathlib.Path(__file__).resolve().parents[2]
load_dotenv(ROOT / ".env.local")

OUT = pathlib.Path(__file__).resolve().parents[1] / "goldens"
OUT.mkdir(parents=True, exist_ok=True)

# Existing chatbots on the test account. Nothing is created or deleted.
# Several probes per bot. Each probe pulls a different region of the indexed
# content, and those chunks become the context the goldens are written from.
# A single probe produced 4 FloatCo goldens that were ALL about pricing - the
# questions can only be as broad as the chunks they are generated from.
BOTS = [
    {
        "key": "floatco",
        "name": "Customer Support",
        "id": "6e8faa0c-e16d-4c44-afe0-91576e779063",
        "assistant_type": "cs-agent-sme-business",
        "content": "floatco.com crawl - float therapy and cold plunge spa in Hong Kong",
        "probes": [
            "pricing membership packages cost per session",
            "opening hours location address parking how to get there",
            "what happens during a session, what to bring, preparation",
            "policies, age limits, pregnancy, health restrictions, hygiene",
        ],
    },
    {
        "key": "itpolicy",
        "name": "IT-policy",
        "id": "asst_jLnIL3TNRjvygwzSMa1rzm7a",
        "assistant_type": "it-agent-sme-business",
        "content": "corporate IT policy document - backups, steering committee, security",
        "probes": [
            "backup requirements and data retention",
            "information security responsibilities and access control",
            "IT steering committee approvals and governance",
            "acceptable use, incidents, compliance and review",
        ],
    },
    {
        "key": "shopify",
        "name": "Shopify-Store-Agent",
        "id": "asst_f2Eshz3UBjgyYR1VAtjb1iEf",
        "assistant_type": "ecommerce-agent-shopify",
        "content": "Taste of HK - Hong Kong food products, shipping and delivery",
        "probes": [
            "product categories and specialities",
            "shipping delivery coverage and timescales",
            "brand story, authenticity, sourcing and traditional methods",
            "ordering, payment and customer service",
        ],
    },
    {
        "key": "ragn8n",
        "name": "RAGn8n",
        "id": "a04ee348-1b7c-4fa6-bdc2-795749264c68",
        "assistant_type": "sales-agent-sme-business",
        "content": "React Developer Tools guide - components, profiler, debugging",
        "probes": [
            "installation and browser extensions",
            "components tab, props, state and hooks inspection",
            "profiler and performance measurement",
            "redux devtools, zustand and state debugging",
        ],
    },
]

USER_ID = "65d2f2c1e41b6e876c267350"  # pinecone namespace for these bots


def fetch_contexts(bot, n_contexts: int):
    """
    One context per probe, so the goldens span the content instead of clustering
    on whatever a single query happened to rank highest. Each context is a small
    group of chunks so MULTICONTEXT evolutions have material to combine.
    """
    from openai import OpenAI
    from pinecone import Pinecone

    key = os.environ["NEXT_PUBLIC_OPENAI_KEY"].strip()
    client = OpenAI(api_key=key)
    pc = Pinecone(api_key=os.environ["NEXT_PUBLIC_PINECONE_KEY"].strip())
    index = pc.Index(os.environ["NEXT_PUBLIC_PINECONE_INDEX"].strip())

    groups, seen = [], set()
    probes = bot["probes"]
    for i in range(n_contexts):
        probe = probes[i % len(probes)]
        vec = (
            client.embeddings.create(model="text-embedding-ada-002", input=probe)
            .data[0]
            .embedding
        )
        res = index.query(
            vector=vec,
            top_k=6,
            include_metadata=True,
            namespace=USER_ID,
            filter={"chatbotId": bot["id"]},
        )
        picked = []
        for m in res.get("matches", []):
            c = (m.get("metadata") or {}).get("content", "")
            fp = c[:120]
            # don't reuse a chunk another probe already claimed
            if len(c.strip()) > 80 and fp not in seen:
                seen.add(fp)
                picked.append(c)
            if len(picked) == 2:
                break
        if picked:
            groups.append({"probe": probe, "chunks": picked})
    return groups


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--per-bot", type=int, default=8, help="single-turn goldens per bot")
    ap.add_argument("--conv-per-bot", type=int, default=2, help="conversational goldens per bot")
    ap.add_argument("--model", default="gpt-4.1-mini")
    ap.add_argument("--only", default=None, help="limit to one bot key")
    args = ap.parse_args()

    from deepeval.synthesizer import Synthesizer
    from deepeval.synthesizer.config import EvolutionConfig, FiltrationConfig, StylingConfig
    from deepeval.synthesizer.types import Evolution
    from deepeval.models import OpenAIModel

    os.environ.setdefault("OPENAI_API_KEY", os.environ["NEXT_PUBLIC_OPENAI_KEY"].strip())
    model = OpenAIModel(model=args.model)

    single_out, multi_out, costs = [], [], []

    for bot in BOTS:
        if args.only and bot["key"] != args.only:
            continue
        print(f"\n=== {bot['name']}  [{bot['assistant_type']}]")

        # 2 goldens per context, so we need per-bot/2 contexts -> *2 chunks each
        n_contexts = max(1, args.per_bot // 2)
        groups = fetch_contexts(bot, n_contexts)
        if not groups:
            print("   no chunks found, skipping")
            continue
        contexts = [g["chunks"] for g in groups]
        print(f"   contexts: {len(contexts)} from {len(set(g['probe'] for g in groups))} distinct probes")
        for g in groups:
            print(f"     - {g['probe'][:52]:<54} {len(g['chunks'])} chunks")

        styling = StylingConfig(
            scenario=(
                f"A customer messaging the {bot['name']} support chatbot on the "
                f"business website. The business is: {bot['content']}."
            ),
            task=(
                "Answer customer questions using only the business's own indexed "
                "content, and decline anything not covered by it."
            ),
            input_format="A short, natural customer question, as typed in a chat box.",
            expected_output_format=(
                "A concise, factual answer taken strictly from the given context. "
                "Include specific figures, times or names when the context has them."
            ),
        )
        synth = Synthesizer(
            model=model,
            styling_config=styling,
            # keep the harder variants - these are the ones worth having that a
            # human would not bother writing by hand
            evolution_config=EvolutionConfig(
                num_evolutions=1,
                evolutions={
                    Evolution.REASONING: 0.25,
                    Evolution.MULTICONTEXT: 0.25,
                    Evolution.CONCRETIZING: 0.2,
                    Evolution.COMPARATIVE: 0.15,
                    Evolution.HYPOTHETICAL: 0.15,
                },
            ),
            filtration_config=FiltrationConfig(
                synthetic_input_quality_threshold=0.5,
                max_quality_retries=2,
                critic_model=model,
            ),
            cost_tracking=True,
        )

        goldens = synth.generate_goldens_from_contexts(
            contexts=contexts, include_expected_output=True, max_goldens_per_context=2
        )
        for g in goldens:
            single_out.append(
                {
                    "bot": bot["key"],
                    "chatbot_id": bot["id"],
                    "assistant_type": bot["assistant_type"],
                    "input": g.input,
                    "expected_output": g.expected_output,
                    "context": g.context,
                }
            )
        print(f"   single-turn goldens: {len(goldens)}")

        if args.conv_per_bot:
            conv = synth.generate_conversational_goldens_from_contexts(
                contexts=contexts[: max(1, args.conv_per_bot)],
                include_expected_outcome=True,
                max_goldens_per_context=1,
            )
            for g in conv:
                multi_out.append(
                    {
                        "bot": bot["key"],
                        "chatbot_id": bot["id"],
                        "assistant_type": bot["assistant_type"],
                        "scenario": getattr(g, "scenario", None),
                        "expected_outcome": getattr(g, "expected_outcome", None),
                        "context": getattr(g, "context", None),
                    }
                )
            print(f"   conversational goldens: {len(conv)}")

        costs.append({"bot": bot["key"], "cost_usd": getattr(synth, "synthesis_cost", None)})

    (OUT / "single-turn.json").write_text(json.dumps(single_out, indent=2), encoding="utf-8")
    (OUT / "multi-turn.json").write_text(json.dumps(multi_out, indent=2), encoding="utf-8")
    (OUT / "generation-cost.json").write_text(json.dumps(costs, indent=2), encoding="utf-8")

    total = sum(c["cost_usd"] or 0 for c in costs)
    print(f"\nwrote {len(single_out)} single-turn and {len(multi_out)} conversational goldens")
    print(f"generation cost: ${total:.4f}  (model={args.model})")
    print(f"-> {OUT}")


if __name__ == "__main__":
    main()
