// core/content-ecosystem/utils/MetadataCache.ts — CE3
// Long-TTL cache for metadata (posters, actor bios change rarely)
// Wraps the existing CacheManager for consistency

import { cacheManager, CacheNamespace } from '@/core/cache'

export const METADATA_TTL = {
  search:  1 * 60 * 60 * 1000,       // 1 hour
  detail:  24 * 60 * 60 * 1000,      // 24 hours
  person:  7 * 24 * 60 * 60 * 1000,  // 7 days
  trending: 6 * 60 * 60 * 1000,      // 6 hours
  image:   7 * 24 * 60 * 60 * 1000,  // 7 days
} as const

export class MetadataCache {
  async wrap<T>(
    namespace: string,
    key: string,
    fetcher: () => Promise<T>,
    ttlMs: number
  ): Promise<T> {
    return cacheManager.cacheWrap(
      CacheNamespace.METADATA,
      `ecosystem:${namespace}:${key}`,
      fetcher,
      ttlMs
    ) as Promise<T>
  }

  async get<T>(namespace: string, key: string): Promise<T | null> {
    const result = await cacheManager.get(
      CacheNamespace.METADATA,
      `ecosystem:${namespace}:${key}`
    )
    return result as T | null
  }

  async set<T>(namespace: string, key: string, value: T, ttlMs: number): Promise<void> {
    await cacheManager.set(
      CacheNamespace.METADATA,
      `ecosystem:${namespace}:${key}`,
      value,
      ttlMs
    )
  }

  async delete(namespace: string, key: string): Promise<void> {
    await cacheManager.delete(CacheNamespace.METADATA, `ecosystem:${namespace}:${key}`)
  }
}

export const metadataCache = new MetadataCache()
