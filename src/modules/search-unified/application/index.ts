// modules/search-unified/application/index.ts — CE8-B Application barrel export
// Pure application layer — no infrastructure, no UI, no IPC, no storage.

// ─── Use Cases ───
export { SearchContentUseCase } from './use-cases/SearchContentUseCase'
export type { SearchContentResult } from './use-cases/SearchContentUseCase'
export { SearchSuggestionsUseCase } from './use-cases/SearchSuggestionsUseCase'
export type { SuggestionsResult } from './use-cases/SearchSuggestionsUseCase'
export { SearchAnalyticsUseCase } from './use-cases/SearchAnalyticsUseCase'

// ─── Orchestrator ───
export { UnifiedSearchOrchestrator } from './orchestrators/UnifiedSearchOrchestrator'

// ─── Mapper ───
export { SearchResultMapper } from './mappers/SearchResultMapper'

// ─── DTOs ───
export { SearchRequestValidator } from './dto/SearchRequestDto'
export type {
  SearchRequestDto,
  SearchValidationResult,
} from './dto/SearchRequestDto'
export type { SearchResponseDto } from './dto/SearchResponseDto'
export type {
  UnifiedSearchItemDto,
  SourceInfoDto,
  AvailabilityDto,
} from './dto/UnifiedSearchItemDto'

// ─── Ports ───
export type { ISearchProviderPort } from './ports/ISearchProviderPort'
export type {
  ISearchAnalyticsPort,
  SearchEvent,
  ClickEvent,
  PlayEvent,
} from './ports/ISearchAnalyticsPort'
export type { ISearchSuggestionPort } from './ports/ISearchSuggestionPort'

// ─── Pagination ───
export { PaginationService } from './pagination/PaginationService'
export type { PaginationParams, PaginationResult } from './pagination/PaginationService'

// ─── Events ───
export type {
  ApplicationEvent,
  SearchCompleted,
  SearchFailed,
  SearchSuggestionsGenerated,
} from './events/ApplicationEvents'
export { AppEventFactory } from './events/ApplicationEvents'

// ─── Errors ───
export {
  SearchError,
  SearchValidationError,
  SearchProviderError,
  SearchTimeoutError,
} from './errors/SearchErrors'
export type { ProviderSearchResult } from './errors/SearchErrors'
