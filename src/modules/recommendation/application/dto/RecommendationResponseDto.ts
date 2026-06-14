// modules/recommendation/application/dto/RecommendationResponseDto.ts — CE9-B
// Response DTO wrapping the feed with request metadata.
// Pure transport — no business behavior.

import type { RecommendationFeedDto } from './RecommendationFeedDto'

export interface RecommendationResponseDto {
  /** Echo of the request ID for correlation */
  readonly requestId: string

  /** The recommendation feed */
  readonly feed: RecommendationFeedDto

  /** When the response was generated (epoch ms) */
  readonly generatedAt: number

  /** Total processing duration in milliseconds */
  readonly duration: number

  /** Whether this was served from cache */
  readonly cacheHit: boolean
}
