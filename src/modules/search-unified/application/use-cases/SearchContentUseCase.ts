// modules/search-unified/application/use-cases/SearchContentUseCase.ts — CE8-B
// Main entry point for unified search.
// Flow: Validate → Orchestrate → Emit events → Return response.

import { UnifiedSearchOrchestrator } from '../orchestrators/UnifiedSearchOrchestrator'
import { SearchRequestValidator } from '../dto/SearchRequestDto'
import { SearchValidationError } from '../errors/SearchErrors'
import { AppEventFactory } from '../events/ApplicationEvents'
import type {
  SearchRequestDto,
  SearchValidationResult,
} from '../dto/SearchRequestDto'
import type { SearchResponseDto } from '../dto/SearchResponseDto'
import type { ISearchProviderPort } from '../ports/ISearchProviderPort'
import type { ISearchAnalyticsPort } from '../ports/ISearchAnalyticsPort'
import type { ProviderSearchResult } from '../errors/SearchErrors'
import type { ApplicationEvent } from '../events/ApplicationEvents'

export interface SearchContentResult {
  readonly response: SearchResponseDto
  readonly events: ApplicationEvent[]
  readonly providerResults: ProviderSearchResult[]
}

export class SearchContentUseCase {
  private orchestrator: UnifiedSearchOrchestrator
  private analyticsPort: ISearchAnalyticsPort | null

  constructor(
    providers: ISearchProviderPort[],
    analytics?: ISearchAnalyticsPort,
  ) {
    this.orchestrator = new UnifiedSearchOrchestrator(providers)
    this.analyticsPort = analytics ?? null
  }

  /**
   * Execute a unified search.
   */
  async execute(dto: SearchRequestDto): Promise<SearchContentResult> {
    // 1. Validate
    const validation = SearchRequestValidator.validate(dto)
    if (!validation.valid) {
      throw new SearchValidationError(
        'Invalid search request',
        validation.errors ?? [],
      )
    }

    // 2. Orchestrate
    const { response, providerResults } = await this.orchestrator.execute(
      dto,
      validation.page,
      validation.pageSize,
    )

    // 3. Events
    const events: ApplicationEvent[] = [
      AppEventFactory.searchCompleted(response, dto.query),
    ]

    // 4. Analytics (fire-and-forget)
    if (this.analyticsPort) {
      try {
        this.analyticsPort.recordSearch({
          query: dto.query,
          resultCount: response.total,
          searchTimeMs: response.searchTimeMs,
          timestamp: Date.now(),
        })
      } catch {
        // Analytics failure must not block search
      }
    }

    return { response, events, providerResults }
  }
}
