// modules/recommendation/application/errors/RecommendationErrors.ts — CE9-B
// Strongly-typed application errors. No generic Error usage allowed.

/** Base application error for recommendation module */
export class RecommendationApplicationError extends Error {
  readonly code: string
  readonly statusCode: number

  constructor(message: string, code: string, statusCode: number = 500) {
    super(message)
    this.name = 'RecommendationApplicationError'
    this.code = code
    this.statusCode = statusCode
  }
}

/** Request validation failed */
export class RecommendationValidationError extends RecommendationApplicationError {
  readonly validationErrors: string[]

  constructor(errors: string[]) {
    super(
      `Recommendation request validation failed: ${errors.join('; ')}`,
      'RECOMMENDATION_VALIDATION_ERROR',
      400,
    )
    this.name = 'RecommendationValidationError'
    this.validationErrors = errors
  }
}

/** User profile not found or not yet built */
export class ProfileNotFoundError extends RecommendationApplicationError {
  constructor(userId: string) {
    super(
      `Recommendation profile not found for user: ${userId}`,
      'PROFILE_NOT_FOUND',
      404,
    )
    this.name = 'ProfileNotFoundError'
  }
}

/** Feed generation failed (wraps domain/runtime errors) */
export class FeedGenerationFailedError extends RecommendationApplicationError {
  readonly cause?: unknown

  constructor(reason: string, cause?: unknown) {
    super(
      `Feed generation failed: ${reason}`,
      'FEED_GENERATION_FAILED',
      500,
    )
    this.name = 'FeedGenerationFailedError'
    this.cause = cause
  }
}

/** Cache read operation failed */
export class CacheReadFailedError extends RecommendationApplicationError {
  constructor(key: string, reason: string) {
    super(
      `Cache read failed for key "${key}": ${reason}`,
      'CACHE_READ_FAILED',
      500,
    )
    this.name = 'CacheReadFailedError'
  }
}

/** Cache write operation failed */
export class CacheWriteFailedError extends RecommendationApplicationError {
  constructor(key: string, reason: string) {
    super(
      `Cache write failed for key "${key}": ${reason}`,
      'CACHE_WRITE_FAILED',
      500,
    )
    this.name = 'CacheWriteFailedError'
  }
}

/** Tracking/analytics recording failed (non-blocking) */
export class TrackingFailedError extends RecommendationApplicationError {
  constructor(action: string, reason: string) {
    super(
      `Tracking "${action}" failed: ${reason}`,
      'TRACKING_FAILED',
      500,
    )
    this.name = 'TrackingFailedError'
  }
}

/** Insufficient data for personalization */
export class InsufficientDataError extends RecommendationApplicationError {
  constructor(userId: string, dataPoints: number, required: number) {
    super(
      `Insufficient data for user "${userId}": ${dataPoints} data points (${required} required)`,
      'INSUFFICIENT_DATA',
      422,
    )
    this.name = 'InsufficientDataError'
  }
}
