import { Pinecone } from "@pinecone-database/pinecone";

import { createEmbedding } from "../../app/_helpers/server/embeddings";
import clientPromise from "../../db";
import { deletevectors } from "../../app/_helpers/server/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { openai } from "@/app/openai";
import {
  getHybridAlpha,
  getPineconeIndexName,
  getRerankCandidateLimit,
  getRerankTopN,
  isHybridSearchEnabled,
  isRerankEnabled,
} from "../../app/_helpers/server/hybrid-config";
import { hybridQuery } from "../../app/_helpers/server/hybrid-search";
import { generateSparseQueryEmbedding } from "../../app/_helpers/server/sparse-embeddings";
import { rerankDocuments } from "../../app/_helpers/server/rerank";
import {
  boostedRetrievalScore,
  contactSparseQuery,
  isContactQuery,
  isOrgHistoryQuery,
  orgHistorySparseQuery,
} from "../../app/_helpers/server/retrieval-boost";
import { MULTI_QUERY_PROMPT_TEMPLATE } from "../../app/_helpers/server/multi-query-prompt";

/// retrieval does 2 LLM calls + pinecone searches; without this it hits the
/// default limit and returns FUNCTION_INVOCATION_TIMEOUT (504)
export const config = {
  maxDuration: 300,
};

function ragLogger() {
  const id = Math.random().toString(36).slice(2, 8);
  const startedAt = Date.now();
  let current = "init";
  return {
    get phase() {
      return current;
    },
    step(name, data) {
      current = name;
      console.log(
        `[rag ${id}] ${name} +${Date.now() - startedAt}ms`,
        data ? JSON.stringify(data) : ""
      );
    },
    fail(error) {
      console.error(
        `[rag ${id}] FAILED during "${current}" after ${Date.now() - startedAt}ms:`,
        error?.name,
        "-",
        error?.message,
        error?.cause ? `| cause: ${error.cause?.message ?? error.cause}` : ""
      );
      if (error?.stack) console.error(error.stack.split("\n").slice(0, 4).join("\n"));
    },
    elapsed: () => Date.now() - startedAt,
  };
}

/** Keep filter picks first, then backfill from ranked pool up to finalK. */
function mergeToFinalK(filtered, unfiltered, finalK) {
  const seen = new Set();
  const out = [];
  const keyOf = (doc) => doc?.content ?? doc?.pageContent ?? doc;

  for (const doc of filtered) {
    const key = keyOf(doc);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(doc);
    if (out.length >= finalK) break;
  }
  if (out.length < finalK) {
    for (const doc of unfiltered) {
      const key = keyOf(doc);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(doc);
      if (out.length >= finalK) break;
    }
  }
  const result = out.length > 0 ? out : unfiltered.slice(0, finalK);
  return result.sort((a, b) => (b?.score ?? 0) - (a?.score ?? 0));
}

export default async function handler(req, res) {
  if (req.method === "POST") {
    // await pinecone.init({
    //   environment: process.env.NEXT_PUBLIC_PINECONE_ENV,
    //   apiKey: process.env.NEXT_PUBLIC_PINECONE_KEY,
    // });
    // const index = pinecone.Index(process.env.NEXT_PUBLIC_PINECONE_INDEX);
    // const tr = await index.delete1({
    //   deleteAll: true,
    //   namespace: undefined,
    // });
    // return res.status(200).send(tr);
    /// parse the request object

    /// if req.body is not a string, parse it
    if (typeof req.body === "string") {
      try {
        req.body = JSON.parse(req.body);
      } catch (error) {
        console.error("Error parsing request body:", error);
        return res.status(400).send("Invalid JSON format in request body");
      }
    }
    const body = req.body;
    const userQuery = body?.userQuery;
    const chatbotId = body?.chatbotId;
    const userId = body?.userId;
    const messages = body?.messages ? body?.messages : {};

    /// a trailing newline in the env var makes node-fetch reject the auth
    /// header ("is not a legal HTTP header value"), which langchain retries 7
    /// times before failing — surfacing as a slow 500 rather than an auth error
    const openaiKey = process.env.NEXT_PUBLIC_OPENAI_KEY?.trim();
    const pineconeKey = process.env.NEXT_PUBLIC_PINECONE_KEY?.trim();
    const pineconeIndexName = getPineconeIndexName();
    const hybridSearchEnabled = isHybridSearchEnabled();

    const log = ragLogger();
    log.step("request", {
      chatbotId,
      namespace: userId,
      queryLength: userQuery?.length ?? 0,
      historyCount: Array.isArray(messages) ? messages.length : 0,
      hasPineconeKey: !!pineconeKey,
      pineconeIndex: pineconeIndexName ?? null,
      hybridSearchEnabled,
      hybridAlpha: hybridSearchEnabled ? getHybridAlpha() : null,
      rerankEnabled: isRerankEnabled(),
      hasOpenaiKey: !!openaiKey,
      /// flags the exact defect above without printing any secret.
      /// illegalHeaderChar uses node-fetch's own rule, so it catches invisible
      /// characters that trim() cannot strip (zero-width space and friends)
      openaiKeyNeededTrim:
        (process.env.NEXT_PUBLIC_OPENAI_KEY ?? "").length !==
        (openaiKey ?? "").length,
      openaiKeyIllegalHeaderChar: /[^\t\x20-\x7e\x80-\xff]/.test(openaiKey ?? ""),
      pineconeKeyNeededTrim:
        (process.env.NEXT_PUBLIC_PINECONE_KEY ?? "").length !==
        (pineconeKey ?? "").length,
    });

    /// missing ids mean retrieval can never match anything, so fail loudly
    /// rather than returning an empty context the model will answer blind from
    if (!userQuery || !chatbotId || !userId) {
      console.error("[rag] missing required field", {
        hasUserQuery: !!userQuery,
        hasChatbotId: !!chatbotId,
        hasUserId: !!userId,
      });
      return res
        .status(400)
        .json({ error: "userQuery, chatbotId and userId are required" });
    }
    // /// create the embedding of user query
    // const embed = await createEmbedding(userQuery);

    // /// set the params of pinecone embeddings retrival
    // const queryRequest = {
    //   vector: embed,
    //   topK: 3,
    //   includeMetadata: true,
    //   filter: {
    //     chatbotId: chatbotId,
    //   },
    // };

    try {
      // const pinecone = new Pinecone({
      //   apiKey: process.env.NEXT_PUBLIC_PINECONE_KEY,
      // });
      // const index = pinecone.index(process.env.NEXT_PUBLIC_PINECONE_INDEX);
      // try {
      //   /// query embeddings
      //   const ns = index.namespace(userId);
      //   const response = await ns.query(queryRequest);
      //   /// extract the content
      //   const extractedContents = response?.matches?.map(
      //     (item) => item.metadata["content"]
      //   );
      //   return res.status(200).send(extractedContents);
      // } catch (error) {
      //   console.error("Error during queryfetch:", error);
      //   return res.status(200).send(error.message);
      // }

      /// no timeouts were set on any client, so a stalled dependency burned the
      /// whole function budget. Measured: PineconeConnectionError after 10s,
      /// and langchain retrying an unreachable OpenAI 7 times for ~105s.
      const pinecone = new Pinecone({
        apiKey: pineconeKey,
        /// Retry the transport, because the first connection to Pinecone from a
        /// cold runtime stalls and the SDK gives up before it completes.
        ///
        /// Measured over 8 consecutive calls from one process:
        ///   attempt 1   FAILED at 10702ms
        ///   attempt 2   FAILED at 10614ms
        ///   attempt 3       ok at   188ms
        ///   attempts 4-8    ok at  ~130ms
        ///
        /// Once a connection is warm the API answers in about a tenth of a
        /// second; it is only the first one that hangs. The SDK surfaces that
        /// as PineconeConnectionError "fetch failed", which reads like an
        /// outage and is not one - curl reached the same endpoint in 0.36s
        /// while node fetch was still stalling.
        ///
        /// Two retries with a short backoff turn that failure into a warm
        /// success. Errors are retried, HTTP responses are not: a 4xx or 5xx
        /// is a real answer and must reach the caller unchanged.
        fetchApi: async (input, init) => {
          let lastError;
          for (let attempt = 1; attempt <= 3; attempt++) {
            try {
              return await fetch(input, init);
            } catch (error) {
              lastError = error;
              if (attempt < 3) {
                await new Promise((r) => setTimeout(r, 300 * attempt));
              }
            }
          }
          throw lastError;
        },
      });

      const pineconeIndex = pinecone.Index(pineconeIndexName);

      log.step("pinecone.connect", { hybridSearchEnabled });
      /// confirms the index is actually reachable from this runtime, and
      /// whether the caller's namespace holds any vectors at all
      const stats = await pineconeIndex.describeIndexStats();
      log.step("pinecone.stats", {
        dimension: stats?.dimension,
        totalRecords: stats?.totalRecordCount,
        namespaceRecords: stats?.namespaces?.[userId]?.recordCount ?? 0,
        namespaceExists: !!stats?.namespaces?.[userId],
      });

      let vectorStore = null;
      if (!hybridSearchEnabled) {
        log.step("vectorstore.init");
        vectorStore = await PineconeStore.fromExistingIndex(
          new OpenAIEmbeddings({ apiKey: openaiKey, timeout: 20000, maxRetries: 2 }),
          { pineconeIndex, namespace: userId }
        );
      } else {
        log.step("vectorstore.skip", { reason: "hybrid-search-enabled" });
      }

      /// Custom Multi-Query Retriever with Scores
      const llm = new ChatOpenAI({
        apiKey: openaiKey,
        model: "gpt-4o",
        timeout: 25000,
        maxRetries: 2,
      });

      // Hub base: hwchase17/multi-query-retriever + intent-preservation for KB RAG
      const multiQueryPrompt = PromptTemplate.fromTemplate(
        MULTI_QUERY_PROMPT_TEMPLATE,
        { partialVariables: { chatHistory: JSON.stringify(messages) } }
      );

      // Generate query variations
      log.step("query-expansion.llm");
      const queryVariationsMsg = await llm.invoke(
        await multiQueryPrompt.format({
          question: userQuery,
          queryCount: 3,
        })
      );
      // ChatOpenAI returns an AIMessage; extract the string content
      const queryVariations =
        typeof queryVariationsMsg === "string"
          ? queryVariationsMsg
          : queryVariationsMsg?.content ?? "";

      // Extract queries from the response
      const extractQueries = (response) => {
        const questionsMatch = response.match(/<questions>(.*?)<\/questions>/s);
        if (questionsMatch) {
          const queries = questionsMatch[1]
            .trim()
            .split("\n")
            .map((q) => q.trim())
            .filter((q) => q.length > 0);

          // Always include the original query as the first query
          const uniqueQueries = [
            userQuery,
            ...queries.filter((q) => q !== userQuery),
          ];
          return uniqueQueries.slice(0, 10); // Limit to 3 queries max
        }
        return [userQuery]; // Fallback to original query
      };

      const queries = extractQueries(queryVariations);
      log.step("query-expansion.done", {
        variationsReturned: queries.length,
        usedFallback: queries.length === 1,
      });

      const rerankEnabled = isRerankEnabled();
      const CANDIDATE_K = hybridSearchEnabled
        ? getRerankCandidateLimit()
        : 20;
      const FINAL_K = rerankEnabled ? getRerankTopN() : 5;
      // When rerank is on, keep hybrid alpha fixed — no query-type routing.
      const orgHistoryQuery = !rerankEnabled && isOrgHistoryQuery(userQuery);
      const contactQuery = !rerankEnabled && isContactQuery(userQuery);
      const hybridAlpha =
        orgHistoryQuery || contactQuery ? 0.15 : getHybridAlpha();

      async function runHybridSearch(query, alpha, topK = CANDIDATE_K, extraFilter = null) {
        const [denseVector, sparseVector] = await Promise.all([
          createEmbedding(query),
          generateSparseQueryEmbedding(query),
        ]);
        const filter = { chatbotId: { $eq: chatbotId }, ...(extraFilter || {}) };
        const queryResponse = await hybridQuery(pineconeIndex, userId, {
          denseVector,
          sparseVector,
          topK,
          filter,
          alpha,
        });
        return (queryResponse.matches ?? []).map((match) => [
          {
            pageContent: match.metadata?.content ?? "",
            metadata: match.metadata ?? {},
          },
          match.score ?? 0,
        ]);
      }

      // Custom multi-query retrieval with scores
      const allResultsWithScores = [];

      // Search with each query variation
      let searchFailures = 0;
      for (const [i, query] of queries.entries()) {
        const searchStartedAt = Date.now();
        try {
          log.step(`search.${i}`, { query: query?.slice(0, 80), hybrid: hybridSearchEnabled });
          let results = [];

          if (hybridSearchEnabled) {
            results = await runHybridSearch(query, hybridAlpha);
          } else {
            results = await vectorStore.similaritySearchWithScore(
              query,
              CANDIDATE_K,
              {
                chatbotId: chatbotId,
              }
            );
          }

          log.step(`search.${i}.done`, {
            matches: results.length,
            ms: Date.now() - searchStartedAt,
            topScore: results[0]?.[1],
            hybrid: hybridSearchEnabled,
          });

          // Add query source to each result
          results.forEach(([doc, score]) => {
            allResultsWithScores.push([doc, score, query]);
          });
        } catch (error) {
          /// one failed variation should not sink the request, but it must be
          /// visible - a silent catch here is why this looked like "no data"
          searchFailures++;
          console.error(
            `[rag] search.${i} failed after ${Date.now() - searchStartedAt}ms for "${query?.slice(0, 80)}":`,
            error?.name,
            "-",
            error?.message,
            error?.cause ? `| cause: ${error.cause?.message ?? error.cause}` : ""
          );
        }
      }

      if (hybridSearchEnabled && orgHistoryQuery) {
        try {
          log.step("search.org-history-sparse", { alpha: 0 });
          const sparseResults = await runHybridSearch(
            orgHistorySparseQuery(userQuery),
            0
          );
          sparseResults.forEach(([doc, score]) => {
            allResultsWithScores.push([doc, score, userQuery]);
          });
        } catch (error) {
          console.error("[rag] org-history sparse search failed:", error?.message);
        }
      }

      if (hybridSearchEnabled && contactQuery) {
        try {
          log.step("search.contact-sparse", { alpha: 0 });
          const sparseResults = await runHybridSearch(
            contactSparseQuery(userQuery),
            0
          );
          sparseResults.forEach(([doc, score]) => {
            allResultsWithScores.push([doc, score, userQuery]);
          });
        } catch (error) {
          console.error("[rag] contact sparse search failed:", error?.message);
        }
      }

      /// Site facts (phones/emails/etc.) are short vectors and lose to long page
      /// chunks in hybrid top-K. Always merge a dedicated site_fact pool so
      /// rerank can choose them — general, no contact-query routing.
      if (hybridSearchEnabled) {
        try {
          const SITE_FACT_K = 15;
          log.step("search.site-facts", { topK: SITE_FACT_K });
          const factResults = await runHybridSearch(
            userQuery,
            hybridAlpha,
            SITE_FACT_K,
            { chunk_type: { $eq: "site_fact" } }
          );
          factResults.forEach(([doc, score]) => {
            allResultsWithScores.push([doc, score, userQuery]);
          });
          log.step("search.site-facts.done", { matches: factResults.length });
        } catch (error) {
          console.error("[rag] site-fact search failed:", error?.message);
        }
      }

      log.step("search.all-done", {
        queries: queries.length,
        failures: searchFailures,
        rawMatches: allResultsWithScores.length,
      });

      // Remove duplicates and sort by score
      const uniqueResults = new Map();
      allResultsWithScores.forEach(([doc, score, sourceQuery]) => {
        // Create a unique key based on content and source
        const contentKey =
          (doc.metadata.content || doc.pageContent || "") +
          (doc.metadata.source || "") +
          (doc.metadata.filename || "");

        if (
          !uniqueResults.has(contentKey) ||
          uniqueResults.get(contentKey)[1] < score
        ) {
          uniqueResults.set(contentKey, [doc, score, sourceQuery]);
        }
      });

      // Keep a wide candidate set. Prefer raw hybrid scores when rerank is on;
      // legacy boosts only apply when rerank is disabled.
      // Site-fact vectors score much lower than long page chunks in hybrid — reserve
      // slots so they reach the reranker instead of being sliced away.
      const rankedUnique = Array.from(uniqueResults.values())
        .map(([doc, rawScore]) => ({
          doc,
          rawScore,
          sortScore: rerankEnabled
            ? rawScore
            : boostedRetrievalScore(userQuery, doc, rawScore),
          isSiteFact: doc?.metadata?.chunk_type === "site_fact",
        }))
        .sort((a, b) => b.sortScore - a.sortScore);

      const SITE_FACT_RESERVE = 15;
      const siteFactCandidates = rankedUnique
        .filter((r) => r.isSiteFact)
        .slice(0, SITE_FACT_RESERVE);
      const pageCandidates = rankedUnique
        .filter((r) => !r.isSiteFact)
        .slice(0, Math.max(1, CANDIDATE_K - siteFactCandidates.length));
      const retrievedDocsWithScores = [...pageCandidates, ...siteFactCandidates];

      /// extract only needed field from the retrieved documents with scores
      let similaritySearch = retrievedDocsWithScores.map(({ doc, rawScore }) => {
        let content = doc.metadata.content || "";
        /// if the meta data has image link add it as the reference in similaritysearch
        if (doc?.metadata?.image_path) {
          content += `<img src=${doc.metadata.image_path} />`;
        }

        let source = "";
        if (doc?.metadata?.source) {
          source = doc.metadata.source;
        }

        let filename = "";
        if (doc?.metadata?.filename) {
          filename = doc.metadata.filename;
        } 

        let source_url = "";
        if (doc?.metadata?.source_url || doc?.metadata?.link) {
          source_url = doc.metadata.source_url || doc.metadata.link;
        }

        let dimensions = {};
        if (doc?.metadata?.dimensions) {
          dimensions = JSON.stringify(doc.metadata.dimensions);
        }

        return { content, source, filename, score: rawScore, source_url, dimensions };
      });

      log.step("rank.done", {
        uniqueMatches: uniqueResults.size,
        kept: similaritySearch.length,
        candidateK: CANDIDATE_K,
        topScore: similaritySearch[0]?.score,
        emptyContent: similaritySearch.filter((c) => !c.content?.trim()).length,
        rerankEnabled,
      });

      // --- Cross-encoder rerank (preferred) or legacy LLM filter ---
      const unfiltered = similaritySearch;

      if (rerankEnabled && similaritySearch.length > 0) {
        log.step("rerank.start", {
          chunksIn: similaritySearch.length,
          topN: FINAL_K,
        });
        try {
          const reranked = await rerankDocuments({
            query: userQuery,
            documents: similaritySearch,
            topN: FINAL_K,
          });
          similaritySearch = reranked;
          log.step("rerank.done", {
            chunks: similaritySearch.length,
            topScore: similaritySearch[0]?.score,
            topPreview: String(similaritySearch[0]?.content || "")
              .replace(/\s+/g, " ")
              .slice(0, 120),
          });
        } catch (rerankError) {
          console.error(
            "[rag] rerank failed, falling back to hybrid top-K:",
            rerankError?.message || rerankError
          );
          similaritySearch = unfiltered.slice(0, FINAL_K);
          log.step("rerank.fallback", {
            chunks: similaritySearch.length,
            reason: rerankError?.message || "unknown",
          });
        }
      } else {
      log.step("relevance-filter.llm", { chunksIn: similaritySearch.length });
      try {
        const maxChunkChars = 1500;
        const chunksList = similaritySearch
          .map((c, i) => {
            const truncated = c.content
              ? c.content.slice(0, maxChunkChars)
              : "";
            return `${i}: ${truncated.replace(/\n+/g, " ")}`;
          })
          .join("\n\n");

        const systemPrompt = contactQuery
          ? 'You help select passages for a retrieval-augmented answer about contact details. Prefer keeping passages with WhatsApp, phone, email, address, opening hours, or location. Drop licensing, membership upsell, history-only lines, and unrelated service marketing when the question asks for contact info. Return a JSON object with a single key "keep" whose value is a list of integer indices, in original order. Do not return any other text.'
          : orgHistoryQuery
          ? 'You help select passages for a retrieval-augmented answer about an organization or publisher. Prefer keeping passages that mention years of experience, founding, history, readers, reviewers, mission, or company background. Drop passages about specific diseases, medical treatments, symptoms, or clinical articles when the question is about the organization itself. Return a JSON object with a single key "keep" whose value is a list of integer indices, in original order. Do not return any other text.'
          : 'You help select passages for a retrieval-augmented answer. Prefer keeping useful context over dropping it. A passage should be kept if it might contain facts, names, numbers, steps, definitions, or background that could help answer the question — even if it is only partly on topic. Drop a passage only when it is clearly about a different subject. Return a JSON object with a single key "keep" whose value is a list of integer indices, in original order. Do not return any other text.';

        const userPrompt = `Original question: ${userQuery}\n\nChunks:\n${chunksList}\n\nSelect up to ${FINAL_K} indices to keep. When in doubt, keep the passage. If several are useful, prefer the earlier indices. Never return an empty list. Only return valid JSON, for example: {"keep": [0,1,2,3,4]}`;

        const filterResp = await openai.chat.completions.create({
          model: process.env.NEXT_PUBLIC_OPENAI_MODEL || "gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0,
          max_tokens: 500,
        });

        const raw =
          filterResp && filterResp.choices && filterResp.choices[0]?.message
            ? filterResp.choices[0].message.content
            : null;

        if (raw) {
          try {
            const jsonStart = raw.search(/[\{\[]/);
            if (jsonStart !== -1) {
              const parsed = JSON.parse(raw.slice(jsonStart));
              if (parsed && Array.isArray(parsed.keep)) {
                const keepSet = new Set(
                  parsed.keep
                    .map((n) => Number(n))
                    .filter((n) => Number.isInteger(n) && n >= 0 && n < unfiltered.length)
                );
                const filtered = unfiltered.filter((_, i) => keepSet.has(i));
                similaritySearch = mergeToFinalK(filtered, unfiltered, FINAL_K);
              } else {
                console.warn("OpenAI filter returned unexpected JSON, skipping filter.", parsed);
                similaritySearch = unfiltered.slice(0, FINAL_K);
              }
            } else {
              console.warn("No JSON found in OpenAI filter response, skipping filter.", raw);
              similaritySearch = unfiltered.slice(0, FINAL_K);
            }
          } catch (parseErr) {
            console.warn("Failed to parse OpenAI filter response, skipping filter.", parseErr, raw);
            similaritySearch = unfiltered.slice(0, FINAL_K);
          }
        } else {
          console.warn("Empty response from OpenAI filter, returning unfiltered results.");
          similaritySearch = unfiltered.slice(0, FINAL_K);
        }
      } catch (filterError) {
        console.error("Error while filtering chunks with OpenAI, returning unfiltered results:", filterError);
        similaritySearch = unfiltered.slice(0, FINAL_K);
      }
      }

      if (similaritySearch.length > FINAL_K) {
        similaritySearch = similaritySearch.slice(0, FINAL_K);
      }

      log.step("respond", {
        chunks: similaritySearch.length,
        candidates: unfiltered.length,
        totalMs: log.elapsed(),
      });
      /// an empty context here is why the model replies "I couldn't retrieve
      /// information about X" - make that case obvious in the logs
      if (similaritySearch.length === 0) {
        console.error(
          `[rag] returning EMPTY context for chatbotId=${chatbotId} query="${userQuery?.slice(0, 80)}"`
        );
      }
      return res.status(200).send(similaritySearch);
    } catch (error) {
      /// report which phase died and the real cause, instead of rethrowing a
      /// generic message that produced an opaque 500 html page
      log.fail(error);
      return res.status(500).json({
        error: "similarity search failed",
        phase: log.phase,
        name: error?.name,
        message: error?.message,
        cause: error?.cause?.message ?? String(error?.cause ?? ""),
        elapsedMs: log.elapsed(),
      });
    }
  } else {
    /// deleting the chatbot data from pinecone
    /// parse the request object
    const body = JSON.parse(req.body);
    const chatbotId = body?.chatbotId;
    const userId = body?.userId;

    /// fetch the IDs and user namespace from the DB
    const db = (await clientPromise).db();
    const collection = db.collection("chatbots-data");
    const userChatbots = db.collection("user-chatbots");
    const userChatbotSettings = db.collection("chatbot-settings");
    const cursor = collection.find({ chatbotId: chatbotId });

    let vectorId = [];
    let namespace = "";
    for await (const doc of cursor) {
      /// get the vector id's of website crawling list
      if (Array.isArray(doc.content)) {
        doc.content.forEach((content) => {
          vectorId.push(content.dataID);
        });
      } else {
        vectorId.push(doc.dataID);
      }
      namespace = userId;
    }

    /// close the cursor
    await cursor.close();

    /// No OpenAI assistant object to delete — Responses API is stateless
    /// (chatbot config lives only in MongoDB)

    vectorId = [].concat(...vectorId);
    /// delete the vectors
    await collection.deleteMany({ chatbotId: chatbotId });
    /// delete the chatbot
    await userChatbots.deleteOne({ chatbotId: chatbotId });
    /// delete chatbot settings
    await userChatbotSettings.deleteOne({ chatbotId: chatbotId });

    //delete the whatsapp details collection record against chatbotId
    const whatsappDetails = db.collection("whatsappbot_details"); //whatsappbot_details
    await whatsappDetails.deleteOne({ chatbotId: chatbotId });

    //delete the telegram details collection's record against chatbotId
    const telegramDetails = db.collection("telegram-bot"); //whatsappbot_details
    await telegramDetails.deleteOne({ chatbotId: chatbotId });

    /// deleting the chunks to avoid  Request Header Fields Too Large error
    const deleteBatchSize = 250;
    for (let i = 0; i <= vectorId.length; i += deleteBatchSize) {
      const deleteBatch = vectorId.slice(i, i + deleteBatchSize);
      deletevectors(deleteBatch, namespace);
    }
    return res.status(200).send({ text: "Deleted successfully" });
  }
}
