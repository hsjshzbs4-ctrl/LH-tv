// src/core/cache/stores/MemoryStore.ts - L1: 内存 LRU 缓存
// 最快访问速度，应用关闭即失效

import type { CacheEntry } from '@/shared/types'
import { isExpired } from '../strategies/TTLStrategy'
import { CACHE_LIMITS } from '../types/cache.types'

export class MemoryStore {
  private store = new Map<string, CacheEntry<unknown>>()
  private accessOrder: string[] = [] // LRU: 最近访问在末尾
  private maxSize: number

  constructor(maxSize = CACHE_LIMITS.MEMORY_MAX_ENTRIES) {
    this.maxSize = maxSize
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key)
    if (!entry) return null

    if (isExpired(entry)) {
      this.delete(key)
      return null
    }

    // LRU: 更新访问顺序
    this.touch(key)
    return entry.value as T
  }

  set<T>(key: string, value: T, entry: CacheEntry<T>): void {
    // 已存在则更新
    if (this.store.has(key)) {
      this.store.set(key, entry as CacheEntry<unknown>)
      this.touch(key)
      return
    }

    // LRU 淘汰
    while (this.accessOrder.length >= this.maxSize) {
      const oldest = this.accessOrder.shift()
      if (oldest) this.store.delete(oldest)
    }

    this.store.set(key, entry as CacheEntry<unknown>)
    this.accessOrder.push(key)
  }

  delete(key: string): void {
    this.store.delete(key)
    const idx = this.accessOrder.indexOf(key)
    if (idx !== -1) this.accessOrder.splice(idx, 1)
  }

  clear(): void {
    this.store.clear()
    this.accessOrder = []
  }

  has(key: string): boolean {
    const entry = this.store.get(key)
    if (!entry) return false
    if (isExpired(entry)) {
      this.delete(key)
      return false
    }
    return true
  }

  get size(): number {
    return this.accessOrder.length
  }

  private touch(key: string): void {
    const idx = this.accessOrder.indexOf(key)
    if (idx !== -1) this.accessOrder.splice(idx, 1)
    this.accessOrder.push(key)
  }
}
