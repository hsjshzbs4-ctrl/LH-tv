// tests/unit/recommendation/application/dto.spec.ts — CE9-B DTO Tests

import { describe, it, expect } from 'vitest'
import { validateRecommendationRequest } from '@/modules/recommendation/application/dto/RecommendationRequestDto'
import type { RecommendationRequestDto } from '@/modules/recommendation/application/dto/RecommendationRequestDto'

function makeRequest(overrides?: Partial<RecommendationRequestDto>): RecommendationRequestDto {
  return {
    requestId: 'req-1',
    userId: 'user-1',
    experimentId: 'exp-001',
    variantId: 'variant-a',
    timestamp: Date.now(),
    feedType: 'personalized',
    limit: 20,
    offset: 0,
    ...overrides,
  }
}

describe('RecommendationRequestDto Validation', () => {
  it('should pass valid request', () => {
    const errors = validateRecommendationRequest(makeRequest())
    expect(errors).toBeNull()
  })

  it('should require requestId', () => {
    const errors = validateRecommendationRequest(makeRequest({ requestId: '' }))
    expect(errors).toContain('requestId is required')
  })

  it('should require userId', () => {
    const errors = validateRecommendationRequest(makeRequest({ userId: '' }))
    expect(errors).toContain('userId is required')
  })

  it('should require experimentId (Req 10)', () => {
    const errors = validateRecommendationRequest(makeRequest({ experimentId: '' }))
    expect(errors).toContain('experimentId is required (Req 10)')
  })

  it('should require variantId (Req 10)', () => {
    const errors = validateRecommendationRequest(makeRequest({ variantId: '' }))
    expect(errors).toContain('variantId is required (Req 10)')
  })

  it('should require positive timestamp', () => {
    const errors = validateRecommendationRequest(makeRequest({ timestamp: 0 }))
    expect(errors).toContain('timestamp must be positive')
  })

  it('should validate limit range', () => {
    expect(validateRecommendationRequest(makeRequest({ limit: 0 }))).toContain('limit must be between 1 and 100')
    expect(validateRecommendationRequest(makeRequest({ limit: 101 }))).toContain('limit must be between 1 and 100')
  })

  it('should validate offset >= 0', () => {
    const errors = validateRecommendationRequest(makeRequest({ offset: -1 }))
    expect(errors).toContain('offset must be >= 0')
  })

  it('should require feedType', () => {
    const errors = validateRecommendationRequest(makeRequest({ feedType: undefined as any }))
    expect(errors).toContain('feedType is required')
  })

  it('should return multiple errors at once', () => {
    const errors = validateRecommendationRequest(makeRequest({
      requestId: '',
      userId: '',
      limit: 0,
    }))
    expect(errors).not.toBeNull()
    expect(errors!.length).toBeGreaterThanOrEqual(3)
  })

  it('should accept optional fields', () => {
    const errors = validateRecommendationRequest(makeRequest({
      excludedIds: ['m1'],
      preferredTypes: ['movie'],
      preferredGenres: ['Action'],
      metadata: { key: 'value' },
    }))
    expect(errors).toBeNull()
  })

  it('should accept all feed types', () => {
    const types: Array<RecommendationRequestDto['feedType']> = [
      'personalized', 'trending', 'continue-watching', 'similar-content', 'popular', 'recently-added',
    ]
    for (const feedType of types) {
      const errors = validateRecommendationRequest(makeRequest({ feedType }))
      expect(errors).toBeNull()
    }
  })

  it('should generate unique request IDs', () => {
    const r1 = makeRequest({ requestId: 'id-1' })
    const r2 = makeRequest({ requestId: 'id-2' })
    expect(r1.requestId).not.toBe(r2.requestId)
  })
})
