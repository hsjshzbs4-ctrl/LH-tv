// src/core/search/index.ts - P3.4 Unified Search System
// 统一搜索、搜索历史、搜索建议、搜索缓存

export { SearchFacade, searchFacade } from './facade/SearchFacade'
export { SearchManager } from './manager/SearchManager'
export { SearchCache } from './cache/SearchCache'
export type {
  SearchHistoryItem,
  UnifiedSearchResult,
  SearchState,
} from './types/search.types'
