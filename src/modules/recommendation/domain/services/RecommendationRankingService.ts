// modules/recommendation/domain/services/RecommendationRankingService.ts — CE9-A
// Ranking service: sort by composite score, deduplicate, paginate.
// Stateless — pure function transformations.

import { RecommendationItem } from '../entities/RecommendationItem'
import type { RecommendationProfile } from '../entities/RecommendationProfile'
import type { RecommendationContext } from '../entities/RecommendationContext'
import type { IRecommendationRanker, RankingOptions } from '../contracts/IRecommendationRanker'

export class RecommendationRankingService implements IRecommendationRanker {
  /**
   * Rank items: sort → deduplicate → paginate.
   * Does NOT mutate input — returns a new array.
   */
  rank(
    items: RecommendationItem[],
    _profile: RecommendationProfile,
    _ctx: RecommendationContext,
    options?: RankingOptions,
  ): RecommendationItem[] {
    const dedupeKey = options?.deduplicateBy ?? 'mediaId'
    const offset = options?.offset ?? 0
    const limit = options?.limit ?? items.length

    // 1. Sort by composite score descending
    const sorted = [...items].sort(RecommendationItem.compare)

    // 2. Deduplicate
    const seen = new Set<string>()
    const deduped = sorted.filter(item => {
      const key = dedupeKey === 'title' ? item.title.toLowerCase() : item.mediaId
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    // 3. Paginate
    return deduped.slice(offset, offset + limit)
  }

  /**
   * Sort by a specific score dimension instead of composite.
   */
  rankByDimension(
    items: RecommendationItem[],
    dimension: 'interestScore' | 'noveltyScore' | 'diversityScore' | 'popularityScore' | 'freshnessScore',
  ): RecommendationItem[] {
    return [...items].sort((a, b) => b.score[dimension] - a.score[dimension])
  }

  /**
   * Get top-N items after ranking.
   */
  topN(items: RecommendationItem[], n: number, profile?: RecommendationProfile, ctx?: RecommendationContext): RecommendationItem[] {
    const p = profile ?? ({} as RecommendationProfile)
    const c = ctx ?? ({} as RecommendationContext)
    return this.rank(items, p, c, { limit: n })
  }

  /**
   * Rank with diversity boosting: promote items that improve feed diversity.
   * Alternates between high-score items and high-diversity items.
   */
  rankWithDiversityBoost(
    items: RecommendationItem[],
    boostFactor: number = 0.1,
  ): RecommendationItem[] {
    const sorted = [...items].sort(RecommendationItem.compare)
    const result: RecommendationItem[] = []
    const remaining = [...sorted]

    while (remaining.length > 0) {
      // Pick highest score
      if (remaining.length > 0) {
        result.push(remaining.shift()!)
      }
      // Pick highest diversity
      if (remaining.length > 0) {
        const bestDiversityIdx = remaining.reduce((best, item, idx) =>
          item.score.diversityScore > remaining[best].score.diversityScore ? idx : best,
        0)
        result.push(remaining.splice(bestDiversityIdx, 1)[0])
      }
    }

    return result
  }
}
