# Staging merge — August 2026

What went into `feature/responses-api-migration`, where each piece came from, and
what it fixes.

Five commits. Production code only — roughly 127 evaluation scripts and result
files stayed on their source branches, because they are development tooling and
would be noise in a product branch.

---

## Source branches

| Branch | Merged | Notes |
|---|---|---|
| `fix/crawler-extraction` | production files only | crawler, chunking, retrieval depth |
| `rag-testing-deepeval` | production files only | grounding, tool selection, retrieval logging |
| `crawler-extraction-analysis` | **not merged** | every commit already inside `fix/crawler-extraction` — safe to delete |

Two further commits were made directly on staging, fixing defects found by
running the app rather than by review.

---

## 1. Crawler extraction and retrieval tuning
`9d9196ff` — from `fix/crawler-extraction`

### Crawl scope and de-duplication
`src/app/(secure)/home/fetch-links/api/route.ts`

Links were kept only when the URL literally started with the entered address.
A customer entering a path, or a domain that redirects, had **exactly one page
indexed and no error shown**. Scoping now compares the landed host.

    musaffa   1 -> 10 pages
    livall    1 -> 10 pages

URLs are also canonicalised before the visited check. 18 pages were being stored
twice and charged twice against customers' crawl allowances.

### Extraction and chunking
`src/app/_helpers/server/crawl-extract.ts` (new)

turndown with the GFM plugin replaces a hand-written text walk. Measured across
45 pages:

| | before | after |
|---|---|---|
| glued words per 1k chars | 11.1 | 2.7 |
| image URL chars per page | 406 | 0 |
| mid-word chunk cuts | 37.6% | 0% |

Chunking is recursive at 3000/600, chosen over eleven alternatives by measuring
Contextual Precision with the embedding model and top-K held fixed:

| chunker | precision | chunks |
|---|---|---|
| **recursive-3000** | **0.712** | **157** |
| overlap-0 | 0.707 | 204 |
| heading-based (previous) | 0.655 | 334 |
| recursive-500 | 0.629 | 932 |
| semantic | 0.619 | 762 |

**+5.7 points of precision, recall unchanged, less than half the chunks** — so
embedding and vector storage cost roughly halve too.

Two results here contradict the usual advice, which is why they were measured
rather than assumed: precision *rises* with chunk size up to 3000 and falls at
4000, and overlap *hurts* precision — zero overlap beat 200, 400 and 800.

### Retrieval depth
`src/pages/api/pinecone.js`

Keep the best 5 results rather than 10:

| top-K | precision | relevancy | recall | context sent |
|---|---|---|---|---|
| 20 | 0.651 | 0.238 | 0.733 | 36k chars |
| 10 (was) | 0.687 | 0.265 | 0.723 | 22k chars |
| **5** | **0.729** | **0.280** | **0.705** | **12k chars** |
| 3 | 0.757 | 0.319 | 0.674 | 8k chars |

Retrieving more actively hurts. k=3 scores best but costs 5 points of recall —
the metric that maps to answering with facts missing — so k=5 takes most of the
gain for a recall cost inside the noise, and **halves the context sent to the
model on every message**.

Score thresholds were tried and rejected: they cut recall by 6 points while
adding less relevancy than simply lowering k.

An LLM reranker was also measured and **deliberately excluded**: −1.8 precision,
−9.4 recall, and it would add roughly a cent per question in perpetuity.

### `vercel.json`
`maxDuration` for the crawl route. The route segment config is ignored on Next
13.4, so long crawls were cut off at the platform default.

---

## 2. RAG grounding and tool selection
`b0f10db7` — from `rag-testing-deepeval`

- `assistant-tools.ts` (new) — tool definitions and selection
- `messages/route.ts`, `actions/route.ts` — grounding and tool-call handling
- `functionCallHandler.ts`, `ChatV2.tsx` — client dispatch
- `pinecone.js` — retrieval logging, timing, explicit empty-context warning, and
  error paths that previously failed silently

**`pinecone.js` needed a hand-merge.** This branch rewrites 165 lines of it while
staging had just changed retrieval depth in the same file. A whole-file conflict
came back, so their version was taken as the base and the top-K change
re-applied on top, anchored on the sort block. Verified afterwards: the diff
against the source branch is exactly the top-K hunk and nothing else.

The logging earned its place immediately — a Pinecone failure surfaced as a
structured error naming the phase and elapsed time, where previously it produced
a confident ungrounded answer.

---

## 3. Four defects blocking local use
`6d3b7899` — found by running the app, not by review

All four predate the merges. Each blocked the next, so they surfaced one at a
time. **None were caught by typecheck, syntax check or code review** — the app
compiled cleanly while login was completely broken.

### OAuth sign-in never succeeded
`src/app/api/auth/[...nextauth]/route.ts`

next-auth's openid-client defaults to a **3500 ms** timeout on provider
discovery. Google's `.well-known/openid-configuration` measured **11.6 s**, so
every attempt failed with `RPError: outgoing request timed out` and users landed
on `?error=OAuthSignin` with no explanation. Raised to 20 s.

### Sessions failed to load
`src/db.js`

`maxPoolSize: 1` — every concurrent request queued behind a single connection,
and a 10 s idle timeout kept tearing it down. NextAuth failed with
`MongoServerSelectionError after 10000ms` while a direct connection to the same
cluster completed in 1.6 s. Raised to 5 (kept modest for serverless, where each
instance holds its own client and Atlas caps connections), idle 10 s → 60 s,
selection 10 s → 30 s.

### First file upload always crashed
`src/app/_components/Source-Upload/SourceUpload.tsx`

`defaultFileList` is undefined for a chatbot with no files. It was read with
optional chaining then **spread unguarded**, so the first upload to any new
chatbot threw `defaultFileList is not iterable`. The delete path had the same
flaw.

### Retrieval failed intermittently
`src/pages/api/pinecone.js`

The first Pinecone connection from a cold runtime stalls and the SDK gives up
before it completes. Measured over 8 consecutive calls in one process:

    attempt 1   FAILED at 10702ms
    attempt 2   FAILED at 10614ms
    attempt 3       ok at   188ms
    attempts 4-8    ok at  ~130ms

It surfaced as `PineconeConnectionError: fetch failed`, which reads like an
outage and is not one — curl reached the same endpoint in 0.36 s while node
fetch was still stalling. A retrying `fetchApi` turns it into a warm success.
Errors are retried; HTTP responses are not, so a 4xx or 5xx still reaches the
caller unchanged.

---

## 4. Retrieval reliability
`4f3235cf`

### The bot sometimes did not search at all

`tool_choice` defaulted to `"auto"`, so whether `get_reference` ran was **sampled
at the chatbot's temperature** — 1 for most of them. Asking *"what this means in
code: Python SDK v2"* skipped retrieval entirely and answered from a one-line
summary already in the thread, while the uploaded document had a section by
exactly that name containing the code.

Instructions do not fix this. `buildGroundingRules` already said *"SEARCH BEFORE
YOU DECIDE … call get_reference FIRST"* and it was ignored. `tool_choice` is
enforced by the API rather than by prompt compliance — the difference between a
fix and a hope, and OpenAI's own documented remedy for this case.

Small talk is exempted so "hi" does not trigger a vector search. The test is
deliberately narrow — a short message that is *only* a greeting — because
wrongly forcing a search wastes one lookup, while wrongly skipping one produces
an ungrounded answer.

### Follow-ups searched with unsearchable queries

Forcing the call is not enough: a vector search for *"and what about pricing?"*
matches nothing. Conversational RAG normally rewrites the question into a
standalone query as a separate step using dialogue history — not possible here,
because history lives server-side behind `previous_response_id`.

The model writes the `userQuery` argument itself and does hold that history, so
the requirement now lives on the tool description: a standalone query with
pronouns resolved from the conversation.

---

## Verification

Tested in a browser against a real uploaded document, not only in a harness.

| check | result |
|---|---|
| login | works |
| document upload and indexing | works |
| retrieval executes | yes, `pinecone.js` end to end |
| chunks returned | 5 — the new cap |
| relevance scores | 0.75 – 0.82 |
| **grounding** | **13/13 retrieved sentences verbatim in the source file** |
| hallucinated content | none |

Tool-choice behaviour, from the server log:

    HI                                  -> not forced, no search    correct
    What this means in code: Python...  -> forced, 5 chunks         correct
    walk me through key technical...    -> forced, 5 chunks         correct
    HI                                  -> not forced, no search    correct

The second query is conversational with no searchable nouns and still returned
the right passages. The first returns the section it previously missed.

---

## Not included, deliberately

- **LLM reranker** — measured at −1.8 precision and −9.4 recall against the k=5
  baseline, and would add ~$0.01 per question permanently
- **`text-embedding-3-small`** — no quality gain over ada-002 (recall 0.526 vs
  0.532); the 5× cost saving is real but requires re-embedding all customer
  content, so it should wait until something else forces a re-index
- **Semantic and parent-document chunking** — both lost to recursive-3000
- **Evaluation harnesses** — remain on `fix/crawler-extraction` and
  `rag-testing-deepeval`

---

## Open items

- **Re-crawl affected customers.** musaffa and livall were indexed under the old
  scoping bug and still hold one page each.
- **Cookie-consent walls.** Sites showing a consent banner have the banner
  indexed instead of their content. Dismissal logic exists in the eval harness
  but is not in the production crawler.
- **`NEXT_PUBLIC_OPENAI_KEY`.** Server-side only today and verified absent from
  the client bundle, but the `NEXT_PUBLIC_` prefix means one client-side
  reference would publish it to every visitor. Worth renaming.
- **`crawler-extraction-analysis`** can be deleted.
