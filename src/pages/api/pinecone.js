import { Pinecone } from "@pinecone-database/pinecone";

import { createEmbedding } from "../../app/_helpers/server/embeddings";
import clientPromise from "../../db";
import { deletevectors } from "../../app/_helpers/server/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { MultiQueryRetriever } from "langchain/retrievers/multi_query";
import { openai } from "@/app/openai";

/// retrieval does 2 LLM calls + pinecone searches; without this it hits the
/// default limit and returns FUNCTION_INVOCATION_TIMEOUT (504)
export const config = {
  maxDuration: 300,
};

/// phase logging - every line is prefixed [rag <id>] so one request can be
/// followed end to end in the vercel runtime logs
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
    const pineconeIndexName = process.env.NEXT_PUBLIC_PINECONE_INDEX?.trim();

    const log = ragLogger();
    log.step("request", {
      chatbotId,
      namespace: userId,
      queryLength: userQuery?.length ?? 0,
      historyCount: Array.isArray(messages) ? messages.length : 0,
      hasPineconeKey: !!pineconeKey,
      pineconeIndex: pineconeIndexName ?? null,
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
      });

      const pineconeIndex = pinecone.Index(pineconeIndexName);

      log.step("pinecone.connect");
      /// confirms the index is actually reachable from this runtime, and
      /// whether the caller's namespace holds any vectors at all
      const stats = await pineconeIndex.describeIndexStats();
      log.step("pinecone.stats", {
        dimension: stats?.dimension,
        totalRecords: stats?.totalRecordCount,
        namespaceRecords: stats?.namespaces?.[userId]?.recordCount ?? 0,
        namespaceExists: !!stats?.namespaces?.[userId],
      });

      log.step("vectorstore.init");
      const vectorStore = await PineconeStore.fromExistingIndex(
        new OpenAIEmbeddings({ apiKey: openaiKey, timeout: 20000, maxRetries: 2 }),
        { pineconeIndex, namespace: userId }
      );

      /// Custom Multi-Query Retriever with Scores
      const llm = new ChatOpenAI({
        apiKey: openaiKey,
        model: "gpt-4o",
        timeout: 25000,
        maxRetries: 2,
      });

      // Generate multiple query variations
      const multiQueryPrompt = PromptTemplate.fromTemplate(
        `You are an AI language model assistant. Your task is
        to generate {queryCount} different versions of the given user
        question corresponding to the Chat History to retrieve relevant documents from a vector database.
        By generating multiple perspectives on the user question,
        your goal is to help the user overcome some of the limitations
        of distance-based similarity search.

        Replace any number or words like it, that, etc according to the user's flow.

        Provide these alternative questions separated by newlines between XML tags. For example:

        <questions>
        Question 1
        Question 2
        Question 3
        </questions>

        Chat History: {chatHistory}

        Original question: {question}`,
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

      // Custom multi-query retrieval with scores
      const allResultsWithScores = [];

      // Search with each query variation
      let searchFailures = 0;
      for (const [i, query] of queries.entries()) {
        const searchStartedAt = Date.now();
        try {
          log.step(`search.${i}`, { query: query?.slice(0, 80) });
          const results = await vectorStore.similaritySearchWithScore(
            query,
            10,
            {
              chatbotId: chatbotId,
            }
          );
          log.step(`search.${i}.done`, {
            matches: results.length,
            ms: Date.now() - searchStartedAt,
            topScore: results[0]?.[1],
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
          uniqueResults.get(contentKey)[1] > score
        ) {
          uniqueResults.set(contentKey, [doc, score, sourceQuery]);
        }
      });

      // Sort by score and keep the best 5.
      //
      // Was 10 (the comment said 3, which had been wrong for a while).
      // Measured across 68 questions, chunker and embedding held fixed:
      //
      //   k=20   precision 0.651   relevancy 0.238   recall 0.733   36k chars
      //   k=10   precision 0.687   relevancy 0.265   recall 0.723   22k chars
      //   k=5    precision 0.729   relevancy 0.280   recall 0.705   12k chars
      //   k=3    precision 0.757   relevancy 0.319   recall 0.674    8k chars
      //
      // Retrieving more actively hurts: k=20 is worst on precision and
      // relevancy while buying almost no recall. k=3 scores best but costs 5
      // points of recall, the metric that maps to answering with facts
      // missing. k=5 takes most of the gain for a recall cost inside the
      // noise, and halves the context sent to the model.
      //
      // Score thresholds were tried instead and rejected - they cut recall by
      // 6 points while adding less relevancy than simply lowering k.
      const retrievedDocsWithScores = Array.from(uniqueResults.values())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([doc, score]) => [doc, score]); // Remove sourceQuery for consistency

      /// extract only needed field from the retrieved documents with scores
      let similaritySearch = retrievedDocsWithScores.map(([doc, score]) => {
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

        return { content, source, filename, score, source_url, dimensions };
      });

      log.step("rank.done", {
        uniqueMatches: uniqueResults.size,
        kept: similaritySearch.length,
        topScore: similaritySearch[0]?.score,
        emptyContent: similaritySearch.filter((c) => !c.content?.trim()).length,
      });

      // --- Filter retrieved chunks using OpenAI to keep only those relevant to the original query ---
      log.step("relevance-filter.llm", { chunksIn: similaritySearch.length });
      try {
        // Build a compact listing of chunks to avoid hitting token limits
        const maxChunkChars = 1500;
        const chunksList = similaritySearch
          .map((c, i) => {
            const truncated = c.content
              ? c.content.slice(0, maxChunkChars)
              : "";
            return `${i}: ${truncated.replace(/\n+/g, " ")}`;
          })
          .join("\n\n");

        const systemPrompt = "You are a strict filter that decides whether a text chunk is relevant to a user's question. Return a JSON object with a single key \"keep\" whose value is a list of integer indices of the chunks that should be kept (in original order). Do not return any other text.";

        const userPrompt = `Original question: ${userQuery}\n\nChunks:\n${chunksList}\n\nOnly return valid JSON, for example: {\"keep\": [0,2]}`;

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
            // Find the first JSON start (either { or [) to avoid non-JSON prefixes
            const jsonStart = raw.search(/[\{\[]/);
            if (jsonStart !== -1) {
              const parsed = JSON.parse(raw.slice(jsonStart));
              if (parsed && Array.isArray(parsed.keep)) {
                const keepSet = new Set(parsed.keep.map((n) => Number(n)));
                similaritySearch = similaritySearch.filter((_, i) => keepSet.has(i));
              } else {
                console.warn("OpenAI filter returned unexpected JSON, skipping filter.", parsed);
              }
            } else {
              console.warn("No JSON found in OpenAI filter response, skipping filter.", raw);
            }
          } catch (parseErr) {
            console.warn("Failed to parse OpenAI filter response, skipping filter.", parseErr, raw);
          }
        } else {
          console.warn("Empty response from OpenAI filter, returning unfiltered results.");
        }
      } catch (filterError) {
        console.error("Error while filtering chunks with OpenAI, returning unfiltered results:", filterError);
      }

      log.step("respond", {
        chunks: similaritySearch.length,
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
