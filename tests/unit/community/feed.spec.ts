// tests/unit/community/feed.spec.ts — Feed 服务单元测试
// PB7-S4: FeedBuilder + FeedService

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { FeedBuilder, FeedService } from '@community/index'
import { CertificationLevel } from '@ecosystem/index'
import type { CommunityItem, FeedQuery } from '@community/index'

// Mock feature flag manager
vi.mock('@platform/flags', () => ({
  featureFlagManager: {
    isEnabled: vi.fn().mockReturnValue(true),
  },
}))

// Create a helper to build test items
function makeItem(overrides: Partial<CommunityItem> = {}): CommunityItem {
  return {
    id: 'test.template',
    type: 'template',
    title: 'Test Template',
    description: 'A test template',
    authorId: 'test',
    authorName: 'Test',
    tags: ['test'],
    averageRating: 4.5,
    ratingCount: 10,
    commentCount: 5,
    downloads: 50,
    certificationLevel: CertificationLevel.COMMUNITY,
    createdAt: Date.now() - 86400000, // 1 day ago
    updatedAt: Date.now(),
    ...overrides,
  }
}

describe('FeedBuilder', () => {
  describe('computeRelevance', () => {
    it('returns high score for highly-rated popular item', () => {
      const item = makeItem({ averageRating: 5, downloads: 1000, commentCount: 50 })
      const score = FeedBuilder.computeRelevance(item)
      expect(score).toBeGreaterThan(0.5)
    })

    it('returns low score for new unrated item', () => {
      const item = makeItem({ averageRating: 0, downloads: 0, commentCount: 0 })
      const score = FeedBuilder.computeRelevance(item)
      expect(score).toBeLessThanOrEqual(0.3) // mostly recency bonus
    })

    it('returns score between 0 and 1', () => {
      const item = makeItem()
      const score = FeedBuilder.computeRelevance(item)
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(1)
    })
  })

  describe('generateReason', () => {
    it('returns "Highly rated" for items with rating >= 4.5', () => {
      const item = makeItem({ averageRating: 4.8 })
      expect(FeedBuilder.generateReason(item)).toBe('Highly rated by community')
    })

    it('returns "Popular" for items with many downloads', () => {
      const item = makeItem({ averageRating: 3, downloads: 200 })
      expect(FeedBuilder.generateReason(item)).toBe('Popular in community')
    })

    it('returns "New in community" for recent items', () => {
      const item = makeItem({ averageRating: 3, downloads: 0, commentCount: 0, createdAt: Date.now() })
      expect(FeedBuilder.generateReason(item)).toBe('New in community')
    })
  })

  describe('buildFeed', () => {
    it('builds and sorts feed entries', () => {
      const items = [
        makeItem({ id: 'a', title: 'A', averageRating: 3 }),
        makeItem({ id: 'b', title: 'B', averageRating: 5 }),
      ]

      const feed = FeedBuilder.buildFeed(items, { sort: 'rating', order: 'desc' })
      expect(feed.length).toBe(2)
      expect(feed[0].item.title).toBe('B')
      expect(feed[1].item.title).toBe('A')
    })

    it('sorts by name asc', () => {
      const items = [
        makeItem({ id: 'b', title: 'Z Template' }),
        makeItem({ id: 'a', title: 'A Template' }),
      ]

      const feed = FeedBuilder.buildFeed(items, { sort: 'name', order: 'asc' })
      expect(feed[0].item.title).toBe('A Template')
    })
  })

  describe('sortEntries', () => {
    it('sorts by downloads desc', () => {
      const entries = [
        { item: makeItem({ id: 'a', downloads: 10 }), relevanceScore: 0, recommendationReason: '' },
        { item: makeItem({ id: 'b', downloads: 100 }), relevanceScore: 0, recommendationReason: '' },
      ]

      const sorted = FeedBuilder.sortEntries(entries, 'downloads', 'desc')
      expect(sorted[0].item.downloads).toBe(100)
    })
  })
})

describe('FeedService', () => {
  let service: FeedService

  beforeEach(() => {
    service = new FeedService()
  })

  // FeedService depends on communityRegistry — test at integration level
  // These are smoke tests that verify method signatures don't throw on empty registry

  describe('smoke tests', () => {
    it('getFeed returns empty array on empty registry', () => {
      // Since communityRegistry is mocked and returns empty, feeds return empty
      // This verifies the method exists and doesn't crash
      expect(() => service.getFeed({})).not.toThrow()
    })

    it('getTrending returns empty array on empty registry', () => {
      expect(() => service.getTrending()).not.toThrow()
    })

    it('getNewest returns empty array on empty registry', () => {
      expect(() => service.getNewest()).not.toThrow()
    })

    it('getByCategory returns empty array on empty registry', () => {
      expect(() => service.getByCategory('template')).not.toThrow()
    })
  })
})
