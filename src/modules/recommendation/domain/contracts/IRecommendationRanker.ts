// modules/recommendation/domain/contracts/IRecommendationRanker.ts — CE9-A
// Ranking contract: sort, deduplicate, paginate recommendation items.

import type { RecommendationItem } from '../entities/RecommendationItem'
import type { RecommendationProfile } from '../entities/RecommendationProfile'
import type { RecommendationContext } from '../entities/RecommendationContext'

export interface RankingOptions {
  readonly offset?: number
  readonly limit?: number
  readonly deduplicateBy?: 'mediaId' | 'title'
}

export interface IRecommendationRanker {
  /**
   * Rank items by composite score, apply deduplication, paginate.
   * Returns a new sorted array — does not mutate input.
   */
  rank(
    items: RecommendationItem[],
    profile: RecommendationProfile,
    ctx: RecommendationContext,
    options?: RankingOptions,
  ): RecommendationItem[]
}
