// src/core/search/types/search.types.ts - 搜索系统类型定义
// P3.4 Unified Search System

/** 搜索历史项 */
export interface SearchHistoryItem {
  keyword: string
  searchedAt: number
}

/** 统一搜索结果（视图层消费） */
export interface UnifiedSearchResult {
  id: string
  providerId: string
  /** P4.1: 所有贡献此结果的 Provider ID */
  providerIds?: string[]
  title: string
  cover: string
  description?: string
  year?: string
  category?: string
  score?: number
}

/** 搜索管理器内部状态 */
export interface SearchState {
  results: UnifiedSearchResult[]
  history: SearchHistoryItem[]
  loading: boolean
  searched: boolean
  lastKeyword: string
}
