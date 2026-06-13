// tests/unit/core/search/search-cache.spec.ts — SearchCache 单元测试
// 覆盖: get/set/invalidate/TTL/case-insensitive/size

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SearchCache } from '@/core/search/cache/SearchCache'

describe('SearchCache', () => {
  let cache: SearchCache

  beforeEach(() => {
    cache = new SearchCache(5 * 60 * 1000) // 5 分钟 TTL
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('get()', () => {
    it('should return null for missing key', () => {
      expect(cache.get('nonexistent')).toBeNull()
    })

    it('should return cached items for existing key', () => {
      const items = [{ title: 'Naruto', type: 'anime' }] as any[]
      cache.set('naruto', items)
      expect(cache.get('naruto')).toEqual(items)
    })

    it('should be case-insensitive', () => {
      const items = [{ title: 'Test' }] as any[]
      cache.set('NARUTO', items)
      expect(cache.get('naruto')).toEqual(items)
      expect(cache.get('NaRuTo')).toEqual(items)
    })

    it('should trim whitespace in key', () => {
      const items = [{ title: 'Test' }] as any[]
      cache.set('  naruto  ', items)
      expect(cache.get('naruto')).toEqual(items)
    })

    it('should return null for expired entry', () => {
      vi.useFakeTimers()

      cache.set('naruto', [{ title: 'Naruto' }] as any[])
      // 未过期
      expect(cache.get('naruto')).not.toBeNull()

      // 快进 TTL + 1ms
      vi.advanceTimersByTime(5 * 60 * 1000 + 1)

      expect(cache.get('naruto')).toBeNull()
    })

    it('should auto-delete expired entry on get', () => {
      vi.useFakeTimers()

      cache.set('naruto', [{ title: 'Naruto' }] as any[])
      vi.advanceTimersByTime(5 * 60 * 1000 + 1)

      expect(cache.size).toBe(1) // 还在
      cache.get('naruto') // 触发过期清理
      expect(cache.size).toBe(0) // 已被删除
    })
  })

  describe('set()', () => {
    it('should write items and update timestamp', () => {
      const items = [{ title: 'One Piece' }] as any[]
      cache.set('one piece', items)
      expect(cache.size).toBe(1)
      expect(cache.get('one piece')).toEqual(items)
    })

    it('should overwrite existing key', () => {
      cache.set('key', [{ title: 'old' }] as any[])
      cache.set('key', [{ title: 'new' }] as any[])
      const result = cache.get('key')
      expect(result).toHaveLength(1)
      expect(result![0].title).toBe('new')
    })

    it('should ignore empty key (whitespace only)', () => {
      cache.set('   ', [{ title: 'test' }] as any[])
      expect(cache.size).toBe(0)
    })

    it('should ignore empty string key', () => {
      cache.set('', [{ title: 'test' }] as any[])
      expect(cache.size).toBe(0)
    })
  })

  describe('invalidate()', () => {
    it('should remove specific key', () => {
      cache.set('a', [{ title: 'A' }] as any[])
      cache.set('b', [{ title: 'B' }] as any[])

      cache.invalidate('a')
      expect(cache.get('a')).toBeNull()
      expect(cache.get('b')).not.toBeNull()
    })

    it('should clear all when no keyword given', () => {
      cache.set('a', [{ title: 'A' }] as any[])
      cache.set('b', [{ title: 'B' }] as any[])

      cache.invalidate()
      expect(cache.size).toBe(0)
    })
  })

  describe('size', () => {
    it('should reflect current count', () => {
      expect(cache.size).toBe(0)
      cache.set('a', [{ title: 'A' }] as any[])
      expect(cache.size).toBe(1)
      cache.set('b', [{ title: 'B' }] as any[])
      expect(cache.size).toBe(2)
      cache.invalidate('a')
      expect(cache.size).toBe(1)
    })
  })

  describe('custom TTL', () => {
    it('should respect constructor TTL parameter', () => {
      const shortCache = new SearchCache(50) // 50ms TTL
      shortCache.set('key', [{ title: 'val' }] as any[])
      expect(shortCache.get('key')).not.toBeNull()
    })
  })
})
