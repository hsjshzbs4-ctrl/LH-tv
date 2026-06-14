// modules/search-unified/domain/index.ts — CE8-A Domain barrel export
// Pure domain layer — no infrastructure, no UI, no IPC, no storage.

// ─── Entities ───
export { UnifiedSearchResult } from './entities/UnifiedSearchResult'
export type { UnifiedSearchResultProps, MediaType } from './entities/UnifiedSearchResult'
export { SearchSource } from './entities/SearchSource'
export type { SearchSourceProps, SourceType } from './entities/SearchSource'
export { AvailabilityInfo } from './entities/AvailabilityInfo'
export type { AvailabilityInfoProps } from './entities/AvailabilityInfo'

// ─── Value Objects ───
export { SearchQuery } from './value-objects/SearchQuery'
export { SearchScore } from './value-objects/SearchScore'
export { ContentIdentity } from './value-objects/ContentIdentity'

// ─── Domain Services ───
export { ResultMergeService } from './services/ResultMergeService'
export { AvailabilityResolver } from './services/AvailabilityResolver'
export { SearchRankingService } from './services/SearchRankingService'
export type { RankingOptions } from './services/SearchRankingService'

// ─── Contracts ───
export type { ISearchProvider, SearchDocument } from './contracts/ISearchProvider'
export type { IResultMerger } from './contracts/IResultMerger'
export type { IAvailabilityResolver } from './contracts/IAvailabilityResolver'

// ─── Events ───
export type {
  DomainEvent,
  SearchExecuted,
  SearchResultMerged,
  AvailabilityResolved,
  ResultRanked,
} from './events/DomainEvents'
export { EventFactory } from './events/DomainEvents'
