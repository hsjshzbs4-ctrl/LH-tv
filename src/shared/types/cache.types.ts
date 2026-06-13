// src/shared/types/cache.types.ts - 缓存相关类型

/** 缓存条目 */
export interface CacheEntry<T> {
  key: string
  value: T
  timestamp: number
  ttl: number
}

/** 缓存统计 */
export interface CacheStats {
  size: number
  maxSize: number
  hitRate: number
  hits: number
  misses: number
}

/** TTL 配置 */
export interface TTLConfig {
  poster: number       // 海报 TTL（ms），默认 30 天
  detail: number       // 详情 TTL（ms），默认 7 天
  play: number         // 播放源 TTL（ms），默认 12 小时
  search: number       // 搜索 TTL（ms），默认 24 小时
}
