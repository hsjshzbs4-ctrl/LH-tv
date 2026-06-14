// modules/recommendation/application/dto/RecommendationFeedDto.ts — CE9-B
// Feed DTO — serialized representation of RecommendationFeed.
// Pure transport. Maps from/to RecommendationFeed entity.

import type { RecommendationItemDto } from './RecommendationItemDto'

export interface RecommendationFeedDto {
  /** Schema version for forward compatibility */
  readonly version: number

  /** Unique feed identifier */
  readonly feedId: string

  /** When this feed was generated (epoch ms) */
  readonly generatedAt: number

  /** Cache TTL in milliseconds */
  readonly ttl: number

  /** Feed sections (ordered by display priority) */
  readonly sections: FeedSectionDto[]

  /** Feed-level metadata */
  readonly metadata: FeedMetadataDto
}

export interface FeedSectionDto {
  readonly id: string
  readonly type: string
  readonly title: string
  readonly subtitle?: string
  readonly items: RecommendationItemDto[]
  readonly displayOrder: number
}

export interface FeedMetadataDto {
  readonly confidence: number
  readonly activeEngines: string[]
  readonly generationTimes: Record<string, number>
  readonly totalItems: number
  readonly schemaVersion: number
  readonly experiment: ExperimentInfoDto
}

export interface ExperimentInfoDto {
  readonly experimentId: string
  readonly variantId: string
}
