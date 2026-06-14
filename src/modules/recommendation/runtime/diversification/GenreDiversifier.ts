// modules/recommendation/runtime/diversification/GenreDiversifier.ts — CE9-C
// Genre diversification: ensures no more than maxPerGenre items per section (Req 7).

import type { RecommendationItem } from '../../domain/entities/RecommendationItem'

export class GenreDiversifier {
  readonly maxPerGenre: number

  constructor(maxPerGenre: number = 5) {
    this.maxPerGenre = maxPerGenre
  }

  /**
   * Filter items to enforce per-genre diversity limit.
   * Walks items in order, skips items whose genres are already saturated.
   */
  diversify(items: RecommendationItem[]): {
    accepted: RecommendationItem[]
    rejected: RecommendationItem[]
    violations: { mediaId: string; genre: string; count: number }[]
  } {
    const genreCounts = new Map<string, number>()
    const accepted: RecommendationItem[] = []
    const rejected: RecommendationItem[] = []
    const violations: { mediaId: string; genre: string; count: number }[] = []

    for (const item of items) {
      let blocked = false
      let blockingGenre = ''

      for (const genre of item.genres) {
        const count = genreCounts.get(genre) ?? 0
        if (count >= this.maxPerGenre) {
          blocked = true
          blockingGenre = genre
          break
        }
      }

      if (blocked) {
        rejected.push(item)
        violations.push({
          mediaId: item.mediaId,
          genre: blockingGenre,
          count: genreCounts.get(blockingGenre) ?? this.maxPerGenre,
        })
      } else {
        accepted.push(item)
        for (const genre of item.genres) {
          genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + 1)
        }
      }
    }

    return { accepted, rejected, violations }
  }

  /** Check if adding an item would violate genre diversity */
  wouldViolate(item: RecommendationItem, existingItems: RecommendationItem[]): boolean {
    const genreCounts = new Map<string, number>()
    for (const existing of existingItems) {
      for (const genre of existing.genres) {
        genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + 1)
      }
    }

    for (const genre of item.genres) {
      if ((genreCounts.get(genre) ?? 0) >= this.maxPerGenre) {
        return true
      }
    }
    return false
  }
}
