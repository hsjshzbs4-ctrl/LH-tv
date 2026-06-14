// modules/recommendation/application/ports/IRecommendationCachePort.ts — CE9-B
// Cache port. Manages recommendation feed caching (L1 memory + L2 persistent).

import type { RecommendationFeed } from '../../domain/entities/RecommendationFeed'

export interface IRecommendationCachePort {
  /** Read a cached feed by key. Returns null on miss. */
  readFeed(key: string): Promise<RecommendationFeed | null>

  /** Write a feed to cache. */
  writeFeed(key: string, feed: RecommendationFeed): Promise<void>

  /** Invalidate a cached feed. */
  invalidateFeed(key: string): Promise<void>

  /** Invalidate all cached feeds for a user. */
  invalidateAll(userId: string): Promise<void>
}
