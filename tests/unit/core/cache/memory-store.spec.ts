// tests/unit/core/cache/memory-store.spec.ts — MemoryStore 单元测试
// 覆盖: get/set/delete/clear/has/size/LRU eviction/TTL expiration

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryStore } from '@/core/cache/stores/MemoryStore'
import { createEntry } from '@/core/cache/strategies/TTLStrategy'
import { CacheNamespace } from '@/core/cache/types/cache.types'

describe('MemoryStore', () => {
  let store: MemoryStore

  beforeEach(() => {
    store = new MemoryStore(5) // 小容量便于测试 LRU
  })

  // ==================== get/set ====================
  describe('get() / set()', () => {
    it('should return null for missing key', () => {
      expect(store.get('missing')).toBeNull()
    })

    it('should round-trip value', () => {
      const entry = createEntry('key1', { name: 'test' })
      store.set('key1', { name: 'test' }, entry)
      const result = store.get<{ name: string }>('key1')
      expect(result).toEqual({ name: 'test' })
    })

    it('should update existing key', () => {
      const e1 = createEntry('key1', 'old')
      const e2 = createEntry('key1', 'new')
      store.set('key1', 'old', e1)
      store.set('key1', 'new', e2)
      expect(store.get('key1')).toBe('new')
      expect(store.size).toBe(1) // 不应重复
    })

    it('should return null for expired entry', () => {
      // 创建一个 1ms 前过期的条目
      const expired = createEntry('key1', 'value')
      expired.timestamp = Date.now() - 10000 // 过去
      expired.ttl = 1000 // 1秒 TTL
      store.set('key1', 'value', expired)
      expect(store.get('key1')).toBeNull()
      expect(store.size).toBe(0) // 被自动清理
    })
  })

  // ==================== has ====================
  describe('has()', () => {
    it('should return false for missing key', () => {
      expect(store.has('missing')).toBe(false)
    })

    it('should return true for existing non-expired key', () => {
      const entry = createEntry('key1', 'value')
      store.set('key1', 'value', entry)
      expect(store.has('key1')).toBe(true)
    })

    it('should return false for expired key (and clean up)', () => {
      const expired = createEntry('key1', 'value')
      expired.timestamp = Date.now() - 10000
      expired.ttl = 1
      store.set('key1', 'value', expired)
      expect(store.has('key1')).toBe(false)
      expect(store.size).toBe(0)
    })
  })

  // ==================== delete ====================
  describe('delete()', () => {
    it('should remove existing entry', () => {
      const entry = createEntry('key1', 'value')
      store.set('key1', 'value', entry)
      store.delete('key1')
      expect(store.get('key1')).toBeNull()
      expect(store.size).toBe(0)
    })

    it('should not throw on missing key', () => {
      expect(() => store.delete('missing')).not.toThrow()
    })
  })

  // ==================== clear ====================
  describe('clear()', () => {
    it('should remove all entries', () => {
      for (let i = 0; i < 3; i++) {
        const entry = createEntry(`key${i}`, i)
        store.set(`key${i}`, i, entry)
      }
      expect(store.size).toBe(3)
      store.clear()
      expect(store.size).toBe(0)
    })
  })

  // ==================== LRU Eviction ====================
  describe('LRU eviction', () => {
    it('should evict oldest entry when at capacity', () => {
      const max = 5
      // 填满
      for (let i = 0; i < max; i++) {
        const entry = createEntry(`key${i}`, i)
        store.set(`key${i}`, i, entry)
      }
      expect(store.size).toBe(max)

      // 再插入，应淘汰 key0（最早）
      const entry6 = createEntry('key6', 6)
      store.set('key6', 6, entry6)
      expect(store.size).toBe(max)
      expect(store.get('key0')).toBeNull() // 被淘汰
      expect(store.get('key6')).toBe(6)   // 新条目存在
    })

    it('should promote accessed entries (LRU update)', () => {
      // 插入 5 个
      for (let i = 0; i < 5; i++) {
        const entry = createEntry(`key${i}`, i)
        store.set(`key${i}`, i, entry)
      }
      // 访问 key0（把它移到 LRU 末尾）
      store.get('key0')

      // 插入新条目
      const entry5 = createEntry('key5', 5)
      store.set('key5', 5, entry5)

      // key0 被访问过，不应被淘汰；key1 应该最先被淘汰
      expect(store.get('key0')).toBe(0)
      expect(store.get('key1')).toBeNull()
    })
  })

  // ==================== size ====================
  describe('size', () => {
    it('should reflect current count', () => {
      expect(store.size).toBe(0)
      const e = createEntry('k', 'v')
      store.set('k', 'v', e)
      expect(store.size).toBe(1)
      store.delete('k')
      expect(store.size).toBe(0)
    })
  })

  // ==================== custom maxSize ====================
  it('should respect constructor maxSize', () => {
    const small = new MemoryStore(2)
    for (let i = 0; i < 3; i++) {
      const entry = createEntry(`k${i}`, i)
      small.set(`k${i}`, i, entry)
    }
    expect(small.size).toBe(2)
  })
})
