// modules/recommendation/application/mappers/ItemMapper.ts — CE9-B
// RecommendationItem entity ↔ RecommendationItemDto mapping.
// No business behavior. Pure data transformation.

import { RecommendationItem } from '../../domain/entities/RecommendationItem'
import type { RecommendationItemDto, ScoreBreakdownDto, ReasonDto, SourceDto } from '../dto/RecommendationItemDto'

export class ItemMapper {
  /** Domain entity → DTO */
  static toDto(item: RecommendationItem): RecommendationItemDto {
    const score: ScoreBreakdownDto = {
      interestScore: item.score.interestScore,
      noveltyScore: item.score.noveltyScore,
      diversityScore: item.score.diversityScore,
      popularityScore: item.score.popularityScore,
      freshnessScore: item.score.freshnessScore,
      composite: item.score.composite,
      confidence: item.score.confidence,
    }

    const reason: ReasonDto = {
      template: item.reason.template,
      rendered: item.reason.rendered,
    }

    const sources: SourceDto[] = item.sources.map(s => ({
      sourceType: s.sourceType,
      providerId: s.providerId,
      label: s.label,
      weight: s.weight,
    }))

    return {
      mediaId: item.mediaId,
      title: item.title,
      originalTitle: item.originalTitle,
      cover: item.cover,
      backdrop: item.backdrop,
      type: item.type,
      year: item.year,
      score,
      reason,
      sources,
      overview: item.overview,
      genres: item.genres.length > 0 ? [...item.genres] : undefined,
      rating: item.rating,
      progress: item.progress,
      duration: item.duration,
      availableOn: item.availableOn.length > 0 ? [...item.availableOn] : undefined,
    }
  }

  /** Array conversion convenience */
  static toDtoList(items: RecommendationItem[]): RecommendationItemDto[] {
    return items.map(item => ItemMapper.toDto(item))
  }
}
