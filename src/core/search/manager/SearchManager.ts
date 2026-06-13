// src/core/search/manager/SearchManager.ts - 搜索管理器
// P3.4 Unified Search System
//
// 职责：搜索编排、历史管理、建议生成、订阅通知
// 禁止：UI、IPC、Provider 实现细节
//
// 架构：SearchView → SearchFacade → SearchManager → AggregationFacade.aggregateSearch()
//                                                      → StorageService (history)
//                                                      → SearchCache (cache)

import { aggregationFacade } from '@/core/aggregation'
import { storageService } from '@/shared/storage/storage.service'
import { SearchCache } from '../cache/SearchCache'
import type { SearchHistoryItem, UnifiedSearchResult } from '../types/search.types'
import type { AggregatedSearchItem } from '@/core/aggregation'

type Subscriber = () => void

export class SearchManager {
  /** keyword → SearchHistoryItem（Map 索引，O(1) 查找） */
  private history = new Map<string, SearchHistoryItem>()
  private cache = new SearchCache(5 * 60 * 1000)
  private subscribers = new Set<Subscriber>()
  private loaded = false

  private readonly MAX_HISTORY = 20

  // ==================== 初始化 ====================

  async initialize(): Promise<void> {
    if (this.loaded) return
    try {
      const items = await storageService.getSearchHistory()
      this.history.clear()
      for (const item of items) {
        if (item && typeof item.keyword === 'string') {
          this.history.set(item.keyword, item)
        }
      }
    } catch { /* ignore */ }
    this.loaded = true
  }

  // ==================== 搜索 ====================

  /**
   * 统一搜索：缓存命中直接返回，未命中调用 ProviderFacade.search()
   * 自动写入搜索历史
   */
  async search(keyword: string): Promise<UnifiedSearchResult[]> {
    const kw = keyword.trim()
    if (!kw) return []

    // 1. 查缓存
    const cached = this.cache.get(kw)
    if (cached) {
      // 缓存命中 → 更新搜索历史时间戳（不重新排序）
      await this._addHistory(kw)
      return cached
    }

    // 2. 调 AggregationEngine 多源聚合搜索
    const result = await aggregationFacade.search(kw)
    const items = this._mapAggregatedResults(result.items)

    // 3. 写缓存
    this.cache.set(kw, items)

    // 4. 写历史
    await this._addHistory(kw)

    return items
  }

  // ==================== 搜索历史 ====================

  /** 获取搜索历史（searchedAt DESC） */
  getHistory(): SearchHistoryItem[] {
    return Array.from(this.history.values()).sort(
      (a, b) => b.searchedAt - a.searchedAt,
    )
  }

  /** 添加搜索历史（去重 + 限长 + 持久化） */
  async addHistory(keyword: string): Promise<void> {
    await this._addHistory(keyword)
  }

  /** 删除单条历史 */
  async removeHistory(keyword: string): Promise<void> {
    this.history.delete(keyword)
    await this._saveHistory()
    this._notify()
  }

  /** 清空全部历史 */
  async clearHistory(): Promise<void> {
    this.history.clear()
    await this._saveHistory()
    this._notify()
  }

  // ==================== 搜索建议 ====================

  /**
   * 从搜索历史中生成建议（startsWith，不区分大小写）
   * @param prefix 输入前缀
   * @param limit  最大返回数
   */
  getSuggestions(prefix: string, limit = 8): SearchHistoryItem[] {
    if (!prefix.trim()) return []
    const lower = prefix.toLowerCase().trim()
    return this.getHistory()
      .filter((h) => h.keyword.toLowerCase().startsWith(lower))
      .slice(0, limit)
  }

  // ==================== 缓存管理 ====================

  /** 清除搜索缓存 */
  clearCache(keyword?: string): void {
    this.cache.invalidate(keyword)
  }

  /** 缓存条目数 */
  get cacheSize(): number {
    return this.cache.size
  }

  // ==================== 订阅 ====================

  subscribe(callback: Subscriber): () => void {
    this.subscribers.add(callback)
    return () => { this.subscribers.delete(callback) }
  }

  // ==================== 内部方法 ====================

  /** 写入历史（去重 → 置顶 → 截断 → 持久化 → 通知） */
  private async _addHistory(keyword: string): Promise<void> {
    if (!keyword.trim()) return

    // 删除旧记录
    this.history.delete(keyword)
    // 插入新记录
    this.history.set(keyword, { keyword, searchedAt: Date.now() })

    // 超限截断：保留最新的 MAX_HISTORY 条
    if (this.history.size > this.MAX_HISTORY) {
      const sorted = this.getHistory()
      this.history.clear()
      for (const item of sorted.slice(0, this.MAX_HISTORY)) {
        this.history.set(item.keyword, item)
      }
    }

    await this._saveHistory()
    this._notify()
  }

  /** 持久化历史到 StorageService */
  private async _saveHistory(): Promise<void> {
    try {
      await storageService.setSearchHistory(this.getHistory())
    } catch { /* ignore */ }
  }

  /** 通知所有订阅者 */
  private _notify(): void {
    this.subscribers.forEach((fn) => {
      try { fn() } catch { /* ignore */ }
    })
  }

  /** AggregatedSearchItem[] → UnifiedSearchResult[] 映射 */
  private _mapAggregatedResults(items: AggregatedSearchItem[]): UnifiedSearchResult[] {
    return items.map((item) => ({
      id: item.mediaId,
      providerId: item.providerIds[0] || '',
      providerIds: item.providerIds,
      title: item.title,
      cover: item.cover,
      description: item.description,
    }))
  }
}
