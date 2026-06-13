// src/core/cache/CacheManager.ts - 统一缓存管理器（两层架构）
//
// 架构:
//   View / ProviderFacade
//        ↓
//   CacheManager
//     ├── L1: MemoryStore (LRU, 最快, 应用关闭即失效)
//     └── L2: DiskStore  (持久化, 应用重启保留)
//
// 读策略: L1 → L2 → Provider (回填 L1+L2)
// 写策略: L1 + L2 同时写入

import type { CacheStats, CacheEntry } from '@/shared/types'
import type { ICacheManager } from './types/cache.types'
import { CacheNamespace, CACHE_LIMITS } from './types/cache.types'
import { MemoryStore } from './stores/MemoryStore'
import { DiskStore } from './stores/DiskStore'
import { createEntry, getDefaultTTL } from './strategies/TTLStrategy'

export class CacheManager implements ICacheManager {
  private memory: MemoryStore
  private disk: DiskStore

  // 统计
  private hits = 0
  private misses = 0

  constructor(diskBaseDir?: string) {
    this.memory = new MemoryStore(CACHE_LIMITS.MEMORY_MAX_ENTRIES)
    this.disk = new DiskStore(diskBaseDir)
  }

  /** 设置磁盘缓存目录 */
  setDiskBaseDir(dir: string): void {
    this.disk.setBaseDir(dir)
  }

  // ==================== 读取（L1 → L2 → null） ====================

  async get<T>(namespace: CacheNamespace, key: string): Promise<T | null> {
    const fullKey = `${namespace}:${key}`

    // L1: 内存
    const memResult = this.memory.get<T>(fullKey)
    if (memResult !== null) {
      this.hits++
      return memResult
    }

    // L2: 磁盘
    const diskResult = await this.disk.get<T>(namespace, key)
    if (diskResult !== null) {
      this.hits++
      // 回填 L1
      const entry = createEntry(fullKey, diskResult, getDefaultTTL(namespace))
      this.memory.set(fullKey, diskResult, entry)
      return diskResult
    }

    this.misses++
    return null
  }

  // ==================== 写入（L1 + L2） ====================

  async set<T>(namespace: CacheNamespace, key: string, value: T, ttl?: number): Promise<void> {
    const fullKey = `${namespace}:${key}`
    const effectiveTTL = ttl ?? getDefaultTTL(namespace)
    const entry = createEntry(fullKey, value, effectiveTTL)

    // L1 写入
    this.memory.set(fullKey, value, entry)

    // L2 写入（异步，不阻塞）
    this.disk.set(namespace, key, entry).catch(() => { /* ignore */ })
  }

  // ==================== 删除 ====================

  async delete(namespace: CacheNamespace, key: string): Promise<void> {
    const fullKey = `${namespace}:${key}`
    this.memory.delete(fullKey)
    await this.disk.delete(namespace, key)
  }

  // ==================== 清空 ====================

  async clear(namespace?: CacheNamespace): Promise<void> {
    if (namespace) {
      // 清除特定命名空间
      const prefix = `${namespace}:`
      const keysToDelete: string[] = []
      // MemoryStore 没有 keys() 方法，直接清空不便按前缀删除
      // 通过 Disk 清空后，下次读取时 L1 会 miss 然后从空 L2 读取
      this.memory.clear()
      await this.disk.clear(namespace)
    } else {
      this.memory.clear()
      await this.disk.clear()
      this.hits = 0
      this.misses = 0
    }
  }

  // ==================== 检查 ====================

  async has(namespace: CacheNamespace, key: string): Promise<boolean> {
    const fullKey = `${namespace}:${key}`
    if (this.memory.has(fullKey)) return true
    const diskResult = await this.disk.get(namespace, key)
    return diskResult !== null
  }

  // ==================== 便捷方法: cacheWrap ====================

  /**
   * 缓存包装器：自动读缓存 → 未命中时调用 fetcher → 写入缓存
   *
   * @example
   * const result = await cacheManager.cacheWrap(
   *   CacheNamespace.SEARCH,
   *   'naruto',
   *   () => provider.search('naruto')
   * )
   */
  async cacheWrap<T>(
    namespace: CacheNamespace,
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // 尝试读缓存
    const cached = await this.get<T>(namespace, key)
    if (cached !== null) return cached

    // 未命中：调用 Provider
    const result = await fetcher()

    // 写入缓存（异步不阻塞返回）
    this.set(namespace, key, result, ttl).catch(() => { /* ignore */ })

    return result
  }

  // ==================== 统计 ====================

  getStats(): CacheStats {
    const total = this.hits + this.misses
    return {
      size: this.memory.size,
      maxSize: CACHE_LIMITS.MEMORY_MAX_ENTRIES,
      hitRate: total > 0 ? Math.round((this.hits / total) * 100) / 100 : 0,
      hits: this.hits,
      misses: this.misses,
    }
  }

  /** 重置统计计数器 */
  resetStats(): void {
    this.hits = 0
    this.misses = 0
  }

  /** 获取内存条目数 */
  get memorySize(): number {
    return this.memory.size
  }
}
