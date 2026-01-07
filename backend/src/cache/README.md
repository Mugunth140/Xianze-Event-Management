# Cache Module

This module provides Redis caching capabilities for the XIANZE platform.

## ⚠️ Implementation Status

**Status**: Placeholder only - no business logic implemented

## Purpose

- Quiz session state management (Bug Smash, Ctrl + Quiz)
- Round progress tracking
- Rate limiting (future)
- Temporary event data storage

## Files

| File               | Description                             |
| ------------------ | --------------------------------------- |
| `cache.module.ts`  | NestJS module definition                |
| `cache.service.ts` | Redis abstraction service (placeholder) |

## Implementation Guide

When implementing the cache service:

1. Use `ioredis` for Redis connectivity (already in dependencies)
2. Follow key naming conventions in `/CACHE_STRATEGY.md`
3. Handle connection errors gracefully
4. Implement TTL for all cached data

## Environment Variables

```env
REDIS_HOST=redis       # Redis hostname (Docker service name)
REDIS_PORT=6379        # Redis port
```

## Related Documentation

- [Cache Strategy](/CACHE_STRATEGY.md) - Key naming and TTL guidelines
- [Architecture](/backend/ARCHITECTURE.md) - Overall backend architecture
