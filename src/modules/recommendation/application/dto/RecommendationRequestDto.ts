// modules/recommendation/application/dto/RecommendationRequestDto.ts — CE9-B
// Input DTO for all recommendation requests. Pure transport — no business behavior.

export type FeedType =
  | 'personalized'
  | 'trending'
  | 'continue-watching'
  | 'similar-content'
  | 'popular'
  | 'recently-added'

export interface RecommendationRequestDto {
  /** Unique request identifier (for tracing) */
  readonly requestId: string

  /** User identifier */
  readonly userId: string

  /** Experiment assignment (Req 10 — mandatory) */
  readonly experimentId: string

  /** Variant within experiment (Req 10 — mandatory) */
  readonly variantId: string

  /** Request timestamp (epoch ms) */
  readonly timestamp: number

  /** Type of feed requested */
  readonly feedType: FeedType

  /** Maximum items in the response */
  readonly limit: number

  /** Pagination offset */
  readonly offset: number

  /** Media IDs to exclude from results */
  readonly excludedIds?: string[]

  /** Preferred content types filter */
  readonly preferredTypes?: ('movie' | 'tv' | 'anime')[]

  /** Preferred genres filter */
  readonly preferredGenres?: string[]

  /** Session identifier for grouping */
  readonly sessionId?: string

  /** Optional metadata for extensibility */
  readonly metadata?: Record<string, unknown>
}

/** Validate a recommendation request. Returns validation errors or null if valid. */
export function validateRecommendationRequest(dto: RecommendationRequestDto): string[] | null {
  const errors: string[] = []

  if (!dto.requestId || dto.requestId.trim().length === 0) {
    errors.push('requestId is required')
  }
  if (!dto.userId || dto.userId.trim().length === 0) {
    errors.push('userId is required')
  }
  if (!dto.experimentId || dto.experimentId.trim().length === 0) {
    errors.push('experimentId is required (Req 10)')
  }
  if (!dto.variantId || dto.variantId.trim().length === 0) {
    errors.push('variantId is required (Req 10)')
  }
  if (dto.timestamp <= 0) {
    errors.push('timestamp must be positive')
  }
  if (dto.limit < 1 || dto.limit > 100) {
    errors.push('limit must be between 1 and 100')
  }
  if (dto.offset < 0) {
    errors.push('offset must be >= 0')
  }
  if (!dto.feedType) {
    errors.push('feedType is required')
  }

  return errors.length > 0 ? errors : null
}
