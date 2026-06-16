// tests/unit/integration/recommendation-cache.spec.ts — PATCH 6 Cache 测试
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { RecommendationCache } from '@/integration/recommendation/recommendationCache'

describe('RecommendationCache', () => {
  let cache: RecommendationCache

  beforeEach(() => { cache = new RecommendationCache() })
  afterEach(() => { vi.restoreAllMocks() })

  describe('set/get', () => {
    it('should cache and retrieve data (cache hit)', () => {
      cache.set('key1', { items: ['a', 'b'] })
      expect(cache.get('key1')).toEqual({ items: ['a', 'b'] })
    })

    it('should return null for missing key (cache miss)', () => {
      expect(cache.get('nonexistent')).toBeNull()
    })
  })

  describe('TTL', () => {
    it('should expire after 30 minutes', () => {
      vi.useFakeTimers()
      cache.set('key1', { data: 'test' })
      expect(cache.get('key1')).not.toBeNull()
      vi.advanceTimersByTime(31 * 60 * 1000) // 31 minutes
      expect(cache.get('key1')).toBeNull() // expired
      vi.useRealTimers()
    })

    it('should be valid within TTL', () => {
      vi.useFakeTimers()
      cache.set('key1', { data: 'test' })
      vi.advanceTimersByTime(15 * 60 * 1000) // 15 minutes
      expect(cache.get('key1')).not.toBeNull() // still valid
      vi.useRealTimers()
    })
  })

  describe('makeKey', () => {
    it('should generate consistent keys', () => {
      expect(cache.makeKey('p1', 'm1', 'related')).toBe('p1:m1:related')
    })
  })

  describe('invalidate', () => {
    it('should remove specific key', () => {
      cache.set('key1', 'data1')
      cache.set('key2', 'data2')
      cache.invalidate('key1')
      expect(cache.get('key1')).toBeNull()
      expect(cache.get('key2')).not.toBeNull()
    })
  })

  describe('clear', () => {
    it('should remove all entries', () => {
      cache.set('k1', 'd1')
      cache.set('k2', 'd2')
      cache.clear()
      expect(cache.get('k1')).toBeNull()
      expect(cache.get('k2')).toBeNull()
    })
  })
})
