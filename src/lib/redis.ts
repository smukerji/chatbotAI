import { createClient, RedisClientType } from "redis";
import crypto from "crypto";

// Redis configuration
const REDIS_CONFIG = {
  url: process.env.REDIS_URL || "redis://localhost:6379",
  password: process.env.REDIS_PASSWORD,
  socket: {
    connectTimeout: 60000,
    lazyConnect: true,
    reconnectStrategy: (retries: number) => {
      if (retries > 5) return new Error("Too many retries");
      return Math.min(retries * 50, 500);
    },
  },
  database: parseInt(process.env.REDIS_DB || "0"),
};

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  SCHEMA_INFO: 3600, // 1 hour
  ASSISTANT_DATA: 1800, // 30 minutes
  MESSAGE_RESPONSE: 86400, // 24 hours
  THREAD_CONTEXT: 7200, // 2 hours
  USER_SESSION: 3600, // 1 hour
} as const;

// Cache key prefixes
export const CACHE_KEYS = {
  SCHEMA: "schema",
  ASSISTANT_DATA: "assistant_data",
  MESSAGE: "message",
  THREAD_CONTEXT: "thread_ctx",
  USER_SESSION: "user_session",
  RATE_LIMIT: "rate_limit",
} as const;

class RedisCache {
  private client: RedisClientType | null = null;
  private isConnected = false;
  private connectionPromise: Promise<void> | null = null;

  constructor() {
    this.initializeConnection();
  }

  private async initializeConnection(): Promise<void> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = (async () => {
      try {
        this.client = createClient(REDIS_CONFIG);

        this.client.on("error", (err) => {
          console.error("Redis Client Error:", err);
          this.isConnected = false;
        });

        this.client.on("connect", () => {
          console.log("Redis Client Connected");
          this.isConnected = true;
        });

        this.client.on("disconnect", () => {
          console.log("Redis Client Disconnected");
          this.isConnected = false;
        });

        await this.client.connect();
        this.isConnected = true;
      } catch (error) {
        console.error("Failed to initialize Redis connection:", error);
        this.isConnected = false;
        throw error;
      }
    })();

    return this.connectionPromise;
  }

  private async ensureConnection(): Promise<RedisClientType> {
    if (!this.client || !this.isConnected) {
      await this.initializeConnection();
    }

    if (!this.client) {
      throw new Error("Redis client not initialized");
    }

    return this.client;
  }

  // Generic cache operations
  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const client = await this.ensureConnection();
      const serializedValue = JSON.stringify(value);

      if (ttl) {
        await client.setEx(key, ttl, serializedValue);
      } else {
        await client.set(key, serializedValue);
      }
    } catch (error) {
      console.error(`Error setting cache key ${key}:`, error);
      throw error;
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    try {
      const client = await this.ensureConnection();
      const value = await client.get(key);

      if (!value) return null;

      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Error getting cache key ${key}:`, error);
      return null;
    }
  }

  async del(key: string | string[]): Promise<number> {
    try {
      const client = await this.ensureConnection();
      const keys = Array.isArray(key) ? key : [key];
      return await client.del(keys);
    } catch (error) {
      console.error(`Error deleting cache key(s):`, error);
      return 0;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const client = await this.ensureConnection();
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Error checking existence of key ${key}:`, error);
      return false;
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      const client = await this.ensureConnection();
      return await client.keys(pattern);
    } catch (error) {
      console.error(`Error getting keys with pattern ${pattern}:`, error);
      return [];
    }
  }

  async ping(): Promise<string> {
    try {
      const client = await this.ensureConnection();
      return await client.ping();
    } catch (error) {
      console.error("Redis ping failed:", error);
      throw error;
    }
  }

  async flushAll(): Promise<void> {
    try {
      const client = await this.ensureConnection();
      await client.flushAll();
    } catch (error) {
      console.error("Error flushing Redis cache:", error);
      throw error;
    }
  }

  async quit(): Promise<void> {
    try {
      if (this.client && this.isConnected) {
        await this.client.quit();
        this.isConnected = false;
      }
    } catch (error) {
      console.error("Error closing Redis connection:", error);
    }
  }

  // Health check
  async isHealthy(): Promise<boolean> {
    try {
      const result = await this.ping();
      return result === "PONG";
    } catch (error) {
      return false;
    }
  }
}

// Singleton instance
let redisInstance: RedisCache | null = null;

export function getRedisClient(): RedisCache {
  if (!redisInstance) {
    redisInstance = new RedisCache();
  }
  return redisInstance;
}

// Content hash utility
export function generateContentHash(content: string): string {
  return crypto
    .createHash("sha256")
    .update(content)
    .digest("hex")
    .substring(0, 16);
}

// Cache helper functions
export class CacheManager {
  private static instance: CacheManager;
  private redis: RedisCache;

  private constructor() {
    this.redis = getRedisClient();
  }

  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  // Generate cache keys
  generateSchemaKey(assistantId: string): string {
    return `${CACHE_KEYS.SCHEMA}:${assistantId}`;
  }

  generateMessageKey(threadId: string, contentHash: string): string {
    return `${CACHE_KEYS.MESSAGE}:${threadId}:${contentHash}`;
  }

  generateAssistantDataKey(assistantId: string): string {
    return `${CACHE_KEYS.ASSISTANT_DATA}:${assistantId}`;
  }

  generateThreadContextKey(threadId: string): string {
    return `${CACHE_KEYS.THREAD_CONTEXT}:${threadId}`;
  }

  generateUserSessionKey(userId: string): string {
    return `${CACHE_KEYS.USER_SESSION}:${userId}`;
  }

  generateRateLimitKey(identifier: string, window: string): string {
    return `${CACHE_KEYS.RATE_LIMIT}:${identifier}:${window}`;
  }

  // Schema info caching
  async cacheSchemaInfo(assistantId: string, schemaInfo: any[]): Promise<void> {
    try {
      const key = this.generateSchemaKey(assistantId);
      await this.redis.set(key, schemaInfo, CACHE_TTL.SCHEMA_INFO);
      console.log(`Cached schema info for assistant: ${assistantId}`);
    } catch (error) {
      console.error("Error caching schema info:", error);
    }
  }

  async getCachedSchemaInfo(assistantId: string): Promise<any[] | null> {
    try {
      const key = this.generateSchemaKey(assistantId);
      const cached = await this.redis.get<any[]>(key);
      if (cached) {
        console.log(`Cache hit for schema info: ${assistantId}`);
      }
      return cached;
    } catch (error) {
      console.error("Error getting cached schema info:", error);
      return null;
    }
  }

  // Assistant data caching
  async cacheAssistantData(
    assistantId: string,
    assistantData: any[]
  ): Promise<void> {
    try {
      const key = this.generateAssistantDataKey(assistantId);
      await this.redis.set(key, assistantData, CACHE_TTL.ASSISTANT_DATA);
      console.log(`Cached assistant data for: ${assistantId}`);
    } catch (error) {
      console.error("Error caching assistant data:", error);
    }
  }

  async getCachedAssistantData(assistantId: string): Promise<any[] | null> {
    try {
      const key = this.generateAssistantDataKey(assistantId);
      const cached = await this.redis.get<any[]>(key);
      if (cached) {
        console.log(`Cache hit for assistant data: ${assistantId}`);
      }
      return cached;
    } catch (error) {
      console.error("Error getting cached assistant data:", error);
      return null;
    }
  }

  // Message response caching
  async cacheMessageResponse(
    threadId: string,
    content: string,
    response: any
  ): Promise<void> {
    try {
      const contentHash = generateContentHash(content);
      const key = this.generateMessageKey(threadId, contentHash);
      await this.redis.set(key, response, CACHE_TTL.MESSAGE_RESPONSE);
      console.log(`Cached message response for thread: ${threadId}`);
    } catch (error) {
      console.error("Error caching message response:", error);
    }
  }

  async getCachedMessageResponse(
    threadId: string,
    content: string
  ): Promise<any | null> {
    try {
      const contentHash = generateContentHash(content);
      const key = this.generateMessageKey(threadId, contentHash);
      const cached = await this.redis.get(key);
      if (cached) {
        console.log(`Cache hit for message response: ${threadId}`);
      }
      return cached;
    } catch (error) {
      console.error("Error getting cached message response:", error);
      return null;
    }
  }

  // Thread context caching
  async cacheThreadContext(threadId: string, context: any): Promise<void> {
    try {
      const key = this.generateThreadContextKey(threadId);
      await this.redis.set(key, context, CACHE_TTL.THREAD_CONTEXT);
    } catch (error) {
      console.error("Error caching thread context:", error);
    }
  }

  async getCachedThreadContext(threadId: string): Promise<any | null> {
    try {
      const key = this.generateThreadContextKey(threadId);
      return await this.redis.get(key);
    } catch (error) {
      console.error("Error getting cached thread context:", error);
      return null;
    }
  }

  // Rate limiting
  async checkRateLimit(
    identifier: string,
    window: string,
    maxRequests: number
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    try {
      const key = this.generateRateLimitKey(identifier, window);
      const client = await this.redis["ensureConnection"]();

      const pipeline = client.multi();
      pipeline.incr(key);
      pipeline.expire(key, parseInt(window));

      const results = await pipeline.exec();
      const count = (results?.[0] as number) || 0;

      const remaining = Math.max(0, maxRequests - count);
      const resetTime = Date.now() + parseInt(window) * 1000;

      return {
        allowed: count <= maxRequests,
        remaining,
        resetTime,
      };
    } catch (error) {
      console.error("Error checking rate limit:", error);
      return { allowed: true, remaining: maxRequests, resetTime: Date.now() };
    }
  }

  // Cache invalidation
  async invalidateAssistantCache(assistantId: string): Promise<void> {
    try {
      const patterns = [
        `${CACHE_KEYS.SCHEMA}:${assistantId}`,
        `${CACHE_KEYS.ASSISTANT_DATA}:${assistantId}`,
        `${CACHE_KEYS.MESSAGE}:*:*`, // Clear all messages if assistant data changes
      ];

      for (const pattern of patterns) {
        if (pattern.includes("*")) {
          const keys = await this.redis.keys(pattern);
          if (keys.length > 0) {
            await this.redis.del(keys);
          }
        } else {
          await this.redis.del(pattern);
        }
      }

      console.log(`Invalidated cache for assistant: ${assistantId}`);
    } catch (error) {
      console.error("Error invalidating assistant cache:", error);
    }
  }

  async invalidateThreadCache(threadId: string): Promise<void> {
    try {
      const patterns = [
        `${CACHE_KEYS.MESSAGE}:${threadId}:*`,
        `${CACHE_KEYS.THREAD_CONTEXT}:${threadId}`,
      ];

      for (const pattern of patterns) {
        if (pattern.includes("*")) {
          const keys = await this.redis.keys(pattern);
          if (keys.length > 0) {
            await this.redis.del(keys);
          }
        } else {
          await this.redis.del(pattern);
        }
      }

      console.log(`Invalidated cache for thread: ${threadId}`);
    } catch (error) {
      console.error("Error invalidating thread cache:", error);
    }
  }

  // Health and statistics
  async isHealthy(): Promise<boolean> {
    return await this.redis.isHealthy();
  }

  async getCacheStats(): Promise<any> {
    try {
      const client = await this.redis["ensureConnection"]();
      const info = await client.info();
      const dbSize = await client.dbSize();

      return {
        connected: await this.isHealthy(),
        totalKeys: dbSize,
        memoryInfo: info
          .split("\r\n")
          .filter((line) => line.startsWith("used_memory")),
        uptime: info
          .split("\r\n")
          .find((line) => line.startsWith("uptime_in_seconds")),
      };
    } catch (error) {
      console.error("Error getting cache stats:", error);
      return null;
    }
  }

  async clearAllCache(): Promise<void> {
    try {
      await this.redis.flushAll();
      console.log("All cache cleared");
    } catch (error) {
      console.error("Error clearing all cache:", error);
    }
  }
}

// Export singleton instance
export const cacheManager = CacheManager.getInstance();
export default getRedisClient();
