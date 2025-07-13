# Redis Caching Implementation for ChatbotAI

This document describes the Redis-based caching system implemented to improve the performance of your Assistant API.

## Overview

The caching system implements multiple layers of caching to reduce database queries and improve response times:

1. **Assistant Data Caching** - Caches chatbot configuration and data sources
2. **Schema Info Caching** - Caches extracted schema information
3. **Thread Context Caching** - Caches conversation context
4. **Message Response Caching** - Caches similar message responses (future enhancement)

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Request  │───▶│  Redis Cache    │───▶│   MongoDB       │
│                 │    │  (First Check)  │    │  (If Cache Miss)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │  OpenAI API     │
                       │  (Streaming)    │
                       └─────────────────┘
```

## Installation & Setup

### 1. Install Redis Dependencies

```bash
npm install redis
```

### 2. Environment Configuration

Add these variables to your `.env.local` file:

```bash
# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
REDIS_DB=0
```

For production, use a managed Redis service like:

- **Redis Cloud**
- **AWS ElastiCache**
- **Google Cloud Memorystore**
- **Azure Cache for Redis**

### 3. Local Redis Setup (Development)

**Option A: Docker**

```bash
docker run --name redis-cache -p 6379:6379 -d redis:alpine
```

**Option B: Local Installation**

- Windows: Download from https://redis.io/downloads
- macOS: `brew install redis`
- Linux: `sudo apt-get install redis-server`

## Cache Strategy

### Cache Keys Structure

```
schema:{assistantId}                    - Assistant schema information
assistant_data:{assistantId}            - Full assistant data from MongoDB
message:{threadId}:{contentHash}        - Message responses (future)
thread_ctx:{threadId}                   - Thread conversation context
rate_limit:{identifier}:{window}        - Rate limiting counters
```

### Cache TTL (Time To Live)

- **Schema Info**: 1 hour (3600s)
- **Assistant Data**: 30 minutes (1800s)
- **Message Responses**: 24 hours (86400s)
- **Thread Context**: 2 hours (7200s)

## API Endpoints

### Cache Health Check

```http
GET /api/cache/health
```

Returns cache status and statistics.

### Cache Metrics

```http
GET /api/cache/metrics
```

Returns performance metrics including hit rates and response times.

### Cache Invalidation

```http
POST /api/cache/invalidate
Content-Type: application/json

{
  "type": "assistant",
  "assistantId": "asst_123"
}
```

**Types:**

- `assistant` - Invalidate all cache for specific assistant
- `thread` - Invalidate all cache for specific thread
- `all` - Clear all cache

### Cache Warmup

```http
POST /api/cache/metrics
Content-Type: application/json

{
  "action": "warmup",
  "assistantIds": ["asst_123", "asst_456"]
}
```

## Performance Benefits

### Expected Improvements

- **Database Query Reduction**: 70-90% fewer MongoDB queries
- **Response Time**: 2-5x faster for cached requests
- **Scalability**: Better handling of concurrent requests
- **Cost Reduction**: Lower database load and OpenAI API usage

### Monitoring

Monitor cache performance through:

1. `/api/cache/metrics` endpoint
2. Console logs showing cache hits/misses
3. Response time measurements

## Code Integration

### Basic Usage

```typescript
import { cacheManager } from "@/lib/redis";

// Check cache
const cachedData = await cacheManager.getCachedAssistantData(assistantId);

if (!cachedData) {
  // Fetch from database
  const data = await fetchFromDatabase(assistantId);

  // Cache for future use
  await cacheManager.cacheAssistantData(assistantId, data);
}
```

### Performance Monitoring

```typescript
import { performanceMonitor } from "@/lib/cache-utils";

const startTime = Date.now();
// ... process request ...
const responseTime = Date.now() - startTime;

performanceMonitor.recordCacheHit(endpoint, responseTime);
```

## Production Considerations

### Security

- Use Redis AUTH with strong passwords
- Enable TLS for Redis connections
- Restrict Redis network access
- Regular security updates

### Monitoring

- Set up Redis monitoring (memory usage, connections)
- Alert on cache miss rates above threshold
- Monitor Redis performance metrics

### Scaling

- Consider Redis Cluster for high availability
- Implement Redis Sentinel for failover
- Use Redis persistence (AOF/RDB) for data durability

### Memory Management

- Set appropriate `maxmemory` limits
- Configure eviction policies (allkeys-lru recommended)
- Monitor memory usage and key expiration

## Troubleshooting

### Common Issues

**1. Connection Errors**

```bash
# Check Redis is running
redis-cli ping
# Should return PONG
```

**2. Memory Issues**

```bash
# Check Redis memory usage
redis-cli info memory
```

**3. Performance Issues**

- Check cache hit rates in `/api/cache/metrics`
- Verify TTL settings are appropriate
- Monitor Redis latency

### Debug Mode

Enable detailed logging by setting:

```bash
NODE_ENV=development
```

## Maintenance

### Regular Tasks

1. **Monitor cache hit rates** - Target >80% hit rate
2. **Check memory usage** - Keep below 80% of allocated memory
3. **Review TTL settings** - Adjust based on data update frequency
4. **Clean expired keys** - Redis handles this automatically
5. **Backup Redis data** - For persistence configurations

### Cache Invalidation Strategy

- Invalidate assistant cache when chatbot configuration changes
- Invalidate thread cache when conversation context changes
- Use versioning for gradual cache updates

## Future Enhancements

1. **Distributed Caching** - Redis Cluster for multi-region support
2. **Cache Preloading** - Predictive caching based on usage patterns
3. **Response Caching** - Cache OpenAI streaming responses
4. **Analytics** - Advanced cache analytics and optimization
5. **Circuit Breaker** - Fallback when Redis is unavailable

## Support

For issues or questions:

1. Check Redis logs for connection issues
2. Review cache metrics for performance issues
3. Use cache invalidation endpoints for data consistency issues
4. Monitor Redis memory and CPU usage
