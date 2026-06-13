// src/core/cache/strategies/TTLStrategy.ts - TTL 策略

import type { CacheEntry } from '@/shared/types'
import { CACHE_TTL, CacheNamespace } from '../types/cache.types'

/** 检查缓存条目是否过期 */
export function isExpired(entry: CacheEntry<unknown>): boolean {
  return Date.now() > entry.timestamp + entry.ttl
}

/** 获取命名空间的默认 TTL */
export function getDefaultTTL(namespace: CacheNamespace): number {
  return CACHE_TTL[namespace]
}

/** 创建带 TTL 的缓存条目 */
export function createEntry<T>(key: string, value: T, ttl?: number): CacheEntry<T> {
  const effectiveTTL = ttl ?? CACHE_TTL[CacheNamespace.SEARCH]
  return {
    key,
    value,
    timestamp: Date.now(),
    ttl: effectiveTTL,
  }
}
