// modules/search-unified/infrastructure/cache/SearchProviderCache.ts — CE8-C1
// In-memory cache for provider search results.
// Prevents duplicate requests within TTL window.
//
// TTL: 60 seconds (default)
// Key: providerId + query (normalized)
// Disabled for: local search provider

const DEFAULT_TTL_MS = 60_000

interface CacheEntry {
  readonly data: unknown
  readonly storedAt: number
}

export class SearchProviderCache {
  private store: Map<string, CacheEntry> = new Map()
  private ttlMs: number

  constructor(ttlMs: number = DEFAULT_TTL_MS) {
    this.ttlMs = ttlMs
  }

  /** Generate a cache key from provider ID and normalized query. */
  key(providerId: string, query: string): string {
    return `${providerId}::${query.toLowerCase().trim()}`
  }

  /** Get cached value if not expired. */
  get<T>(cacheKey: string): T | undefined {
    const entry = this.store.get(cacheKey)
    if (!entry) return undefined
    if (Date.now() - entry.storedAt > this.ttlMs) {
      this.store.delete(cacheKey)
      return undefined
    }
    return entry.data as T
  }

  /** Store value in cache. */
  set<T>(cacheKey: string, data: T): void {
    this.store.set(cacheKey, { data, storedAt: Date.now() })
  }

  /** Check if a key exists and is valid. */
  has(cacheKey: string): boolean {
    const entry = this.store.get(cacheKey)
    if (!entry) return false
    if (Date.now() - entry.storedAt > this.ttlMs) {
      this.store.delete(cacheKey)
      return false
    }
    return true
  }

  /** Clear expired entries. */
  evict(): void {
    const now = Date.now()
    for (const [key, entry] of this.store) {
      if (now - entry.storedAt > this.ttlMs) {
        this.store.delete(key)
      }
    }
  }

  /** Clear all cache entries. */
  clear(): void {
    this.store.clear()
  }

  /** Number of cached entries. */
  get size(): number {
    return this.store.size
  }
}
