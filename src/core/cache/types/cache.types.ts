// src/core/cache/types/cache.types.ts - 缓存类型补充

import type { CacheEntry, CacheStats } from '@/shared/types'

/** 缓存命名空间 */
export enum CacheNamespace {
  SEARCH = 'search',
  DETAIL = 'detail',
  CATALOG = 'catalog',
  EPISODE = 'episode',
  POSTER = 'poster',
}

/** TTL 配置（毫秒） */
export const CACHE_TTL: Record<CacheNamespace, number> = {
  [CacheNamespace.SEARCH]: 30 * 60 * 1000,       // 30 分钟
  [CacheNamespace.DETAIL]: 6 * 60 * 60 * 1000,   // 6 小时
  [CacheNamespace.CATALOG]: 60 * 60 * 1000,      // 1 小时
  [CacheNamespace.EPISODE]: 6 * 60 * 60 * 1000,  // 6 小时
  [CacheNamespace.POSTER]: 30 * 24 * 60 * 60 * 1000, // 30 天
}

/** 缓存容量限制 */
export const CACHE_LIMITS = {
  MEMORY_MAX_ENTRIES: 500,
  DISK_MAX_SIZE_MB: 200,
  POSTER_MAX_SIZE_MB: 500,
} as const

/** 两层缓存管理器接口 */
export interface ICacheManager {
  get<T>(namespace: CacheNamespace, key: string): Promise<T | null>
  set<T>(namespace: CacheNamespace, key: string, value: T, ttl?: number): Promise<void>
  delete(namespace: CacheNamespace, key: string): Promise<void>
  clear(namespace?: CacheNamespace): Promise<void>
  has(namespace: CacheNamespace, key: string): Promise<boolean>
  getStats(): CacheStats
}

/** 缓存包装函数类型 */
export type CacheWrapFn = <T>(
  namespace: CacheNamespace,
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
) => Promise<T>
