// core/content-ecosystem/search/index.ts — CE7 Barrel export

// Facade (primary public API)
export { SearchFacade, searchFacade } from './facade/SearchFacade'

// Types
export {
  SearchDocumentType,
} from './contracts/search.types'
export type {
  SearchDocument,
  SearchSource,
  ParsedQuery,
  SearchOptions,
  SearchResult,
  SearchResponse,
  MatchType,
  AggregatedSearchResult,
  AggregatedSource,
  AggregatedSearchResponse,
  IndexStats,
} from './contracts/search.types'

// Interfaces (for external implementations)
export type { ISearchDataSource } from './contracts/ISearchDataSource'
export type { ISearchStorage } from './contracts/ISearchStorage'

// Engine (for testing / DI)
export { ContentIdentityService, contentIdentityService } from './engine/ContentIdentityService'
export { QueryParser } from './engine/QueryParser'
export { RankingEngine } from './engine/RankingEngine'
export { SearchEngine } from './engine/SearchEngine'

// Storage
export { InMemoryIndex } from './storage/InMemoryIndex'
export { MemorySearchStorage } from './storage/MemorySearchStorage'
export { ElectronSearchStorage } from './storage/ElectronSearchStorage'
