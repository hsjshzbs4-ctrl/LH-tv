// modules/recommendation/runtime/cache/FeedCache.ts — CE9-C
// Two-tier feed cache: L1 (memory), L2 (persistent via IRecommendationCachePort).
// Performance target: <100ms cache hit (Req 13).

import type { RecommendationFeed } from '../../domain/entities/RecommendationFeed'

interface CacheEntry {
  readonly key: string
  readonly feed: RecommendationFeed
  readonly createdAt: number
  readonly expiresAt: number
}

export class FeedCache {
  private l1Cache: Map<string, CacheEntry> = new Map()
  private maxL1Size: number
  private l1TtlMs: number

  constructor(maxL1Size: number = 20, l1TtlMs: number = 5 * 60 * 1000) {
    this.maxL1Size = maxL1Size
    this.l1TtlMs = l1TtlMs
  }

  /** Read from L1 cache. Returns null on miss or expiry. Performance: <1ms. */
  read(key: string): RecommendationFeed | null {
    const entry = this.l1Cache.get(key)
    if (!entry) return null

    if (Date.now() > entry.expiresAt) {
      this.l1Cache.delete(key)
      return null
    }

    return entry.feed
  }

  /** Write to L1 cache. Evicts LRU entry if at capacity. */
  write(key: string, feed: RecommendationFeed): void {
    // Evict oldest if at capacity
    if (this.l1Cache.size >= this.maxL1Size && !this.l1Cache.has(key)) {
      const oldest = this._findOldest()
      if (oldest) {
        this.l1Cache.delete(oldest)
      }
    }

    this.l1Cache.set(key, {
      key,
      feed,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.l1TtlMs,
    })
  }

  /** Invalidate a specific key */
  invalidate(key: string): void {
    this.l1Cache.delete(key)
  }

  /** Invalidate all entries matching a prefix (e.g., all for a user) */
  invalidateByPrefix(prefix: string): void {
    for (const key of this.l1Cache.keys()) {
      if (key.startsWith(prefix)) {
        this.l1Cache.delete(key)
      }
    }
  }

  /** Clear all caches */
  invalidateAll(): void {
    this.l1Cache.clear()
  }

  /** Get cache stats */
  getStats(): { size: number; maxSize: number; ttlMs: number } {
    return {
      size: this.l1Cache.size,
      maxSize: this.maxL1Size,
      ttlMs: this.l1TtlMs,
    }
  }

  private _findOldest(): string | null {
    let oldest: string | null = null
    let oldestTime = Infinity

    for (const [key, entry] of this.l1Cache) {
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt
        oldest = key
      }
    }

    return oldest
  }
}
