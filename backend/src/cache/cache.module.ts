import { Module } from '@nestjs/common';
import { CacheService } from './cache.service';

/**
 * Cache Module - Redis Integration Placeholder
 *
 * ⚠️ DO NOT IMPLEMENT BUSINESS LOGIC HERE
 *
 * This module provides Redis caching capabilities for the XIANZE platform.
 * Implementation should be added by contributors following the cache strategy
 * documented in /CACHE_STRATEGY.md
 *
 * Intended Use Cases:
 * - Quiz session state (Bug Smash, Ctrl + Quiz)
 * - Round progress tracking
 * - Rate limiting (future)
 * - Temporary event data
 *
 * @see /CACHE_STRATEGY.md for implementation guidelines
 */
@Module({
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
