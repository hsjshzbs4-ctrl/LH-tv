// tests/unit/core/cache/cache-manager.spec.ts — CacheManager 单元测试
// 覆盖: get/set/delete/clear/has/cacheWrap/stats/L1→L2 读取链

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { CacheManager } from '@/core/cache/CacheManager'
import { CacheNamespace, CACHE_TTL } from '@/core/cache/types/cache.types'

// 不传 diskBaseDir，DiskStore 会跳过磁盘操作，仅测试 L1 内存层

describe('CacheManager', () => {
  let cache: CacheManager

  beforeEach(() => {
    cache = new CacheManager() // 无磁盘目录 = L1 only
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ==================== get/set ====================
  describe('get() / set()', () => {
    it('should return null for missing key', async () => {
      const result = await cache.get(CacheNamespace.SEARCH, 'nonexistent')
      expect(result).toBeNull()
    })

    it('should round-trip value', async () => {
      await cache.set(CacheNamespace.SEARCH, 'naruto', { results: ['a', 'b'] })
      const result = await cache.get<{ results: string[] }>(CacheNamespace.SEARCH, 'naruto')
      expect(result).toEqual({ results: ['a', 'b'] })
    })

    it('should use namespace as prefix (no cross-namespace collision)', async () => {
      await cache.set(CacheNamespace.SEARCH, 'key', 'search-value')
      await cache.set(CacheNamespace.DETAIL, 'key', 'detail-value')

      const searchResult = await cache.get(CacheNamespace.SEARCH, 'key')
      const detailResult = await cache.get(CacheNamespace.DETAIL, 'key')

      expect(searchResult).toBe('search-value')
      expect(detailResult).toBe('detail-value')
    })
  })

  // ==================== TTL ====================
  describe('TTL expiration', () => {
    it('should return null for expired entries', async () => {
      vi.useFakeTimers()

      // 写入缓存（默认 TTL 30min for SEARCH）
      await cache.set(CacheNamespace.SEARCH, 'test', 'value')

      // 未过期时能读到
      let result = await cache.get(CacheNamespace.SEARCH, 'test')
      expect(result).toBe('value')

      // 快进 TTL + 1ms
      vi.advanceTimersByTime(CACHE_TTL[CacheNamespace.SEARCH] + 1)

      result = await cache.get(CacheNamespace.SEARCH, 'test')
      expect(result).toBeNull()
    })

    it('should respect custom TTL parameter', async () => {
      vi.useFakeTimers()

      // 自定义 1 秒 TTL
      await cache.set(CacheNamespace.SEARCH, 'fast', 'expiring', 1000)

      vi.advanceTimersByTime(500)
      let result = await cache.get(CacheNamespace.SEARCH, 'fast')
      expect(result).toBe('expiring')

      vi.advanceTimersByTime(600) // 1100ms total > 1000
      result = await cache.get(CacheNamespace.SEARCH, 'fast')
      expect(result).toBeNull()
    })
  })

  // ==================== delete ====================
  describe('delete()', () => {
    it('should remove existing entry', async () => {
      await cache.set(CacheNamespace.SEARCH, 'key', 'val')
      await cache.delete(CacheNamespace.SEARCH, 'key')
      expect(await cache.get(CacheNamespace.SEARCH, 'key')).toBeNull()
    })

    it('should not throw for missing key', async () => {
      await expect(cache.delete(CacheNamespace.SEARCH, 'missing')).resolves.not.toThrow()
    })
  })

  // ==================== clear ====================
  describe('clear()', () => {
    it('should clear all namespaces', async () => {
      await cache.set(CacheNamespace.SEARCH, 'k1', 1)
      await cache.set(CacheNamespace.DETAIL, 'k2', 2)
      await cache.clear()

      expect(await cache.get(CacheNamespace.SEARCH, 'k1')).toBeNull()
      expect(await cache.get(CacheNamespace.DETAIL, 'k2')).toBeNull()
    })

    it('should clear specific namespace only', async () => {
      await cache.set(CacheNamespace.SEARCH, 'k1', 1)
      await cache.set(CacheNamespace.DETAIL, 'k2', 2)

      await cache.clear(CacheNamespace.SEARCH)

      expect(await cache.get(CacheNamespace.SEARCH, 'k1')).toBeNull()
      expect(await cache.get(CacheNamespace.DETAIL, 'k2')).toBe(2)
    })

    it('should reset stats when clearing all', async () => {
      await cache.set(CacheNamespace.SEARCH, 'k', 1)
      await cache.get(CacheNamespace.SEARCH, 'k') // hit
      await cache.get(CacheNamespace.SEARCH, 'miss') // miss

      const before = cache.getStats()
      expect(before.hits).toBeGreaterThan(0)

      await cache.clear()
      const after = cache.getStats()
      expect(after.hits).toBe(0)
      expect(after.misses).toBe(0)
    })
  })

  // ==================== has ====================
  describe('has()', () => {
    it('should return false for missing key', async () => {
      expect(await cache.has(CacheNamespace.SEARCH, 'missing')).toBe(false)
    })

    it('should return true for existing key', async () => {
      await cache.set(CacheNamespace.SEARCH, 'key', 'val')
      expect(await cache.has(CacheNamespace.SEARCH, 'key')).toBe(true)
    })
  })

  // ==================== cacheWrap ====================
  describe('cacheWrap()', () => {
    it('should return cached value on hit (no fetcher call)', async () => {
      await cache.set(CacheNamespace.SEARCH, 'cached', 'from-cache')
      const fetcher = vi.fn().mockResolvedValue('from-network')

      const result = await cache.cacheWrap(CacheNamespace.SEARCH, 'cached', fetcher)
      expect(result).toBe('from-cache')
      expect(fetcher).not.toHaveBeenCalled()
    })

    it('should call fetcher on miss and cache result', async () => {
      const fetcher = vi.fn().mockResolvedValue('from-network')

      // 第一次：miss → fetcher → cache
      const result1 = await cache.cacheWrap(CacheNamespace.SEARCH, 'key', fetcher)
      expect(result1).toBe('from-network')
      expect(fetcher).toHaveBeenCalledTimes(1)

      // 第二次：hit → from cache
      const result2 = await cache.cacheWrap(CacheNamespace.SEARCH, 'key', fetcher)
      expect(result2).toBe('from-network')
      expect(fetcher).toHaveBeenCalledTimes(1) // 未再次调用
    })

    it('should pass through fetcher error (no caching)', async () => {
      const fetcher = vi.fn().mockRejectedValue(new Error('provider down'))

      await expect(
        cache.cacheWrap(CacheNamespace.SEARCH, 'error-key', fetcher)
      ).rejects.toThrow('provider down')

      // 不应缓存错误结果
      expect(await cache.get(CacheNamespace.SEARCH, 'error-key')).toBeNull()
    })
  })

  // ==================== Stats ====================
  describe('getStats()', () => {
    it('should report correct hits and misses', async () => {
      await cache.set(CacheNamespace.SEARCH, 'a', 1)

      // hit
      await cache.get(CacheNamespace.SEARCH, 'a')
      // miss
      await cache.get(CacheNamespace.SEARCH, 'b')

      const stats = cache.getStats()
      expect(stats.hits).toBe(1)
      expect(stats.misses).toBe(1)
      expect(stats.hitRate).toBe(0.5)
    })

    it('should report size', async () => {
      await cache.set(CacheNamespace.SEARCH, 'a', 1)
      await cache.set(CacheNamespace.SEARCH, 'b', 2)

      const stats = cache.getStats()
      expect(stats.size).toBe(2)
    })
  })

  describe('resetStats()', () => {
    it('should reset hit/miss counters to zero', async () => {
      await cache.set(CacheNamespace.SEARCH, 'a', 1)
      await cache.get(CacheNamespace.SEARCH, 'a')
      await cache.get(CacheNamespace.SEARCH, 'b')

      cache.resetStats()
      const stats = cache.getStats()
      expect(stats.hits).toBe(0)
      expect(stats.misses).toBe(0)
    })
  })

  // ==================== memorySize ====================
  describe('memorySize', () => {
    it('should reflect L1 entries count', async () => {
      expect(cache.memorySize).toBe(0)
      await cache.set(CacheNamespace.SEARCH, 'a', 1)
      expect(cache.memorySize).toBe(1)
    })
  })
})
