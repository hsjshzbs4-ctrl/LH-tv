// modules/recommendation/application/mappers/FeedMapper.ts — CE9-B
// RecommendationFeed entity ↔ RecommendationFeedDto mapping.
// No business behavior. Pure data transformation.

import { RecommendationFeed } from '../../domain/entities/RecommendationFeed'
import type { RecommendationFeedDto, FeedSectionDto, FeedMetadataDto } from '../dto/RecommendationFeedDto'
import { ItemMapper } from './ItemMapper'

export class FeedMapper {
  /** Domain entity → DTO */
  static toDto(feed: RecommendationFeed): RecommendationFeedDto {
    const sections: FeedSectionDto[] = feed.nonEmptySections.map(section => ({
      id: section.id,
      type: section.type,
      title: section.title,
      subtitle: section.subtitle,
      items: ItemMapper.toDtoList([...section.items]),
      displayOrder: section.displayOrder,
    }))

    const metadata: FeedMetadataDto = {
      confidence: feed.metadata.confidence,
      activeEngines: [...feed.metadata.activeEngines],
      generationTimes: { ...feed.metadata.generationTimes },
      totalItems: feed.metadata.totalItems,
      schemaVersion: feed.metadata.schemaVersion,
      experiment: {
        experimentId: feed.metadata.experiment.experimentId,
        variantId: feed.metadata.experiment.variantId,
      },
    }

    return {
      version: feed.metadata.schemaVersion,
      feedId: feed.feedId,
      generatedAt: feed.generatedAt,
      ttl: feed.ttl,
      sections,
      metadata,
    }
  }
}
