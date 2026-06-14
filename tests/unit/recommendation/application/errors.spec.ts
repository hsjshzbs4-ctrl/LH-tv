// tests/unit/recommendation/application/errors.spec.ts — CE9-B Error Tests

import { describe, it, expect } from 'vitest'
import {
  RecommendationApplicationError,
  RecommendationValidationError,
  ProfileNotFoundError,
  FeedGenerationFailedError,
  CacheReadFailedError,
  CacheWriteFailedError,
  TrackingFailedError,
  InsufficientDataError,
} from '@/modules/recommendation/application/errors/RecommendationErrors'

describe('RecommendationApplicationError', () => {
  it('should create base error', () => {
    const err = new RecommendationApplicationError('base error', 'TEST_ERROR', 418)
    expect(err.message).toBe('base error')
    expect(err.code).toBe('TEST_ERROR')
    expect(err.statusCode).toBe(418)
    expect(err.name).toBe('RecommendationApplicationError')
  })

  it('should have default statusCode 500', () => {
    const err = new RecommendationApplicationError('test', 'CODE')
    expect(err.statusCode).toBe(500)
  })
})

describe('RecommendationValidationError', () => {
  it('should carry validation errors', () => {
    const err = new RecommendationValidationError(['field1 is required', 'field2 must be positive'])
    expect(err.code).toBe('RECOMMENDATION_VALIDATION_ERROR')
    expect(err.statusCode).toBe(400)
    expect(err.validationErrors).toHaveLength(2)
    expect(err.message).toContain('field1 is required')
  })
})

describe('ProfileNotFoundError', () => {
  it('should include userId', () => {
    const err = new ProfileNotFoundError('user-abc')
    expect(err.code).toBe('PROFILE_NOT_FOUND')
    expect(err.statusCode).toBe(404)
    expect(err.message).toContain('user-abc')
  })
})

describe('FeedGenerationFailedError', () => {
  it('should wrap cause', () => {
    const cause = new Error('upstream failure')
    const err = new FeedGenerationFailedError('timeout', cause)
    expect(err.code).toBe('FEED_GENERATION_FAILED')
    expect(err.cause).toBe(cause)
  })
})

describe('CacheReadFailedError', () => {
  it('should include key and reason', () => {
    const err = new CacheReadFailedError('feed:user:1', 'disk full')
    expect(err.code).toBe('CACHE_READ_FAILED')
    expect(err.message).toContain('feed:user:1')
    expect(err.message).toContain('disk full')
  })
})

describe('CacheWriteFailedError', () => {
  it('should include key and reason', () => {
    const err = new CacheWriteFailedError('feed:user:2', 'permission denied')
    expect(err.code).toBe('CACHE_WRITE_FAILED')
  })
})

describe('TrackingFailedError', () => {
  it('should include action', () => {
    const err = new TrackingFailedError('click', 'network error')
    expect(err.code).toBe('TRACKING_FAILED')
    expect(err.message).toContain('click')
  })
})

describe('InsufficientDataError', () => {
  it('should include data point counts', () => {
    const err = new InsufficientDataError('user-1', 2, 3)
    expect(err.code).toBe('INSUFFICIENT_DATA')
    expect(err.statusCode).toBe(422)
    expect(err.message).toContain('2 data points')
    expect(err.message).toContain('3 required')
  })
})

describe('Error hierarchy', () => {
  it('all errors should extend RecommendationApplicationError', () => {
    const errors = [
      new RecommendationValidationError(['e']),
      new ProfileNotFoundError('u'),
      new FeedGenerationFailedError('f'),
      new CacheReadFailedError('k', 'r'),
      new CacheWriteFailedError('k', 'r'),
      new TrackingFailedError('a', 'r'),
      new InsufficientDataError('u', 0, 1),
    ]
    for (const err of errors) {
      expect(err).toBeInstanceOf(RecommendationApplicationError)
      expect(err).toBeInstanceOf(Error)
    }
  })
})
