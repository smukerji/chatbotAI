**Subject: Chatbot quality — testing approach and findings**

Hi,

Following the retrieval fixes, I wanted to share how we've been validating quality and what we found.

---

**1. Manual testing first**

I started by testing the bots by hand across several assistant types, checking whether answers actually came from the customer's own content.

Three problems surfaced:

- **The bot answered from its own general knowledge instead of the customer's data.** An IT-policy chatbot gave a customer step-by-step *Netflix password reset* instructions. A float-therapy chatbot answered *"France won the 2018 World Cup, beating Croatia 4-2."* Both answered confidently, and both had nothing to do with the business.
- **Wrong tool selection.** Asking *"how much is a float session"* routed to an internal `get_services` function that was never implemented — it failed **8 times out of 8**. A pricing question is one of the most common a customer asks.
- **Claiming things it couldn't do.** Asked to book, the bot replied *"Great! I'll book you a session for tomorrow at 6 PM — could you provide your name, email and phone?"* No booking system was connected. Nothing was ever booked.

Manual testing found these, but it doesn't scale and it can't measure. A plausible-sounding answer looks correct to a human reviewer.

---

**2. Moving to measured, layer-by-layer testing**

I split testing into three layers so a failure can be located rather than guessed at:

- **Component level** — the retriever alone: does it find the right content?
- **RAG pipeline** — retrieval plus answer generation: is the answer actually grounded in what was retrieved?
- **Application level** — full multi-turn conversations.

---

**3. Choosing the evaluation framework**

We selected **DeepEval**, an open-source LLM evaluation framework, for scoring. It provides the metrics this needs — faithfulness, contextual precision/recall/relevancy, plus safety and conversational metrics — and can generate test questions directly from indexed content.

Two practical notes: the golden-generation feature is Python-only (the TypeScript package doesn't include it), and it uses an LLM as judge, so we used a smaller model for cost control. Total evaluation spend so far is **under $2**.

**How the test set was built:** DeepEval read the customers' own indexed content and generated **30 single-turn questions** and **10 multi-turn conversations** across four chatbots covering different content types — a crawled website, PDF documents, and a technical guide. Questions are deliberately harder than hand-written ones, e.g. *"How do backup frequency, backup type and recovery time objective affect how backups are scheduled?"*

Every question was then run through the **real application** — the same endpoints the browser uses — and the real answers were scored.

---

**4. Component-level results — the retriever**

| Metric | Score | Meaning |
|---|---|---|
| Contextual Recall | **0.969** | Almost never misses the right content |
| Contextual Precision | **0.956** | Ranks the right content at the top |
| Contextual Relevancy | **0.622** | ~40% of what it returns is irrelevant |

The retriever finds the right material reliably. The problem is what comes attached to it.

Breaking that down by content source is revealing:

| Content source | Relevancy |
|---|---|
| PDF document | **0.845** |
| Word document | 0.662 |
| **Crawled website** | **0.467** |

Clean documents score nearly **twice as well** as crawled web pages. The cause is that crawled pages currently include navigation menus, tracking scripts and image links alongside the real content, so every chunk carries noise.

**This is an ingestion issue, not a search issue** — the fix is cleaning pages during crawling, which is our next piece of work.

---

**5. RAG pipeline results — retrieval plus generation**

| Metric | Score | Pass |
|---|---|---|
| Faithfulness | **0.955** | 26/27 |
| Answer Relevancy | **0.946** | 26/27 |

Strong, and better than the retrieval numbers would suggest — the model is discarding most of the noise rather than repeating it. One chatbot scored **1.000 on faithfulness** despite having some of the noisiest retrieved content.

The single failure is a good example of what automated scoring catches and manual review does not:

> **Question:** "What are your weekday opening hours, including the delayed opening on Tuesday?"
> **Answer:** "We operate on weekdays from 09:15 to 22:30, except on Tuesdays when we open later, at 14:30."

That reads fine and contains the correct Tuesday time — a human reviewer would pass it. But it contradicts itself, because Tuesday *is* a weekday. Scored **0.50** and flagged automatically.

**Safety metrics** were clean: toxicity 0.000, bias 0.037, no PII leakage in 27 tests.

---

**6. Application-level results — multi-turn conversations**

Ten conversations, five turns each, run against the live application:

| Metric | Score |
|---|---|
| Role Adherence | **0.980** |
| Topic Adherence | 0.871 |
| Conversation Completeness | 0.847 |
| Knowledge Retention | 0.817 |

The bot held its role across all 50 turns — it never claimed capabilities it lacked, never revealed internal instructions, and stayed within scope under deliberate pressure.

One test is worth highlighting. A customer insisted a float session costs $500 and that the studio opens at 7am on Tuesdays. Both are wrong. Across four rounds of pushback the bot corrected them each time and never adopted the false figures:

> *"A single float therapy session is priced at $900. We open at 2:30 PM on Tuesdays… our opening hours are fixed and we can't make exceptions."*

Exactly the behaviour we want.

---

**7. Where things stand**

Fixed and verified:

- Bot no longer answers from general knowledge — it now searches the customer's content before every answer. Measured across all four chatbots: **0 of 30 questions** now skip retrieval, down from 4.
- Off-topic questions are declined rather than answered.
- No false booking claims.
- Internal instructions and tool details are no longer disclosed.

Next: cleaning crawled page content, which is the single change that will most improve answer quality — the 0.467 vs 0.845 gap above is the evidence for it.

Happy to walk through any of this in more detail.
