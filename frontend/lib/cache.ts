'use client';

/**
 * Client-side Cache Utility
 *
 * Simple localStorage-based caching with TTL support.
 * Used for caching static data like events to reduce re-renders.
 */

export interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

const CACHE_PREFIX = 'xianze_cache_';

/**
 * Get item from cache
 */
export function getFromCache<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;

  try {
    const cached = localStorage.getItem(CACHE_PREFIX + key);
    if (!cached) return null;

    const item: CacheItem<T> = JSON.parse(cached);
    const now = Date.now();

    // Check if expired
    if (now - item.timestamp > item.ttl) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }

    return item.data;
  } catch {
    return null;
  }
}

/**
 * Set item in cache
 * @param ttl Time to live in milliseconds (default: 1 hour)
 */
export function setInCache<T>(key: string, data: T, ttl = 3600000): void {
  if (typeof window === 'undefined') return;

  try {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(item));
  } catch {
    // Handle quota exceeded or other errors silently
  }
}

/**
 * Remove item from cache
 */
export function removeFromCache(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CACHE_PREFIX + key);
}

/**
 * Clear all cache items
 */
export function clearCache(): void {
  if (typeof window === 'undefined') return;

  const keys = Object.keys(localStorage);
  keys.forEach((key) => {
    if (key.startsWith(CACHE_PREFIX)) {
      localStorage.removeItem(key);
    }
  });
}

/**
 * Hook for caching data with automatic refresh
 */
export function useCachedData<T>(
  key: string,
  fetchFn: () => T | Promise<T>,
  ttl = 3600000
): { data: T | null; isLoading: boolean; refresh: () => void } {
  // Using a simple implementation - for static data, just return cached or fresh
  const cached = getFromCache<T>(key);

  if (cached) {
    return {
      data: cached,
      isLoading: false,
      refresh: () => {
        removeFromCache(key);
      },
    };
  }

  // For static data, call sync function
  const fresh = fetchFn();
  if (fresh instanceof Promise) {
    // Async data - return loading state
    return { data: null, isLoading: true, refresh: () => {} };
  }

  setInCache(key, fresh, ttl);
  return {
    data: fresh,
    isLoading: false,
    refresh: () => {
      removeFromCache(key);
    },
  };
}
