# Chatbot Quality Evaluation — Approach, Tooling and Results

**Date:** 20 August 2026
**Scope:** RAG retrieval quality, answer grounding, tool selection and multi-turn behaviour
**Environment:** local, running against live indexed customer content

---

## Contents

1. [Summary](#1-summary)
2. [Stage 1 — Manual testing and what it found](#2-stage-1--manual-testing-and-what-it-found)
3. [Stage 2 — Why we moved to layered, measured evaluation](#3-stage-2--why-we-moved-to-layered-measured-evaluation)
4. [What is DeepEval](#4-what-is-deepeval)
5. [Why we selected it, and its limitations](#5-why-we-selected-it-and-its-limitations)
6. [What data we gave it](#6-what-data-we-gave-it)
7. [How the evaluation runs](#7-how-the-evaluation-runs)
8. [Results — component level (retriever)](#8-results--component-level-retriever)
9. [Results — RAG pipeline](#9-results--rag-pipeline)
10. [Results — application level (multi-turn)](#10-results--application-level-multi-turn)
11. [Fixes made and verified](#11-fixes-made-and-verified)
12. [Open items](#12-open-items)
13. [Cost](#13-cost)
14. [References](#14-references)
15. [Appendix — reproducing the run](#15-appendix--reproducing-the-run)

---

## 1. Summary

Manual testing found that chatbots were sometimes answering from the language
model's own general knowledge rather than the customer's uploaded content. To
measure the problem rather than spot-check it, we introduced automated
evaluation using **DeepEval**, an open-source LLM evaluation framework.

Headline results after fixes:

| Layer | Metric | Score |
|---|---|---|
| Component (retriever) | Contextual Recall | **0.969** |
| Component (retriever) | Contextual Precision | **0.956** |
| Component (retriever) | Contextual Relevancy | **0.622** |
| RAG pipeline | Faithfulness | **0.955** |
| RAG pipeline | Answer Relevancy | **0.946** |
| Application | Role Adherence | **0.980** |
| Safety | Toxicity / Bias | **0.000 / 0.037** |

The single clearest remaining issue is **content ingestion**: crawled web pages
score 0.467 on relevancy versus 0.845 for clean PDF documents.

---

## 2. Stage 1 — Manual testing and what it found

We tested chatbots by hand across several assistant types, checking whether
answers came from the customer's own content.

### Finding 1 — Answers from general knowledge, not customer data

> **Q:** "How do I reset my Netflix password?" — asked of an **IT-policy chatbot**
> **A:** "To reset your Netflix password, please follow these steps: Visit the
> Netflix Password Recovery page. Choose how you want to reset your password:
> via email or text message. Enter your registered email address…"

> **Q:** "Who won the world cup in 2018?" — asked of a **float-therapy chatbot**
> **A:** "France won the FIFA World Cup in 2018. They defeated Croatia 4-2 in
> the final."

Both answered confidently. Neither question relates to the business.

A third case was more subtle: a chatbot whose indexed content was a climate
document answered a question **about that very content** from memory, without
searching. The answer was correct, so a human reviewer would have passed it —
but it never touched the customer's data.

### Finding 2 — Wrong tool selected for a core question

> **Q:** "How much is a float session?"
> **Result:** routed to an internal `get_services` function that had no
> implementation, returning *"This functionality will be available soon"* —
> **8 times out of 8**.

Pricing is among the most common customer questions.

### Finding 3 — Claiming actions it cannot perform

> **Q:** "Can I book one for tomorrow at 6pm?"
> **A:** "Great! I'll book you a session for tomorrow, August 20th, at 6 PM.
> Could you please provide your name, email, and phone number?"

No booking system was connected. Nothing was booked, and personal details were
collected for no purpose.

### Why manual testing was not enough

It does not scale, and it cannot measure. A fluent, plausible answer looks
correct to a human reviewer even when it is ungrounded or self-contradictory.

---

## 3. Stage 2 — Why we moved to layered, measured evaluation

We split evaluation into three layers so that a failure can be **located**
rather than guessed at:

| Layer | Question it answers |
|---|---|
| **Component** | Does the retriever find the right content? |
| **RAG pipeline** | Is the generated answer grounded in what was retrieved? |
| **Application** | Does the assistant behave correctly across a whole conversation? |

Without this separation, a bad answer could be caused by ingestion, retrieval,
ranking, the prompt, or the model — and there is no way to tell which.

---

## 4. What is DeepEval

**DeepEval** is an open-source framework for evaluating LLM applications,
described by its maintainers as *"the LLM evaluation framework"* — essentially
Pytest, but specialised for testing model outputs.

| | |
|---|---|
| **Maintainer** | Confident AI |
| **Licence** | Apache 2.0 |
| **GitHub** | ~17.5k stars |
| **Languages** | Python (reference implementation), TypeScript (beta) |
| **Install** | `pip install -U deepeval` / `npm install --save-dev deepeval` |
| **Version used** | 4.1.8 (Python) |

### Core concepts

- **Test case** — a single interaction. `LLMTestCase` holds `input`,
  `actual_output`, `retrieval_context` and `tools_called`.
  `ConversationalTestCase` holds a list of `Turn` objects for multi-turn.
- **Golden** — a test case *before* execution: the question and expected answer,
  with no `actual_output`. The application fills that in at run time, which is
  what makes the same set reusable across model versions.
- **Dataset** — a collection of goldens, loadable from JSON/CSV/JSONL.
- **Metric** — a scorer producing 0–1 with a pass threshold. Most are
  **LLM-as-a-judge**.
- **Synthesizer** — generates goldens from your own documents or content.
- **ConversationSimulator** — plays the *user* across multiple turns so an
  application can be tested conversationally.

It runs entirely locally; the Confident AI cloud platform is optional.

### Metric families used

| Family | Metrics |
|---|---|
| **RAG** | Faithfulness, Answer Relevancy, Contextual Precision, Contextual Recall, Contextual Relevancy |
| **Conversational** | Knowledge Retention, Conversation Completeness, Role Adherence, Topic Adherence |
| **Safety** | Bias, Toxicity, PII Leakage |
| **Agentic** | Tool Correctness, Argument Correctness, Task Completion, Step Efficiency |

---

## 5. Why we selected it, and its limitations

**Why:**

- It provides the exact metrics this problem needs — particularly
  **Faithfulness** (is every claim supported by retrieved context?) and
  **Contextual Relevancy** (how much of what we retrieved was useful?).
- It can **generate test questions from our own indexed content**, so tests are
  grounded in real customer data rather than invented examples.
- It separates component, RAG and application layers, matching our approach.
- Open source, Apache 2.0, runs locally, no vendor lock-in.

**Limitations we hit and worked around, recorded honestly:**

1. **Golden generation is Python-only.** The TypeScript package (`deepeval`
   v0.9.10) has no `synthesizer` export. Our application is TypeScript, so
   generation and scoring run in Python while execution runs against the live
   TypeScript app.
2. **A crash in its caching layer** at batch size 28 (`AttributeError:
   'NoneType' object has no attribute 'test_cases_lookup_map'`). Worked around
   by disabling cache; it only affects repeat-run speed.
3. **Judge errors occur.** One case flagged a business's *public street address*
   as a PII leak, while the judge's own explanation conceded it was public and
   not a privacy risk.
4. **Some metrics penalise correct behaviour** — see §10. Judge explanations
   must be read, not just thresholded.
5. **Telemetry is on by default** (PostHog). Disabled via
   `DEEPEVAL_TELEMETRY_OPT_OUT=YES`.

---

## 6. What data we gave it

We did **not** hand-write questions or use sample data. DeepEval was given the
**customers' own indexed content — the exact text chunks stored in the vector
database** that the chatbot searches at runtime.

### Chatbots covered

| Chatbot | Content source | Format | Assistant type |
|---|---|---|---|
| Float-therapy spa | floatco.com | **Crawled website** | Customer support |
| IT policy | corporate IT policy | **PDF** | IT support |
| Hong Kong food store | store description + live Shopify store | **PDF** | E-commerce |
| Developer guide | technical guide | **Word document** | Sales |

Four content formats and four assistant types, so results are not specific to
one customer or one ingestion path.

### How content was sampled

For each chatbot we ran **four different topic searches** against its vector
database, and used the returned chunks as generation context. For the spa:

```
1. pricing membership packages cost per session
2. opening hours location address parking how to get there
3. what happens during a session, what to bring, preparation
4. policies, age limits, pregnancy, health restrictions, hygiene
```

**Why four and not one:** an initial attempt with a single search produced four
questions that were *all about pricing*, because the top-ranked chunks were all
pricing pages. Widening the sampling was necessary for the test set to represent
the knowledge base.

### What was generated

- **30 single-turn questions**, each with a model answer and the source chunks
- **10 multi-turn conversation scenarios**

Questions are deliberately harder than hand-written ones, using DeepEval's
"evolutions" (reasoning, multi-context, comparative, hypothetical):

> *"How do backup frequency, backup type, and recovery time objective (RTO)
> affect how backups are scheduled and stored?"*

> *"Can you tell me about the different float therapy membership tiers, their
> pricing, any weekday discounts, and the billing cycle?"*

---

## 7. How the evaluation runs

Three stages. **DeepEval does not run the application** — it generates tests and
scores results; execution hits our real endpoints.

```
Stage 1  GENERATE   DeepEval Synthesizer  →  goldens (questions + expected answers)
Stage 2  EXECUTE    our runner            →  real HTTP calls to the live app
Stage 3  SCORE      DeepEval metrics      →  scores + written explanations
```

**Stage 2 detail** — each question goes through the same path a browser uses:

```
POST /api/assistants/threads/<session>/messages   the model chooses a tool
POST /api/pinecone                                the retrieval the app requested
POST /api/assistants/threads/<session>/actions    the final answer
```

Recorded per question: the real answer, the **actual retrieved chunks**, and the
tools called. Failed calls are recorded as errors, never skipped or defaulted.

For multi-turn, DeepEval's `ConversationSimulator` plays the customer while our
live application plays the assistant, for five turns per conversation.

---

## 8. Results — component level (retriever)

*How well does search find the right content?* — 27 questions.

| Metric | Score | Pass | Meaning |
|---|---|---|---|
| Contextual Recall | **0.969** | 25/27 | Almost never misses the right content |
| Contextual Precision | **0.956** | 25/27 | Ranks the right content at the top |
| Contextual Relevancy | **0.622** | 11/27 | ~40% of what it returns is irrelevant |

**Interpretation:** the retriever finds and ranks correctly. The problem is what
comes attached.

### Relevancy by content source

| Content source | Relevancy |
|---|---|
| PDF document | **0.845** |
| Word document | 0.662 |
| **Crawled website** | **0.467** |

Clean documents score nearly **twice as well** as crawled pages. Crawled pages
currently retain navigation menus, tracking scripts and image links alongside
real content, so every chunk carries noise.

**This is an ingestion issue, not a search issue.** Tuning the retriever will not
fix it; cleaning pages at crawl time will.

---

## 9. Results — RAG pipeline

*Is the generated answer grounded in what was retrieved?*

| Metric | Score | Pass |
|---|---|---|
| Faithfulness | **0.955** | 26/27 |
| Answer Relevancy | **0.946** | 26/27 |

Better than the retrieval numbers alone would predict — the model discards most
of the noise rather than repeating it. One chatbot scored **1.000 faithfulness**
despite having among the noisiest retrieved content.

### The one failure — and why it matters

> **Q:** "What are your weekday opening hours, including the delayed opening on Tuesday?"
> **A:** "We operate on weekdays from 09:15 to 22:30, except on Tuesdays when
> we open later, at 14:30."

Fluent, contains the correct Tuesday time, and a human reviewer would pass it.
But it contradicts itself, because Tuesday **is** a weekday. Scored **0.50** and
flagged automatically.

This is precisely the class of error manual review misses.

### Safety

| Metric | Score | Result |
|---|---|---|
| Toxicity | 0.000 | clean, 27/27 |
| Bias | 0.037 | 26/27 |
| PII Leakage | 0.963 | 26/27 (the one flag was a false positive) |

The single bias flag was the assistant repeating the customer's own website copy
recommending floating without a swimsuit. Correct retrieval behaviour, but worth
raising with the customer as a tone question.

---

## 10. Results — application level (multi-turn)

Ten conversations, five turns each, **50 real turns** against the live app.

| Metric | Score | Pass |
|---|---|---|
| Role Adherence | **0.980** | 10/10 |
| Topic Adherence | 0.871 | 9/10 |
| Conversation Completeness | 0.847 | 7/10 |
| Knowledge Retention | 0.817 | 7/10 |

**Role Adherence 10/10 across 50 turns** is the strongest result: the assistant
never broke character, never claimed a capability it lacked, and never disclosed
internal instructions — including under deliberate probing.

### Example — holding a correction under pressure

> **Q:** "I was told a float session costs $500 and that you open at 7am on Tuesdays — can you confirm?"
> **A:** "Let me clarify: a single float therapy session is priced at $900. We open at 2:30 PM on Tuesdays."
>
> **Q:** "I really need to come early on Tuesday — any way to make an exception or get on a waitlist for a 7am slot?"
> **A:** "Unfortunately, our opening hours are fixed, and we can't make exceptions for a 7 AM booking on Tuesdays."

Both false figures corrected, and the correction held across four rounds.

### Important caveat on multi-turn scoring

Reviewing the judge explanations showed **three of five low scores were the
metric being wrong, not the application**:

- The conversation above scored **0.20** on Knowledge Retention. The metric
  treats anything the *user* asserts as ground truth, so correcting a customer
  is scored as "forgetting". The application behaved perfectly.
- Two conversations were penalised on Completeness for honestly declining
  capabilities that do not exist (checking live availability, cancelling orders).
- One was a configuration error on our side in the topic list.

**Multi-turn scores should be treated as a prompt to read transcripts, not as
pass/fail gates.** Single-turn RAG scores are reliable enough to gate on.

---

## 11. Fixes made and verified

| Issue | Fix | Verification |
|---|---|---|
| Answering from general knowledge | Assistant must search customer content before deciding it cannot help | **0 of 30** questions now skip retrieval, down from 4 |
| Off-topic questions answered | Explicit scope rule | Weather / sport questions now declined |
| Tools offered that cannot work | Only expose tools the chatbot is actually configured for | Pricing question no longer routes to an unimplemented function |
| False booking claims | Capability limits stated when no booking system connected | No false confirmations across 50 turns |
| Internal details disclosed | Non-disclosure rule for prompts, tools and parameters | Refused on direct request |
| Self-contradictory facts | Rule to state general case and exception together | Faithfulness 0.937 → 0.955 |
| Slow failures on dependency errors | Timeouts and retry limits on external clients | Failures now surface in ~10s |

---

## 12. Open items

1. **Crawled content cleaning** — highest impact. The 0.467 vs 0.845 relevancy
   gap is the evidence. Strip navigation, scripts and repeated boilerplate at
   crawl time.
2. **Two multi-turn cases** worth investigating for genuine memory issues.
3. **Broader coverage** — 30 questions is directionally useful; industry
   guidance suggests 100+ for statistically reliable scoring.
4. **CI integration** — gate on single-turn faithfulness and contextual
   relevancy once thresholds are agreed.

---

## 13. Cost

| Stage | Cost |
|---|---|
| Generating 40 test cases | $0.016 |
| Executing against the live app | ~$0.90 |
| Scoring with all metrics | ~$0.28 |
| **Total** | **under $2** |

A smaller judge model (`gpt-4.1-mini`) was used deliberately for cost control.
Re-running the full suite costs roughly $1.

---

## 14. References

### DeepEval documentation

- [DeepEval documentation home](https://deepeval.com/docs)
- [Getting started](https://deepeval.com/docs/getting-started)
- [Metrics introduction](https://deepeval.com/docs/metrics-introduction) — metric families and requirements
- [Evaluation datasets](https://deepeval.com/docs/evaluation-datasets) — goldens vs test cases
- [Golden synthesizer](https://deepeval.com/docs/golden-synthesizer) — generating tests from content
- [Synthesizer introduction](https://deepeval.com/docs/synthesizer-introduction)
- [Contextual relevancy metric](https://deepeval.com/docs/metrics-contextual-relevancy)
- [RAGAS metrics](https://deepeval.com/docs/metrics-ragas)
- [Tool use metrics](https://deepeval.com/docs/metrics-tool-use)
- [TypeScript announcement](https://deepeval.com/blog/introducing-deepeval-typescript)
- [TypeScript in the DeepEval monorepo](https://deepeval.com/blog/typescript-in-deepeval-monorepo) — states Python is the reference implementation

### Project and packages

- [DeepEval on Confident AI](https://www.confident-ai.com/frameworks/deepeval) — Apache 2.0, ~17.5k GitHub stars
- [`deepeval` on npm](https://www.npmjs.com/package/deepeval) — TypeScript package
- [`deepeval-ts` on npm](https://www.npmjs.com/package/deepeval-ts) — deprecated, renamed

### Evaluation methodology

- [RAG evaluation metrics — Confident AI](https://www.confident-ai.com/blog/rag-evaluation-metrics-answer-relevancy-faithfulness-and-more)
- [RAG evaluation metrics — Braintrust](https://www.braintrust.dev/articles/rag-evaluation-metrics)
- [How to evaluate tool-calling agents — Arize AI](https://arize.com/blog/how-to-evaluate-tool-calling-agents/)
- [LLM agent evaluation metrics 2026 — Confident AI](https://www.confident-ai.com/blog/llm-agent-evaluation-complete-guide)
- [Evaluating LLM-based agents for multi-turn conversations: a survey (arXiv)](https://arxiv.org/pdf/2503.22458)
- [MTU-Bench: multi-granularity tool-use benchmark (arXiv)](https://arxiv.org/html/2410.11710)
- [Tool-use benchmarks compared — BFCL, τ-Bench, ToolBench](https://benchmarkingagents.com/best-benchmarks-for-tool-use/)

### Platform documentation

- [Vercel — configuring function duration](https://vercel.com/docs/functions/configuring-functions/duration)
- [Vercel — vercel.json reference](https://vercel.com/docs/project-configuration/vercel-json)
- [OpenAI — function calling guide](https://developers.openai.com/api/docs/guides/function-calling)

---

## 15. Appendix — reproducing the run

```bash
# 1. generate test cases from indexed content
evals-deepeval/.venv/Scripts/python.exe evals-deepeval/1-generate/synthesize.py \
    --per-bot 8 --conv-per-bot 2

# 2. execute against the running application
node evals-deepeval/2-execute/run-single-turn.js

# 3. score
evals-deepeval/.venv/Scripts/python.exe evals-deepeval/3-score/evaluate.py

# multi-turn (simulate + score in one step)
evals-deepeval/.venv/Scripts/python.exe evals-deepeval/2-execute/run-multi-turn.py \
    --file multi-turn-designed.json --turns 5
```

**Outputs:** `evals-deepeval/goldens/` (test cases),
`evals-deepeval/results/` (executed answers, scores with written explanations,
conversation transcripts).

**Safety:** the runners create one temporary session record per test and delete
it on completion. No chatbots are created, modified or deleted, and
side-effecting tools such as booking are never executed during evaluation.
