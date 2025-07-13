import { openai } from "@/app/openai";
import clientPromise from "@/db";
import { cacheManager, generateContentHash } from "@/lib/redis";
import { performanceMonitor } from "@/lib/cache-utils";

export const runtime = "nodejs";

// Send a new message to a thread
export async function POST(request: any, { params: { threadId } }: any) {
  const startTime = Date.now();
  const { content, assistantId } = await request.json();
  const endpoint = `/api/assistants/threads/${threadId}/messages`;

  try {
    // Step 1: Check for cached message response
    const cachedResponse = await cacheManager.getCachedMessageResponse(
      threadId,
      content
    );
    if (cachedResponse) {
      const responseTime = Date.now() - startTime;
      performanceMonitor.recordCacheHit(endpoint, responseTime);
      console.log(
        `Cache hit for message in thread ${threadId} - Response time: ${responseTime}ms`
      );
      return new Response(JSON.stringify(cachedResponse), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 2: Check for cached assistant data
    let assistantData = await cacheManager.getCachedAssistantData(assistantId);

    if (!assistantData) {
      // Cache miss - fetch from database
      console.log(`Cache miss for assistant data: ${assistantId}`);
      const db = (await clientPromise!).db();
      const collection = db.collection("chatbots-data");

      assistantData = await collection
        .find({
          chatbotId: assistantId,
        })
        .toArray();

      // Cache the assistant data for future requests
      await cacheManager.cacheAssistantData(assistantId, assistantData);
    }

    // Step 3: Check for cached schema info
    let schemaInfo = await cacheManager.getCachedSchemaInfo(assistantId);

    if (!schemaInfo) {
      // Extract schema info from assistant data
      schemaInfo = assistantData
        .map((data: any) => data.schema_info)
        .filter((info: any) => info !== undefined);

      // Cache the schema info
      await cacheManager.cacheSchemaInfo(assistantId, schemaInfo);
    }

    // Step 4: Build user query with schema info
    let userQuery = `userQuery: ${content} \n\n schema_info: ${JSON.stringify(
      schemaInfo
    )} `;

    // Step 5: Cache thread context for better conversation flow
    const threadContext = {
      lastMessageContent: content,
      assistantId,
      schemaInfoCount: schemaInfo.length,
      timestamp: Date.now(),
    };
    await cacheManager.cacheThreadContext(threadId, threadContext);

    // Step 6: Create message and run stream
    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: userQuery,
    });

    const stream = openai.beta.threads.runs.stream(threadId, {
      assistant_id: assistantId,
      // instructions: "You are a helpful assistant.",
    });

    const responseTime = Date.now() - startTime;
    performanceMonitor.recordCacheMiss(endpoint, responseTime);
    console.log(`Total processing time: ${responseTime}ms`);

    // Note: For streaming responses, we can't cache the full response here
    // But we've cached the database queries which is the main performance bottleneck
    return new Response(stream.toReadableStream());
  } catch (error) {
    console.error("Error in message processing:", error);

    // Record performance even on error
    const responseTime = Date.now() - startTime;
    performanceMonitor.recordCacheMiss(endpoint, responseTime);

    // Fallback to original implementation if caching fails
    const db = (await clientPromise!).db();
    const collection = db.collection("chatbots-data");

    const assistantData = await collection
      .find({
        chatbotId: assistantId,
      })
      .toArray();

    const schemaInfo = assistantData
      .map((data: any) => data.schema_info)
      .filter((info: any) => info !== undefined);

    let userQuery = `userQuery: ${content} \n\n schema_info: ${JSON.stringify(
      schemaInfo
    )} `;

    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: userQuery,
    });

    const stream = openai.beta.threads.runs.stream(threadId, {
      assistant_id: assistantId,
    });

    return new Response(stream.toReadableStream());
  }
}

export const maxDuration = 300;
