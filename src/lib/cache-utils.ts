import { cacheManager } from "@/lib/redis";

// Performance monitoring utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, {
    totalRequests: number;
    cacheHits: number;
    cacheMisses: number;
    avgResponseTime: number;
    totalResponseTime: number;
  }> = new Map();

  private constructor() {}

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  recordCacheHit(endpoint: string, responseTime: number) {
    this.updateMetrics(endpoint, responseTime, true);
  }

  recordCacheMiss(endpoint: string, responseTime: number) {
    this.updateMetrics(endpoint, responseTime, false);
  }

  private updateMetrics(endpoint: string, responseTime: number, isHit: boolean) {
    const current = this.metrics.get(endpoint) || {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      avgResponseTime: 0,
      totalResponseTime: 0
    };

    current.totalRequests++;
    current.totalResponseTime += responseTime;
    current.avgResponseTime = current.totalResponseTime / current.totalRequests;

    if (isHit) {
      current.cacheHits++;
    } else {
      current.cacheMisses++;
    }

    this.metrics.set(endpoint, current);
  }

  getMetrics(endpoint?: string) {
    if (endpoint) {
      return this.metrics.get(endpoint);
    }
    
    // Return all metrics
    const result: any = {};
    this.metrics.forEach((value, key) => {
      result[key] = {
        ...value,
        hitRate: value.totalRequests > 0 ? (value.cacheHits / value.totalRequests) * 100 : 0
      };
    });
    
    return result;
  }

  resetMetrics() {
    this.metrics.clear();
  }
}

// Cache warming utility
export class CacheWarmer {
  private static instance: CacheWarmer;

  private constructor() {}

  public static getInstance(): CacheWarmer {
    if (!CacheWarmer.instance) {
      CacheWarmer.instance = new CacheWarmer();
    }
    return CacheWarmer.instance;
  }

  // Warm up frequently accessed data
  async warmupAssistantData(assistantIds: string[]) {
    try {
      console.log(`Starting cache warmup for ${assistantIds.length} assistants...`);
      
      // Import here to avoid circular dependencies
      const clientPromise = (await import("@/db")).default;
      const db = (await clientPromise!).db();
      const collection = db.collection("chatbots-data");

      for (const assistantId of assistantIds) {
        try {
          // Check if already cached
          const cachedData = await cacheManager.getCachedAssistantData(assistantId);
          if (!cachedData) {
            // Fetch and cache assistant data
            const assistantData = await collection
              .find({ chatbotId: assistantId })
              .toArray();
            
            await cacheManager.cacheAssistantData(assistantId, assistantData);

            // Extract and cache schema info
            const schemaInfo = assistantData
              .map((data: any) => data.schema_info)
              .filter((info: any) => info !== undefined);
            
            await cacheManager.cacheSchemaInfo(assistantId, schemaInfo);
            
            console.log(`Warmed up cache for assistant: ${assistantId}`);
          }
        } catch (error) {
          console.error(`Failed to warm up cache for assistant ${assistantId}:`, error);
        }
      }
      
      console.log('Cache warmup completed');
    } catch (error) {
      console.error('Cache warmup failed:', error);
    }
  }

  // Schedule regular cache warmup
  scheduleWarmup(assistantIds: string[], intervalMinutes: number = 60) {
    const intervalMs = intervalMinutes * 60 * 1000;
    
    setInterval(async () => {
      await this.warmupAssistantData(assistantIds);
    }, intervalMs);
    
    console.log(`Scheduled cache warmup every ${intervalMinutes} minutes for ${assistantIds.length} assistants`);
  }
}

// Rate limiting utility
export class RateLimiter {
  private static instance: RateLimiter;

  private constructor() {}

  public static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  async checkLimit(
    identifier: string, 
    windowSeconds: number = 60, 
    maxRequests: number = 100
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    try {
      return await cacheManager.checkRateLimit(
        identifier, 
        windowSeconds.toString(), 
        maxRequests
      );
    } catch (error) {
      console.error('Rate limit check failed:', error);
      // Fail open - allow request if rate limiting fails
      return { allowed: true, remaining: maxRequests, resetTime: Date.now() };
    }
  }
}

// Export singleton instances
export const performanceMonitor = PerformanceMonitor.getInstance();
export const cacheWarmer = CacheWarmer.getInstance();
export const rateLimiter = RateLimiter.getInstance();
