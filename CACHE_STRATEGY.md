# XIANZE Cache Strategy

This document outlines the Redis caching strategy for the XIANZE Event Management System.

---

## Overview

Redis is used as the caching layer for:

- **Quiz Session State** - Track participant progress (Bug Smash, Ctrl + Quiz)
- **Temporary Event Data** - Round configuration, active questions
- **Real-time Leaderboards** - Score caching for fast reads
- **Rate Limiting** - API protection (future implementation)

> [!IMPORTANT]
> Redis is for **temporary data only**. All persistent data must be stored in SQLite.

---

## Configuration

### Environment Variables

```env
REDIS_HOST=redis          # Docker service name or hostname
REDIS_PORT=6379           # Default Redis port
```

### Docker Setup

Redis runs as an internal service with no exposed ports:

```yaml
redis:
  image: redis:7-alpine
  container_name: xianze-redis
  command: redis-server --appendonly yes --maxmemory 128mb --maxmemory-policy allkeys-lru
  volumes:
    - redis-data:/data
  networks:
    - xianze-network
  # No ports - internal only
```

---

## Key Naming Conventions

Follow this pattern for all Redis keys:

```
xianze:{module}:{entity}:{identifier}
```

### Examples

| Purpose       | Key Pattern                                   | Example                                  |
| ------------- | --------------------------------------------- | ---------------------------------------- |
| Quiz Session  | `xianze:quiz:{eventSlug}:session:{sessionId}` | `xianze:quiz:bug-smash:session:abc123`   |
| User Progress | `xianze:quiz:{eventSlug}:progress:{userId}`   | `xianze:quiz:ctrl-quiz:progress:user456` |
| Active Round  | `xianze:event:{eventSlug}:round:active`       | `xianze:event:bug-smash:round:active`    |
| Leaderboard   | `xianze:leaderboard:{eventSlug}`              | `xianze:leaderboard:ctrl-quiz`           |
| Rate Limit    | `xianze:ratelimit:{ip}:{endpoint}`            | `xianze:ratelimit:1.2.3.4:/api/submit`   |

### Naming Rules

1. **Always prefix with `xianze:`** - Namespace isolation
2. **Use lowercase** - Consistency
3. **Use colons as separators** - Redis convention
4. **Keep identifiers short** - Memory efficiency
5. **Be descriptive** - Self-documenting keys

---

## TTL (Time-To-Live) Strategy

All cached data **MUST** have a TTL to prevent memory bloat.

### Recommended TTLs

| Data Type           | TTL        | Rationale                 |
| ------------------- | ---------- | ------------------------- |
| Quiz Session        | 2 hours    | Session duration + buffer |
| User Progress       | 1 hour     | Single round duration     |
| Active Round Config | 30 minutes | Refresh frequently        |
| Leaderboard Cache   | 30 seconds | Near real-time updates    |
| Rate Limit Counter  | 1 minute   | Rolling window            |
| Temporary Answers   | 5 minutes  | Quick expiry              |

### Setting TTL in Code

```typescript
// Example using ioredis
await redis.setex("xianze:quiz:bug-smash:session:abc123", 7200, sessionData);
//                                                        ^^^^
//                                                        TTL in seconds (2 hours)
```

---

## Data Structures

### Quiz Session (Hash)

```
Key: xianze:quiz:{eventSlug}:session:{sessionId}

Fields:
- userId: string
- currentQuestion: number
- score: number
- startedAt: timestamp
- status: 'active' | 'completed' | 'expired'
```

### Leaderboard (Sorted Set)

```
Key: xianze:leaderboard:{eventSlug}

Members: userId
Scores: points

Commands:
- ZADD xianze:leaderboard:bug-smash 150 user123
- ZREVRANGE xianze:leaderboard:bug-smash 0 9 WITHSCORES  # Top 10
```

### Rate Limiting (String with INCR)

```
Key: xianze:ratelimit:{ip}:{endpoint}

Value: request count
TTL: 60 seconds (sliding window)

Commands:
- INCR xianze:ratelimit:1.2.3.4:/api/submit
- EXPIRE xianze:ratelimit:1.2.3.4:/api/submit 60
```

---

## Events Using Redis

| Event              | Redis Usage | Notes                                  |
| ------------------ | ----------- | -------------------------------------- |
| Bug Smash          | ✅ Required | MCQ sessions, progress, leaderboard    |
| Ctrl + Quiz        | ✅ Required | Quiz sessions, timer sync, leaderboard |
| Think & Link       | ⚡ Optional | Session state if needed                |
| Buildathon         | ⚡ Optional | Submission caching                     |
| Code Hunt          | ⚡ Optional | Timer sync                             |
| Paper Presentation | ❌ Not used | -                                      |
| Gaming             | ❌ Not used | -                                      |
| Fun Games          | ❌ Not used | -                                      |

---

## Implementation Checklist

When implementing Redis in a module:

- [ ] Use the `CacheService` from `src/cache/`
- [ ] Follow key naming conventions above
- [ ] Always set TTL on all keys
- [ ] Handle connection errors gracefully
- [ ] Log cache hits/misses for debugging
- [ ] Write to SQLite for persistent data

---

## Error Handling

Redis should be treated as a **soft dependency**. If Redis is unavailable:

1. **Log the error** - Don't crash silently
2. **Fall back gracefully** - Read from database directly
3. **Don't block the request** - Use timeouts

```typescript
async function getFromCache(key: string): Promise<string | null> {
  try {
    return await redis.get(key);
  } catch (error) {
    console.error("Redis error:", error);
    return null; // Fallback: cache miss
  }
}
```

---

## Memory Management

Redis is configured with:

- **Max Memory:** 128MB
- **Eviction Policy:** `allkeys-lru` (Least Recently Used)

This means old/unused keys will be automatically evicted when memory is full.

---

## Related Documentation

- [EVENTS.md](/EVENTS.md) - Which events use Redis
- [Docker Compose](/docker-compose.yml) - Redis container configuration
- [Backend Cache Module](/backend/src/cache/) - Implementation code
