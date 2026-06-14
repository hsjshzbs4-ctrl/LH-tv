// modules/recommendation/runtime/ranking/ScoreNormalizer.ts — CE9-C
// Normalizes recommendation scores across engines to a common scale.

import { RecommendationItem } from '../../domain/entities/RecommendationItem'
import { RecommendationScore } from '../../domain/value-objects/RecommendationScore'

export class ScoreNormalizer {
  /**
   * Normalize a batch of items' scores to [0, 1] range.
   * Uses min-max normalization per dimension.
   */
  normalize(items: RecommendationItem[]): RecommendationItem[] {
    if (items.length <= 1) return items

    // Collect all composite scores
    const composites = items.map(i => i.score.composite)
    const min = Math.min(...composites)
    const max = Math.max(...composites)
    const range = max - min

    if (range === 0) return items

    return items.map(item => {
      const normalizedComposite = (item.score.composite - min) / range
      // Create new score with normalized composite, preserving dimensions
      const currentComposite = item.score.composite
      const scale = currentComposite > 0 ? normalizedComposite / currentComposite : 0

      return this._rescaleItem(item, scale)
    })
  }

  /** Normalize to z-scores (standard scores) */
  normalizeZScore(items: RecommendationItem[]): RecommendationItem[] {
    if (items.length <= 1) return items

    const composites = items.map(i => i.score.composite)
    const mean = composites.reduce((s, v) => s + v, 0) / composites.length
    const variance = composites.reduce((s, v) => s + (v - mean) ** 2, 0) / composites.length
    const stddev = Math.sqrt(variance)

    if (stddev === 0) return items

    return items.map(item => {
      const z = (item.score.composite - mean) / stddev
      // Convert z-score to [0, 1] via logistic function
      const sigmoid = 1 / (1 + Math.exp(-z))
      return this._rescaleItem(item, sigmoid / Math.max(item.score.composite, 0.001))
    })
  }

  private _rescaleItem(item: RecommendationItem, scale: number): RecommendationItem {
    const clamped = Math.max(0, Math.min(1, scale))
    return RecommendationItem.create({
      mediaId: item.mediaId,
      title: item.title,
      cover: item.cover,
      type: item.type,
      year: item.year,
      score: RecommendationScore.create(
        {
          interestScore: this._clamp(item.score.interestScore * clamped),
          noveltyScore: item.score.noveltyScore,
          diversityScore: item.score.diversityScore,
          popularityScore: item.score.popularityScore,
          freshnessScore: item.score.freshnessScore,
        },
        item.score.weights,
        item.score.confidence,
      ),
      reason: item.reason,
      sources: [...item.sources],
      genres: [...item.genres],
      rating: item.rating,
      overview: item.overview,
      progress: item.progress,
    })
  }

  private _clamp(v: number): number {
    return Math.max(0, Math.min(1, v))
  }
}
