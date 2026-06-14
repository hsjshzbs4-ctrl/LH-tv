// tests/unit/recommendation/application/events.spec.ts — CE9-B Application Events Tests

import { describe, it, expect } from 'vitest'
import { ApplicationEventTypes, AppEventFactory } from '@/modules/recommendation/application/events/ApplicationEvents'
import type { RecommendationRequestDto } from '@/modules/recommendation/application/dto/RecommendationRequestDto'

function makeRequest(): RecommendationRequestDto {
  return {
    requestId: 'req-1',
    userId: 'user-1',
    experimentId: 'exp-1',
    variantId: 'var-a',
    timestamp: Date.now(),
    feedType: 'personalized',
    limit: 10,
    offset: 0,
  }
}

describe('ApplicationEventTypes', () => {
  it('should define all 6 event types', () => {
    expect(ApplicationEventTypes.RECOMMENDATION_REQUESTED).toBe('app:recommendation:requested')
    expect(ApplicationEventTypes.RECOMMENDATION_DELIVERED).toBe('app:recommendation:delivered')
    expect(ApplicationEventTypes.RECOMMENDATION_CACHE_HIT).toBe('app:recommendation:cache-hit')
    expect(ApplicationEventTypes.RECOMMENDATION_CACHE_MISS).toBe('app:recommendation:cache-miss')
    expect(ApplicationEventTypes.RECOMMENDATION_TRACKING_REQUESTED).toBe('app:recommendation:tracking-requested')
    expect(ApplicationEventTypes.RECOMMENDATION_TRACKING_COMPLETED).toBe('app:recommendation:tracking-completed')
  })
})

describe('AppEventFactory', () => {
  it('should create recommendation requested event', () => {
    const request = makeRequest()
    const event = AppEventFactory.recommendationRequested(request)
    expect(event.type).toBe('app:recommendation:requested')
    expect(event.request).toBe(request)
    expect(event.timestamp).toBeGreaterThan(0)
  })

  it('should create recommendation delivered event', () => {
    const response = { requestId: 'r1', feed: {} as any, generatedAt: 1000, duration: 50, cacheHit: false }
    const event = AppEventFactory.recommendationDelivered(response, 50)
    expect(event.type).toBe('app:recommendation:delivered')
    expect(event.response).toBe(response)
    expect(event.duration).toBe(50)
  })

  it('should create cache hit event', () => {
    const event = AppEventFactory.cacheHit('req-1', 'key-1')
    expect(event.type).toBe('app:recommendation:cache-hit')
    expect(event.requestId).toBe('req-1')
    expect(event.cacheKey).toBe('key-1')
  })

  it('should create cache miss event', () => {
    const event = AppEventFactory.cacheMiss('req-2', 'key-2')
    expect(event.type).toBe('app:recommendation:cache-miss')
    expect(event.requestId).toBe('req-2')
    expect(event.cacheKey).toBe('key-2')
  })

  it('should create tracking requested event', () => {
    const event = AppEventFactory.trackingRequested('click', 'media-1')
    expect(event.type).toBe('app:recommendation:tracking-requested')
    expect(event.action).toBe('click')
    expect(event.mediaId).toBe('media-1')
  })

  it('should create tracking completed event', () => {
    const event = AppEventFactory.trackingCompleted('play', 'media-2', true)
    expect(event.type).toBe('app:recommendation:tracking-completed')
    expect(event.success).toBe(true)
  })

  it('should create tracking completed event with failure', () => {
    const event = AppEventFactory.trackingCompleted('favorite', 'media-3', false)
    expect(event.success).toBe(false)
  })
})
