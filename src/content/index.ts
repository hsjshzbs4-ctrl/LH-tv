// src/content/index.ts — PB1.5 Content Layer barrel export

// ── 类型 ──
export type {
  MediaItem,
  MediaDetail,
  MediaEpisode,
  MediaType,
  AggregatedSearchResult,
  FavoriteMedia,
  WatchHistoryItem,
  ContentCategory,
  ProviderInfo,
  HomeSection,
  SearchFilter,
  DetailResult,
  ContentError,
} from './contentTypes'

export {
  CATEGORY_SUB_MAP,
  CATEGORY_LABELS,
} from './contentTypes'

// ── 服务 ──
export { ProviderManagerService, providerManagerService } from './providerManager'
export { MediaLibraryService, mediaLibraryService } from './mediaLibrary'
export { SearchService, searchService } from './searchService'
export { CategoryService, categoryService } from './categoryService'
export { FavoriteService, favoriteService } from './favoriteService'
export { HistoryService, historyService } from './historyService'
