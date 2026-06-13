// src/shared/types/search.types.ts - 搜索相关类型

/** 搜索结果 */
export interface SearchResult {
  url: string
  title: string
  image?: string
  sourceLabel?: string
  sourceKey?: string
}

/** 搜索历史项 */
export interface SearchHistoryItem {
  term: string
  timestamp: number
}
