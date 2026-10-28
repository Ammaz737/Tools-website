interface CacheItem<T> {
  value: T;
  expiresAt: number;
}

const memoryCache = new Map<string, CacheItem<unknown>>();

/**
 * Gets a cached item if present and not expired.
 */
export function getCached<T>(key: string): T | null {
  const item = memoryCache.get(key);
  if (!item) return null;

  if (Date.now() > item.expiresAt) {
    memoryCache.delete(key);
    return null;
  }

  return item.value as T;
}

/**
 * Sets a cached item with a TTL in seconds.
 */
export function setCached<T>(key: string, value: T, ttlSeconds: number = 300): void {
  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}
