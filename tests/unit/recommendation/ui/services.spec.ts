// tests/unit/recommendation/ui/services.spec.ts — CE9-F

import { describe, it, expect } from 'vitest'
import { SECTION_TITLES, CARD_SIZES, LOADING_CONFIG, RAIL_CONFIG } from '@/modules/recommendation/ui/constants/recommendation-ui.constants'
import type { UIRecommendationItem, UIFeed } from '@/modules/recommendation/ui/types/recommendation-ui.types'

describe('SECTION_TITLES', () => {
  it('should have titles for all section types', () => {
    expect(SECTION_TITLES['continue-watching']).toBe('Continue Watching')
    expect(SECTION_TITLES['trending']).toBe('Trending Now')
    expect(SECTION_TITLES['for-you']).toBe('Recommended for You')
  })
})

describe('CARD_SIZES', () => {
  it('should define poster and backdrop sizes', () => {
    expect(CARD_SIZES.poster.width).toBe(200)
    expect(CARD_SIZES.hero.width).toBe(1280)
  })
})

describe('LOADING_CONFIG', () => {
  it('should define sensible defaults', () => {
    expect(LOADING_CONFIG.skeletonCards).toBeGreaterThan(0)
    expect(LOADING_CONFIG.maxRetries).toBeGreaterThan(0)
  })
})

describe('RAIL_CONFIG', () => {
  it('should define rail behavior', () => {
    expect(RAIL_CONFIG.itemsPerRail).toBeGreaterThan(0)
    expect(RAIL_CONFIG.scrollStep).toBeGreaterThan(0)
  })
})

describe('UIRecommendationItem', () => {
  it('should create valid item', () => {
    const item: UIRecommendationItem = {
      mediaId: 'm1', title: 'Movie', cover: 'x', type: 'movie', year: 2024,
      score: 0.85, reason: 'Because you watched Inception',
      genres: ['Action'], rating: 8.5, progress: 0.6, duration: 7200,
      availableOn: ['Jellyfin'],
    }
    expect(item.mediaId).toBe('m1')
    expect(item.progress).toBe(0.6)
  })
})

describe('UIFeed', () => {
  it('should create valid feed', () => {
    const feed: UIFeed = {
      feedId: 'f1', sections: [], generatedAt: Date.now(), ttl: 60000, cacheHit: false,
    }
    expect(feed.feedId).toBe('f1')
    expect(feed.sections).toEqual([])
  })
})
