import { cacheManager } from "@/lib/redis";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

// POST /api/cache/invalidate - Invalidate specific cache entries
export async function POST(request: NextRequest) {
  try {
    const { type, assistantId, threadId } = await request.json();

    if (!type) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Type is required. Options: 'assistant', 'thread', 'all'",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    switch (type) {
      case "assistant":
        if (!assistantId) {
          return new Response(
            JSON.stringify({
              status: "error",
              message:
                "assistantId is required for assistant cache invalidation",
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        await cacheManager.invalidateAssistantCache(assistantId);

        return new Response(
          JSON.stringify({
            status: "success",
            message: `Assistant cache invalidated for ID: ${assistantId}`,
            timestamp: new Date().toISOString(),
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );

      case "thread":
        if (!threadId) {
          return new Response(
            JSON.stringify({
              status: "error",
              message: "threadId is required for thread cache invalidation",
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        await cacheManager.invalidateThreadCache(threadId);

        return new Response(
          JSON.stringify({
            status: "success",
            message: `Thread cache invalidated for ID: ${threadId}`,
            timestamp: new Date().toISOString(),
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );

      case "all":
        await cacheManager.clearAllCache();

        return new Response(
          JSON.stringify({
            status: "success",
            message: "All cache cleared",
            timestamp: new Date().toISOString(),
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );

      default:
        return new Response(
          JSON.stringify({
            status: "error",
            message: "Invalid type. Options: 'assistant', 'thread', 'all'",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
    }
  } catch (error) {
    console.error("Cache invalidation failed:", error);

    return new Response(
      JSON.stringify({
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export const maxDuration = 300;
