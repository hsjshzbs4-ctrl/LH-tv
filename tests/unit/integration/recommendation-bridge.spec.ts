// tests/unit/integration/recommendation-bridge.spec.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { RecommendationBridge } from '@/integration/recommendation/recommendationBridge'

describe('RecommendationBridge', () => {
  let bridge: RecommendationBridge

  beforeEach(() => { bridge = new RecommendationBridge() })

  describe('getRelatedShows', () => {
    it('should return stub result', async () => {
      const result = await bridge.getRelatedShows('p1', 'm1')
      expect(result.items).toEqual([])
      expect(result.source).toBe('pb2-s2-stub')
    })
  })

  describe('getNextEpisode', () => {
    it('should return null (stub)', async () => {
      expect(await bridge.getNextEpisode('p1', 'm1', 'ep1')).toBeNull()
    })
  })

  describe('getSimilarCategory', () => {
    it('should return stub result', async () => {
      const result = await bridge.getSimilarCategory('anime', 'm1')
      expect(result.items).toEqual([])
    })
  })

  describe('clearCache', () => {
    it('should clear without error', () => {
      expect(() => bridge.clearCache()).not.toThrow()
    })
  })
})
