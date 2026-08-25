# RAG & Tool-Calling Failure Modes

Audit of the pipeline **as it exists on `feature/responses-api-migration`**, ignoring the
uncommitted changes. Each item was verified against the code or live data — the
evidence column says how. The last section revisits which of these the pending
changes actually fix.

Severity: **S1** customer-visible wrong/missing answers · **S2** data loss or security ·
**S3** cost/latency/maintainability.

---

## A. Ingestion (crawl → chunk → embed → upsert)

| # | Failure | Sev | Evidence |
|---|---|---|---|
| A1 | **Crawl succeeds, zero chunks stored.** `obj.cleanedText?.forEach(...)` silently produces no chunks when a link has no text, yet `collection.insertOne` still records the source. Bot trains "successfully" with an empty knowledge base. | S1 | `store-v2.js:522`; observed on `FloatingAgent` — `contentLength: 0`, `dataID: []` |
| A2 | **Mongo and Pinecone disagree.** `chatbots-data.dataID` is written after upsert with no transaction. A partial upsert leaves ids recorded that don't exist, or vectors that nothing references. | S2 | `store-v2.js` — `generateChunksNEmbeddForLinks().then(insertOne)`; no rollback |
| A3 | **Extraction errors stored as knowledge.** PDF extraction posts to an external Cloud Run service; on failure the error string is embedded as content. A bot then "answers" from `"No PDF file specified."` | S1 | `ReadContent.js:12`; matches the client's `get_reference` source panel |
| A4 | **Boilerplate dominates chunks.** Fixed 2000-char windows with 200-char overlap, no HTML/nav stripping. Every page's first chunk is GTM iframe + nav + a wall of `Frame*.svg` URLs. | S1 | `fetch-links/api/route.ts:344`; verified in stored vector `014815af-…` |
| A5 | **No dedup across pages.** Header/footer text (opening hours, address) repeats in every page's chunks, so near-identical vectors crowd out the top-k. | S3 | 4 of 4 retrieved chunks for one query shared the same footer block |
| A6 | **Crawler is Linux-only.** `@sparticuz/chromium-min` ships an ELF binary for Lambda; on Windows/macOS dev it cannot run at all. | S3 | verified: `chromium.br` magic bytes `7f454c46` = ELF |

## B. Retrieval

| # | Failure | Sev | Evidence |
|---|---|---|---|
| B1 | **No score threshold.** Top-10 are taken regardless of similarity. A question with no relevant content still returns 10 chunks, and the model answers from them. | S1 | `pinecone.js:309` `.slice(0, 10)` — no `score >` filter anywhere |
| B2 | **LLM relevance filter can empty the context.** A second gpt-4o pass keeps a subset; if it keeps none, the model answers with no context and says "I couldn't retrieve information". | S1 | `pinecone.js` filter block; failure path had no logging before this work |
| B3 | **Query expansion is unbounded in cost.** Comment says "Limit to 3 queries max" but the code slices to 10. Each variation is a separate embedding + Pinecone query. | S3 | `pinecone.js:233` — comment contradicts `slice(0, 10)` |
| B4 | **Two sequential LLM calls per retrieval.** Query expansion + relevance filter, plus N searches, ≈6s warm. | S3 | measured: 5.1–6.8s warm, 15.4s on Vercel cold |
| B5 | **No timeouts on OpenAI/Pinecone calls.** A stalled dependency runs until the function limit. | S2 | no `timeout`/`maxRetries` set on any client in `pinecone.js` |
| B6 | **Tenant isolation depends on one metadata field.** Namespace is `userId`; separation between a user's own chatbots is only `filter: { chatbotId }`. A vector upserted without that field is invisible; a vector with the wrong one leaks across that user's bots. | S2 | `pinecone.ts:26` namespace=userId; `pinecone.js:257` filter |

## C. Tool calling

| # | Failure | Sev | Evidence |
|---|---|---|---|
| C1 | **25 of 34 declared tools have no handler.** The model is given full JSON schemas for tools that return `"This functionality will be available soon"`. | S1 | diff of `getAssistantTools` names vs `functionCallHandler` branches |
| C2 | **Tools offered for unconfigured integrations.** Shopify tools are attached to both SME types; 10 bots have them with no store connected. | S1 | `integrations: {}` on all 10 `*-sme-business` bots |
| C3 | **`get_reference` is documented as a fallback.** 10 of 13 prompts say "use for inquiries not covered by the above functions" — demoting the only tool that reads the bot's own data. | S1 | lines 35, 93, 270, 392, 438, 602, 738, 830, 858, 942 |
| C4 | **Pricing questions routed to a dead tool.** "How much is a float session" → `get_services` **8/8**, which has no handler. | S1 | measured, 8 trials, gpt-4o @ temp 1 |
| C5 | **Selection is non-deterministic.** `tool_choice` unset (→ `auto`) with `temperature: 1`. Same question, different tool between runs. | S1 | `find_product` 7/8 vs `get_reference` 1/8 on the same query |
| C6 | **Tool result errors are indistinguishable from empty retrieval.** Every failure collapses to `"Error while proccesing your request"`. | S1 | `functionCallHandler.ts` catch block |
| C7 | **Non-2xx responses parsed as success.** No `response.ok` check before `.json()`. | S1 | `functionCallHandler.ts` `get_reference` branch |
| C8 | **Model claims capabilities it lacks.** With booking tools absent it still says "I'll book you a session… provide your name, email, phone." | S1 | observed turn 5 of a live 5-turn run |
| C9 | **Prompt hardcodes booking rules regardless of calendar.** `buildDynamicContext` always injects "CRITICAL BOOKING RULES" telling it to collect PII and call `create_booking`. | S1 | `messages/route.ts` `buildDynamicContext` |

## D. Conversation / multi-turn

| # | Failure | Sev | Evidence |
|---|---|---|---|
| D1 | **Stale context reuse.** Chained via `previous_response_id`, later turns answer from earlier retrieved chunks without re-retrieving. Correct when the fact happens to be in scope, silently wrong when it isn't. | S1 | turns 3–4 of a live run answered with **no tool call** |
| D2 | **Session state is a single Mongo doc per bot+date.** `chat-history.chats` is an object keyed by sessionId; concurrent writes to the same doc can interleave. | S3 | verified shape: `chats: { <sessionId>: { messages: [...] } }` |
| D3 | **Tool set could change mid-conversation** if the two routes disagree about what to offer. | S2 | `messages/route.ts` and `actions/route.ts` each build tools independently |

## E. Security / data integrity

| # | Failure | Sev | Evidence |
|---|---|---|---|
| E1 | **`/api/pinecone` is unauthenticated.** Pages Router routes never pass through `apiHandler`/`jwtMiddleware`. Anyone who knows a `chatbotId` + `userId` can dump that tenant's chunks. | **S2** | verified: `curl` from outside with no cookie returned content |
| E2 | **Non-POST to `/api/pinecone` DELETES a chatbot** — its vectors, settings, `user-chatbots` row, WhatsApp and Telegram records. | **S2** | `pinecone.js` — `if (method === "POST") {...} else { …deleteMany… }` |
| E3 | **`/api/get-db-data` reads any collection.** Takes `collection`, `filter`, `projection` straight from the body, unauthenticated, no allowlist, no limit. | **S2** | `get-db-data..js:12-14` |
| E4 | **Deleting a bot orphans vectors** when `dataID` is empty (see A1/A2) — the delete path collects ids from Mongo. | S2 | `pinecone.js` delete branch; `FloatingAgent` had 87 live vectors and `dataID: []` |
| E5 | **Secrets in `NEXT_PUBLIC_*`.** `OPENAI_KEY`, `MONGO_URI`, `PINECONE_KEY`, `JWT_SECRET`. One client-side import inlines them into the browser bundle. | S2 | `.env`, 17 usages |
| E6 | **Shopify tokens stored in plaintext** in `user-chatbots.integrations`. | S2 | read a live `shpat_…` token with ordinary DB access |
| E7 | **Credentials leak through error messages.** `node-fetch` embeds the whole `Authorization` header in its TypeError, which then lands in logs. | S2 | the production log that exposed the OpenAI key |
| E8 | **Dead unauthenticated routes.** `/api/chat` (edge) has no callers in `src` but is still deployed; `get_db_data` likewise. | S3 | grep: zero call sites |

## F. Configuration

| # | Failure | Sev | Evidence |
|---|---|---|---|
| F1 | **`maxDuration` exports are inert on Next 13.4.** Vercel only reads them from ≥13.5; below that it must come from `vercel.json`. `fetch-links`, `store-v2` and both webhooks all rely on the code export. | S1 | Vercel docs; measured 504 at exactly 15.34s |
| F2 | **`serverExternalPackages` is a Next 15 key** — rejected with a warning on 13.4. | S3 | dev server warning |
| F3 | **Env values are not sanitised.** A trailing newline on the OpenAI key made every LangChain call fail after 7 retries (~105s) with a misleading `APIConnectionError`. | S1 | production log |

---

## What the pending changes actually fix

Honest accounting — several items are **not** addressed.

| Change | Fixes | Does **not** fix |
|---|---|---|
| `vercel.json` `maxDuration` | F1 for `/api/pinecone` only | F1 for `fetch-links`, `store-v2`, webhooks |
| `.trim()` on keys | F3 for whitespace | F3 for zero-width chars (`trim()` won't strip them) |
| `[rag]` phase logging | makes A1–B6 diagnosable | none of them directly |
| `response.ok` check | C7, C6 partially | — |
| Tool filtering | C1, C2, C4 | C3, C5 |
| Capability note + conditional booking rules | C8, C9 | — |
| `get_reference` description rewrite | C3 partially (measured 8/8 filtered, 6/8 unfiltered) | C5 |

**Untouched and still live: E1, E2, E3, E4, E5, E6, E7, A1–A6, B1–B6, D1, D2.**

The three I would escalate today are **E1**, **E2** and **E3** — an unauthenticated
read of any tenant's data, an unauthenticated destructive delete, and an
unauthenticated arbitrary-collection read.
