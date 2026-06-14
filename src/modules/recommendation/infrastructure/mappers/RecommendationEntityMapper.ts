// modules/recommendation/infrastructure/mappers/RecommendationEntityMapper.ts — CE9-D
// Infrastructure ↔ Domain mappers. No business logic.

import { RecommendationItem } from '../../domain/entities/RecommendationItem'
import { RecommendationSource } from '../../domain/entities/RecommendationSource'
import { RecommendationScore } from '../../domain/value-objects/RecommendationScore'
import { RecommendationReason } from '../../domain/value-objects/RecommendationReason'

export interface StoredItem {
  readonly mediaId: string
  readonly title: string
  readonly cover: string
  readonly type: 'movie' | 'tv' | 'anime'
  readonly year?: number
  readonly composite: number
  readonly reasonText: string
  readonly genres: string[]
}

export class RecommendationEntityMapper {
  /** Domain entity → storable format */
  static toStorage(item: RecommendationItem): StoredItem {
    return {
      mediaId: item.mediaId,
      title: item.title,
      cover: item.cover,
      type: item.type,
      year: item.year,
      composite: item.score.composite,
      reasonText: item.reason.rendered,
      genres: [...item.genres],
    }
  }

  /** Storable format → domain entity */
  static fromStorage(data: StoredItem): RecommendationItem {
    return RecommendationItem.create({
      mediaId: data.mediaId,
      title: data.title,
      cover: data.cover,
      type: data.type,
      year: data.year,
      score: RecommendationScore.create({
        interestScore: data.composite,
        noveltyScore: 0.5,
        diversityScore: 0.5,
        popularityScore: 0.5,
        freshnessScore: 0.5,
      }),
      reason: RecommendationReason.recommendedForYou(),
      sources: [RecommendationSource.create({ sourceType: 'hybrid', label: 'Stored', weight: 1 })],
      genres: data.genres,
    })
  }
}
