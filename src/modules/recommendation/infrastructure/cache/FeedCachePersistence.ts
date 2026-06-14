// modules/recommendation/infrastructure/cache/FeedCachePersistence.ts — CE9-D
// L2 persistent feed cache. Complements L1 memory cache from CE9-C.

import type { RecommendationFeed } from '../../domain/entities/RecommendationFeed'
import type { IRecommendationRepository } from '../repositories/RecommendationRepository'
import { FeedSerializer } from '../serialization/FeedSerializer'

export class FeedCachePersistence {
  private serializer: FeedSerializer

  constructor(private repo: IRecommendationRepository) {
    this.serializer = new FeedSerializer()
  }

  /** Write feed to persistent cache */
  async write(key: string, feed: RecommendationFeed): Promise<void> {
    await this.repo.save(key, feed)
  }

  /** Read feed from persistent cache */
  async read(key: string): Promise<RecommendationFeed | null> {
    return this.repo.load(key)
  }

  /** Invalidate a cache entry */
  async invalidate(key: string): Promise<void> {
    await this.repo.delete(key)
  }

  /** Invalidate all entries for a user */
  async invalidateByUser(userId: string): Promise<void> {
    await this.repo.deleteByPrefix(`recommendation:${userId}`)
  }

  /** Refresh: check if cached feed is still valid, return null if expired */
  async readIfValid(key: string, maxAgeMs: number = 60 * 60 * 1000): Promise<RecommendationFeed | null> {
    const feed = await this.repo.load(key)
    if (!feed) return null
    if (feed.isExpired(Date.now() - maxAgeMs)) return null
    return feed
  }
}
