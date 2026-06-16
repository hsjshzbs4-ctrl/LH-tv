// src/integration/recommendation/recommendationCache.ts — PB2-S2 Recommendation Cache
// PATCH 6: 30 min TTL，避免每次 Detail Page 访问重新查询

interface CacheEntry<T> {
  data: T
  timestamp: number
}

const TTL = 30 * 60 * 1000 // 30 分钟

export class RecommendationCache {
  private store = new Map<string, CacheEntry<unknown>>()

  /** 生成缓存 key */
  makeKey(providerId: string, mediaId: string, type: string): string {
    return `${providerId}:${mediaId}:${type}`
  }

  /** 读取缓存 */
  get<T>(key: string): T | null {
    const entry = this.store.get(key)
    if (!entry) return null
    if (Date.now() - entry.timestamp > TTL) {
      this.store.delete(key)
      return null
    }
    return entry.data as T
  }

  /** 写入缓存 */
  set<T>(key: string, data: T): void {
    this.store.set(key, { data, timestamp: Date.now() })
  }

  /** 清除指定缓存 */
  invalidate(key: string): void { this.store.delete(key) }

  /** 清除所有缓存 */
  clear(): void { this.store.clear() }
}
