import { cacheManager } from "@/lib/redis";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

// GET /api/cache/health - Check Redis cache health and statistics
export async function GET() {
  try {
    const isHealthy = await cacheManager.isHealthy();
    const stats = await cacheManager.getCacheStats();

    return new Response(
      JSON.stringify({
        status: isHealthy ? "healthy" : "unhealthy",
        timestamp: new Date().toISOString(),
        stats: stats || {},
        cache: {
          connected: isHealthy,
          provider: "redis",
        },
      }),
      {
        status: isHealthy ? 200 : 503,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
      }
    );
  } catch (error) {
    console.error("Cache health check failed:", error);

    return new Response(
      JSON.stringify({
        status: "error",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
        cache: {
          connected: false,
          provider: "redis",
        },
      }),
      {
        status: 503,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
      }
    );
  }
}

// POST /api/cache/health - Clear all cache (admin operation)
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    if (action === "clear") {
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
    }

    return new Response(
      JSON.stringify({
        status: "error",
        message: "Invalid action. Use 'clear' to clear all cache.",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Cache operation failed:", error);

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
