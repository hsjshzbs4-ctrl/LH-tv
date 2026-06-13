// src/core/cache/index.ts - 缓存模块统一导出

export { CacheManager } from './CacheManager'
export { MemoryStore } from './stores/MemoryStore'
export { DiskStore } from './stores/DiskStore'
export { createEntry, getDefaultTTL, isExpired } from './strategies/TTLStrategy'
export { CacheNamespace, CACHE_TTL, CACHE_LIMITS } from './types/cache.types'
export type { ICacheManager, CacheWrapFn } from './types/cache.types'

// 全局单例（渲染进程内共享）
import { CacheManager } from './CacheManager'
export const cacheManager = new CacheManager()
