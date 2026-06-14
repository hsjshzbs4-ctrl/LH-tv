// modules/search-unified/domain/services/SearchRankingService.ts — CE8-A
// Domain service: applies final ranking to unified search results.
// Formula placeholder — full implementation in CE8-B or later.
//
// Current: sorts by score DESC, then sourceCount DESC, then quality DESC.

import type { UnifiedSearchResult } from '../entities/UnifiedSearchResult'

export interface RankingOptions {
  /** Maximum results to return (default: no limit) */
  limit?: number
  /** Results to skip (default: 0) */
  offset?: number
  /** Prefer playable results first */
  preferPlayable?: boolean
}

export class SearchRankingService {
  /**
   * Rank results and return sorted array.
   * Default: higher score first, then more sources, then higher quality.
   */
  rank(results: UnifiedSearchResult[], options?: RankingOptions): UnifiedSearchResult[] {
    let sorted = [...results]

    // Apply ranking
    sorted.sort((a, b) => {
      // Prefer playable if enabled
      if (options?.preferPlayable) {
        if (a.isPlayable && !b.isPlayable) return -1
        if (!a.isPlayable && b.isPlayable) return 1
      }

      // Primary: score
      const scoreCmp = b.score.compare(a.score)
      if (scoreCmp !== 0) return scoreCmp

      // Secondary: source count
      if (b.sourceCount !== a.sourceCount) return b.sourceCount - a.sourceCount

      // Tertiary: best quality
      return b.availability.bestQuality - a.availability.bestQuality
    })

    // Apply pagination
    const offset = options?.offset ?? 0
    const limit = options?.limit
    if (offset > 0 || limit !== undefined) {
      sorted = sorted.slice(offset, limit !== undefined ? offset + limit : undefined)
    }

    return sorted
  }

  /**
   * Compute ranking stats for domain event emission.
   */
  computeStats(results: UnifiedSearchResult[]): {
    rankedCount: number
    topScore: number
    averageScore: number
  } {
    if (results.length === 0) {
      return { rankedCount: 0, topScore: 0, averageScore: 0 }
    }
    const scores = results.map(r => r.score.value)
    return {
      rankedCount: results.length,
      topScore: Math.max(...scores),
      averageScore: Math.round(scores.reduce((s, v) => s + v, 0) / scores.length),
    }
  }
}
