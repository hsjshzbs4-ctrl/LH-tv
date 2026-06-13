// src/core/search/facade/SearchFacade.ts - 搜索门面（View 层唯一切入点）
// P3.4 Unified Search System
//
// 禁止 View 直接访问 SearchManager / SearchCache / ProviderFacade

import { SearchManager } from '../manager/SearchManager'
import type { SearchHistoryItem, UnifiedSearchResult } from '../types/search.types'

export class SearchFacade {
  private manager = new SearchManager()

  /** 初始化（从 StorageService 加载历史） */
  async initialize(): Promise<void> {
    return this.manager.initialize()
  }

  /** 统一搜索（缓存 + Provider 聚合 + 历史记录） */
  async search(keyword: string): Promise<UnifiedSearchResult[]> {
    return this.manager.search(keyword)
  }

  /** 获取搜索历史 */
  getHistory(): SearchHistoryItem[] {
    return this.manager.getHistory()
  }

  /** 添加搜索历史 */
  async addHistory(keyword: string): Promise<void> {
    return this.manager.addHistory(keyword)
  }

  /** 删除单条历史 */
  async removeHistory(keyword: string): Promise<void> {
    return this.manager.removeHistory(keyword)
  }

  /** 清空全部历史 */
  async clearHistory(): Promise<void> {
    return this.manager.clearHistory()
  }

  /** 搜索建议（startsWith 匹配历史） */
  getSuggestions(prefix: string, limit?: number): SearchHistoryItem[] {
    return this.manager.getSuggestions(prefix, limit)
  }

  /** 清空搜索缓存 */
  clearCache(keyword?: string): void {
    this.manager.clearCache(keyword)
  }

  /** 订阅变更，返回取消函数 */
  subscribe(callback: () => void): () => void {
    return this.manager.subscribe(callback)
  }
}

/** 全局单例 */
export const searchFacade = new SearchFacade()
