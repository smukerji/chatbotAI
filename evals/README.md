# Golden Evals — RAG & Tool Calling

## Run

```bash
node evals/run-evals.js                      # both suites
node evals/run-evals.js --suite capability   # fast, offline, no data needed
node evals/run-evals.js --suite conversation # live routes, needs dev server
node evals/run-evals.js --case conv-happy-pricing --repeat 5
node evals/run-evals.js --base https://<preview>.vercel.app
```

Exit code 1 on any real failure, so it can gate CI. Cases marked
`expect_known_failure` report as KNOWN and do not fail the run.

## Two suites, deliberately

**Capability** — a pure function test of tool exposure. Parses the tool
declarations out of `assistant-creation-contants.ts` and the filter sets out of
`assistant-tools.ts`, so it never restates the lists and picks up source changes
automatically. Covers **all 13 assistant types** across integration states.
Offline, deterministic, ~1s.

**Conversation** — drives the real endpoints exactly as the browser does:
`/messages` → tool call → `/api/pinecone` → `/actions`, chained by
`previous_response_id`. Asserts per turn: which tool was chosen, whether the
answer's facts are present in the *retrieved chunks* (not just the answer),
refusal behaviour, and hallucination guards.

## Metrics, and why these

Following the RAG-eval literature (context precision/recall for retrieval,
faithfulness/answer-relevance for generation, evaluated component-wise so a
failure can be localised) and the tool-calling literature (wrong-tool vs
right-tool-wrong-arguments as distinct failures):

| Metric | How it's measured here |
|---|---|
| Tool accuracy | `expect.tool` / `expect.any`, incl. `null` for "must not call a tool" |
| Context recall | `expect.contains` matched against retrieved chunk text |
| Faithfulness | `grounded: true` — each asserted fact must appear in the chunks, not only the answer |
| Refusal accuracy | `must_refuse` on unanswerable questions |
| Hallucination | `not_contains` guards |
| Capability honesty | `must_not_promise_booking` |

`grounded` is the important one. Without it a case passes when the model
happens to know the answer, which is exactly how the "inflatable islands"
hallucination looked correct at a glance.

## Scenario coverage

`happy_path`, `followup` (pronoun resolution across turns), `unanswerable`,
`adversarial` (prompt injection + crawled-markup echo), `disambiguation`,
`capability_boundary`, `smalltalk`, `numeric`, `temporal`, `isolation`.

**Canary facts** are used where a model could otherwise bluff. Tuesday opening
at 14:30 (every other day is 09:15/08:30) cannot be guessed, so a correct answer
proves retrieval actually happened.

## Safety

Read-only against your data. Each conversation case creates one
`chatbot-sessions` document and deletes it on completion. Nothing is written to
`chatbots-data`, `user-chatbots`, `chat-history` or Pinecone. Side-effecting
tools are never executed — the runner returns
`"tool not executed during evaluation"` for anything other than `get_reference`,
so no booking or Shopify call is ever made.

## Results — 2026-08-19, local, `feature/responses-api-migration` + pending changes

```
capability     16 / 16 pass      (all 13 assistant types)
conversation   15 / 15 pass
repeat runs    conv-happy-pricing   5/5
               conv-multiturn-mixed 3/3
```

## What these results do NOT prove

Stated plainly, because a green suite is easy to over-read:

- **Only one trained fixture.** Every conversation case runs against the FloatCo
  bot (`cs-agent-sme-business`, no Shopify, no calendar). The other 12 assistant
  types are covered only by the capability suite. Add a fixture per type as
  trained bots become available.
- **Small sample.** 5 repeats is enough to catch a coin-flip, not a 1-in-20
  flake. The literature's guidance is ~30 examples for direction, 100+ for
  statistical reliability, 500+ to slice by query type. This set has 15.
- **Local only.** Vercel cold starts, the `bom1` region and production
  concurrency are not exercised. Run with `--base <preview-url>` for that.
- **LLM-as-judge is not used.** Assertions are substring and grounding checks,
  which are deterministic and cheap but blunt — a correct answer phrased
  unusually can fail, and a wrong answer containing the right number can pass.
- **Known issues remain untested**, chiefly B1 (no score threshold) and D1
  (stale context reuse across turns). `conv-retrieval-empty-guard` probes B1 but
  passed, meaning the irrelevant query happened to score below the threshold —
  it is a weak assertion, not proof the failure mode is gone.

See `FAILURE-MODES.md` for the full audit and which items the pending changes
actually address.

## Extending

Add a fixture (a trained chatbot id + user id + integration state) and a few
conversation cases per assistant type. Highest value additions, in order:

1. A trained `ecommerce-agent-shopify` bot with a real store — the only type
   where `find_product` should legitimately win over `get_reference`.
2. A trained `booking-agent-general` bot with a calendar, to test the booking
   path end to end. Point it at a throwaway calendar; the runner refuses to
   execute booking tools, so this needs a deliberate opt-in.
3. Real user questions from `chat-history` — the literature is unanimous that
   golden sets should be seeded from production traffic rather than invented.
   251 documents are already there.
