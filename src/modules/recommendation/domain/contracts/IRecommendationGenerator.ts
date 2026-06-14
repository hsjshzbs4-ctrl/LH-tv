// modules/recommendation/domain/contracts/IRecommendationGenerator.ts — CE9-A
// Feed generation contract. Orchestrates all engines into a RecommendationFeed.

import type { RecommendationFeed } from '../entities/RecommendationFeed'
import type { RecommendationContext } from '../entities/RecommendationContext'
import type { RecommendationProfile } from '../entities/RecommendationProfile'

export interface FeedGenerationOptions {
  /** Override per-engine weights */
  readonly engineWeights?: Record<string, number>
  /** Section types to include (undefined = all) */
  readonly includeSections?: string[]
  /** Maximum pool size per engine */
  readonly maxPoolPerEngine?: number
  /** Cache TTL override (ms) */
  readonly ttlOverride?: number
}

export interface IRecommendationGenerator {
  /**
   * Generate a complete recommendation feed.
   * This is the MAIN entry point — always returns RecommendationFeed, never bare Item[] (Req 4).
   */
  generateFeed(
    ctx: RecommendationContext,
    profile: RecommendationProfile,
    options?: FeedGenerationOptions,
  ): Promise<RecommendationFeed>
}
