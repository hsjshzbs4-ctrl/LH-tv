// src/core/providers/base/BaseProvider.ts - Provider 基类
// 统一提供: request, retry, timeout, cacheWrap, logger

import type { IProvider } from '../types/provider.types'
import type { MediaItem, MediaDetail } from '../types/media.types'
import { cacheManager, CacheNamespace } from '@/core/cache'

export abstract class BaseProvider implements IProvider {
  abstract id: string
  abstract name: string
  abstract priority: number

  enabled = true
  protected timeout = 10000
  protected maxRetries = 3
  protected headers: Record<string, string> = {}

  constructor(options?: { timeout?: number; maxRetries?: number; headers?: Record<string, string> }) {
    if (options?.timeout) this.timeout = options.timeout
    if (options?.maxRetries) this.maxRetries = options.maxRetries
    if (options?.headers) this.headers = options.headers
  }

  // ==================== 抽象方法 ====================

  abstract search(keyword: string): Promise<MediaItem[]>
  abstract detail(id: string): Promise<MediaDetail>

  // ==================== 缓存包装 ====================

  /** 带缓存的搜索 */
  protected async cachedSearch(keyword: string, fetcher: () => Promise<MediaItem[]>): Promise<MediaItem[]> {
    const cacheKey = `search:${this.id}:${keyword.toLowerCase().trim()}`
    return cacheManager.cacheWrap(CacheNamespace.SEARCH, cacheKey, fetcher)
  }

  /** 带缓存的详情 */
  protected async cachedDetail(id: string, fetcher: () => Promise<MediaDetail>): Promise<MediaDetail> {
    const cacheKey = `detail:${this.id}:${id}`
    return cacheManager.cacheWrap(CacheNamespace.DETAIL, cacheKey, fetcher)
  }

  /** 带缓存的分类目录 */
  protected async cachedCatalog(type: string, sub: string, fetcher: () => Promise<MediaItem[]>): Promise<MediaItem[]> {
    const cacheKey = `catalog:${this.id}:${type}:${sub}`
    return cacheManager.cacheWrap(CacheNamespace.CATALOG, cacheKey, fetcher)
  }

  // ==================== 重试 ====================

  protected async retry<T>(fn: () => Promise<T>, retries?: number): Promise<T> {
    const max = retries ?? this.maxRetries
    let lastError: Error | null = null

    for (let i = 0; i <= max; i++) {
      try {
        return await fn()
      } catch (e) {
        lastError = e as Error
        if (i < max) {
          // 指数退避
          await this.sleep(Math.pow(2, i) * 500)
        }
      }
    }
    throw lastError ?? new Error('Retry failed')
  }

  // ==================== 请求 ====================

  protected async request<T>(url: string, options?: RequestInit & { timeout?: number }): Promise<T> {
    const controller = new AbortController()
    const timeoutMs = options?.timeout ?? this.timeout
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const resp = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: { ...this.headers, ...options?.headers },
      })
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      return await resp.json() as T
    } finally {
      clearTimeout(timer)
    }
  }

  protected async requestText(url: string, options?: RequestInit & { timeout?: number }): Promise<string> {
    const controller = new AbortController()
    const timeoutMs = options?.timeout ?? this.timeout
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const resp = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: { ...this.headers, ...options?.headers },
      })
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      return await resp.text()
    } finally {
      clearTimeout(timer)
    }
  }

  // ==================== 健康检查 ====================

  async healthCheck(): Promise<boolean> {
    try {
      const results = await this.search('test')
      return Array.isArray(results)
    } catch {
      return false
    }
  }

  // ==================== 工具 ====================

  protected sleep(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms))
  }

  protected log(msg: string): void {
    console.log(`[${this.name}] ${msg}`)
  }
}
