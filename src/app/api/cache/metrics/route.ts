import { performanceMonitor, cacheWarmer } from "@/lib/cache-utils";
import { cacheManager } from "@/lib/redis";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

// GET /api/cache/metrics - Get cache performance metrics
export async function GET() {
  try {
    const performanceMetrics = performanceMonitor.getMetrics();
    const cacheStats = await cacheManager.getCacheStats();
    const isHealthy = await cacheManager.isHealthy();

    return new Response(
      JSON.stringify({
        status: "success",
        timestamp: new Date().toISOString(),
        cache: {
          connected: isHealthy,
          provider: "redis",
          stats: cacheStats,
        },
        performance: performanceMetrics,
        summary: {
          totalEndpoints: Object.keys(performanceMetrics).length,
          overallHitRate: calculateOverallHitRate(performanceMetrics),
          avgResponseTime: calculateAvgResponseTime(performanceMetrics),
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
      }
    );
  } catch (error) {
    console.error("Failed to get cache metrics:", error);

    return new Response(
      JSON.stringify({
        status: "error",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// POST /api/cache/metrics - Cache management operations
export async function POST(request: NextRequest) {
  try {
    const { action, assistantIds } = await request.json();

    switch (action) {
      case "warmup":
        if (!assistantIds || !Array.isArray(assistantIds)) {
          return new Response(
            JSON.stringify({
              status: "error",
              message: "assistantIds array is required for warmup",
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        // Start cache warmup in background
        cacheWarmer.warmupAssistantData(assistantIds).catch((error) => {
          console.error("Cache warmup failed:", error);
        });

        return new Response(
          JSON.stringify({
            status: "success",
            message: `Cache warmup started for ${assistantIds.length} assistants`,
            timestamp: new Date().toISOString(),
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );

      case "reset-metrics":
        performanceMonitor.resetMetrics();

        return new Response(
          JSON.stringify({
            status: "success",
            message: "Performance metrics reset",
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
            message: "Invalid action. Options: 'warmup', 'reset-metrics'",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
    }
  } catch (error) {
    console.error("Cache metrics operation failed:", error);

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

// Helper functions
function calculateOverallHitRate(metrics: any): number {
  let totalRequests = 0;
  let totalHits = 0;

  Object.values(metrics).forEach((metric: any) => {
    totalRequests += metric.totalRequests;
    totalHits += metric.cacheHits;
  });

  return totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0;
}

function calculateAvgResponseTime(metrics: any): number {
  const avgTimes = Object.values(metrics).map(
    (metric: any) => metric.avgResponseTime
  );
  return avgTimes.length > 0
    ? avgTimes.reduce((a: number, b: number) => a + b, 0) / avgTimes.length
    : 0;
}

export const maxDuration = 300;
