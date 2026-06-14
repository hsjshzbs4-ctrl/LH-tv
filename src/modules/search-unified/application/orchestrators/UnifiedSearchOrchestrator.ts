// modules/search-unified/application/orchestrators/UnifiedSearchOrchestrator.ts — CE8-B
// Orchestrates the full search pipeline: Provider → Merge → Availability → Ranking → Pagination.
// No business logic — pure coordination of domain services.

import { SearchQuery } from '../../domain/value-objects/SearchQuery'
import { ResultMergeService } from '../../domain/services/ResultMergeService'
import { AvailabilityResolver } from '../../domain/services/AvailabilityResolver'
import { SearchRankingService } from '../../domain/services/SearchRankingService'
import { PaginationService } from '../pagination/PaginationService'
import { SearchResultMapper } from '../mappers/SearchResultMapper'
import type { ISearchProviderPort } from '../ports/ISearchProviderPort'
import type { SearchRequestDto } from '../dto/SearchRequestDto'
import type { SearchResponseDto } from '../dto/SearchResponseDto'
import type { ProviderSearchResult } from '../errors/SearchErrors'

const PROVIDER_TIMEOUT_MS = 3000

export class UnifiedSearchOrchestrator {
  private mergeService = new ResultMergeService()
  private availabilityResolver = new AvailabilityResolver()
  private rankingService = new SearchRankingService()
  private paginationService = new PaginationService()
  private mapper = new SearchResultMapper()

  constructor(
    private providers: ISearchProviderPort[],
  ) {}

  /**
   * Execute the full search pipeline.
   */
  async execute(
    dto: SearchRequestDto,
    page: number,
    pageSize: number,
  ): Promise<{ response: SearchResponseDto; providerResults: ProviderSearchResult[] }> {
    const startTime = performance.now()

    // 1. Build query value object
    const query = SearchQuery.create(dto.query)

    // 2. Fan-out to all available providers with timeout
    const providerResults = await this._searchProviders(query)

    // 3. Collect successful documents
    const allDocs = providerResults
      .filter(r => r.documents !== null)
      .flatMap(r => r.documents!)

    // 4. Merge → deduplicate + aggregate
    const merged = this.mergeService.merge(allDocs)

    // 5. Resolve availability
    const withAvailability = this.availabilityResolver.resolveBatch(merged)

    // 6. Rank
    const ranked = this.rankingService.rank(withAvailability, {
      preferPlayable: true,
    })

    // 7. Map to DTOs
    const dtos = this.mapper.toDtoList(ranked)

    // 8. Paginate
    const paginated = this.paginationService.paginate(dtos, { page, pageSize })

    return {
      response: {
        items: paginated.items,
        page: paginated.page,
        pageSize: paginated.pageSize,
        total: paginated.total,
        totalPages: paginated.totalPages,
        hasNextPage: paginated.hasNextPage,
        searchTimeMs: Math.round(performance.now() - startTime),
      },
      providerResults,
    }
  }

  /**
   * Search across all available providers with timeout.
   * Partial failures don't block the pipeline.
   */
  private async _searchProviders(query: SearchQuery): Promise<ProviderSearchResult[]> {
    const available = this.providers.filter(p => p.isAvailable())

    const results = await Promise.all(
      available.map(async (provider): Promise<ProviderSearchResult> => {
        const startTime = performance.now()
        try {
          const documents = await this._withTimeout(
            provider.search(query),
            PROVIDER_TIMEOUT_MS,
            provider.providerId,
          )
          return {
            providerId: provider.providerId,
            documents,
            timedOut: false,
            elapsedMs: Math.round(performance.now() - startTime),
          }
        } catch (err) {
          return {
            providerId: provider.providerId,
            documents: null,
            timedOut: err instanceof Error && err.message.includes('timeout'),
            elapsedMs: Math.round(performance.now() - startTime),
          }
        }
      }),
    )

    return results
  }

  /**
   * Race a provider promise against a timeout.
   * Timeout returns empty array — partial failure tolerance.
   */
  private async _withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    providerId: string,
  ): Promise<T> {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => {
        reject(new Error(`Provider ${providerId} search timeout after ${timeoutMs}ms`))
      }, timeoutMs),
    )
    return Promise.race([promise, timeout])
  }
}
