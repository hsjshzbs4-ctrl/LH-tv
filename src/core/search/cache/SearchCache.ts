// src/core/search/cache/SearchCache.ts - 搜索缓存（内存 Map + TTL）
// P3.4 Unified Search System
//
// 职责：缓存搜索结果，5 分钟 TTL
// 禁止：持久化、Provider、UI

import type { UnifiedSearchResult } from '../types/search.types'

interface CacheEntry {
  items: UnifiedSearchResult[]
  timestamp: number
}

export class SearchCache {
  private store = new Map<string, CacheEntry>()
  private readonly ttl: number

  /**
   * @param ttlMs TTL 毫秒数，默认 5 分钟
   */
  constructor(ttlMs = 5 * 60 * 1000) {
    this.ttl = ttlMs
  }

  /** 获取缓存（key 不区分大小写），过期返回 null */
  get(keyword: string): UnifiedSearchResult[] | null {
    const key = keyword.toLowerCase().trim()
    const entry = this.store.get(key)
    if (!entry) return null
    if (Date.now() - entry.timestamp > this.ttl) {
      this.store.delete(key)
      return null
    }
    return entry.items
  }

  /** 写入缓存 */
  set(keyword: string, items: UnifiedSearchResult[]): void {
    const key = keyword.toLowerCase().trim()
    if (!key) return
    this.store.set(key, {
      items,
      timestamp: Date.now(),
    })
  }

  /** 清除指定缓存，不传 keyword 清除全部 */
  invalidate(keyword?: string): void {
    if (keyword) {
      this.store.delete(keyword.toLowerCase().trim())
    } else {
      this.store.clear()
    }
  }

  /** 当前缓存条目数 */
  get size(): number {
    return this.store.size
  }
}
