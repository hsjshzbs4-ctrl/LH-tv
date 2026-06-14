// modules/recommendation/runtime/ranking/RankingStage.ts — CE9-C
// Single ranking stage in the pipeline. Composable stages form the full pipeline.

import { RecommendationItem } from '../../domain/entities/RecommendationItem'
import type { RecommendationProfile } from '../../domain/entities/RecommendationProfile'

export interface RankingStage {
  readonly name: string
  /** Process items through this ranking stage. Returns reordered items. */
  process(items: RecommendationItem[], profile: RecommendationProfile): RecommendationItem[]
}

/** Simple score-sort stage: items sorted by composite score descending */
export class ScoreSortStage implements RankingStage {
  readonly name = 'score-sort'

  process(items: RecommendationItem[], _profile: RecommendationProfile): RecommendationItem[] {
    return [...items].sort((a, b) => b.score.composite - a.score.composite)
  }
}

/** Diversity interleave stage: alternates high-score with high-diversity items */
export class DiversityInterleaveStage implements RankingStage {
  readonly name = 'diversity-interleave'

  process(items: RecommendationItem[], _profile: RecommendationProfile): RecommendationItem[] {
    if (items.length <= 1) return items

    const sorted = [...items].sort((a, b) => b.score.composite - a.score.composite)
    const byDiversity = [...items].sort((a, b) => b.score.diversityScore - a.score.diversityScore)

    const result: RecommendationItem[] = []
    const used = new Set<string>()
    let scoreIdx = 0
    let divIdx = 0

    while (result.length < items.length) {
      // Pick next by score
      while (scoreIdx < sorted.length && used.has(sorted[scoreIdx].mediaId)) scoreIdx++
      if (scoreIdx < sorted.length) {
        result.push(sorted[scoreIdx])
        used.add(sorted[scoreIdx].mediaId)
        scoreIdx++
      }

      // Pick next by diversity
      while (divIdx < byDiversity.length && used.has(byDiversity[divIdx].mediaId)) divIdx++
      if (divIdx < byDiversity.length) {
        result.push(byDiversity[divIdx])
        used.add(byDiversity[divIdx].mediaId)
        divIdx++
      }
    }

    return result
  }
}

/** Novelty boost stage: promotes unseen content for established users */
export class NoveltyBoostStage implements RankingStage {
  readonly name = 'novelty-boost'

  process(items: RecommendationItem[], profile: RecommendationProfile): RecommendationItem[] {
    if (!profile.isPersonalized) return items

    const boostFactor = 0.15
    return [...items].map(item => {
      const isNew = !profile.hasInteractedWith(item.mediaId)
      if (!isNew) return item

      const boosted = RecommendationItem.create({
        mediaId: item.mediaId,
        title: item.title,
        cover: item.cover,
        type: item.type,
        year: item.year,
        score: item.score.withNovelty(
          Math.min(1, item.score.noveltyScore + boostFactor),
        ),
        reason: item.reason,
        sources: [...item.sources],
        genres: [...item.genres],
        rating: item.rating,
      })

      return boosted
    }).sort((a, b) => b.score.composite - a.score.composite)
  }
}
