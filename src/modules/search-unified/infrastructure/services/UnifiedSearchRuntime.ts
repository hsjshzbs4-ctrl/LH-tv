// modules/search-unified/infrastructure/services/UnifiedSearchRuntime.ts — CE8-C2
// Search execution runtime: provider discovery, parallel dispatch, timeout, metrics.
// Uses Promise.allSettled() — never Promise.all() — for partial failure tolerance.

import { SearchQuery } from '../../domain/value-objects/SearchQuery'
import type { ISearchProviderPort } from '../../application/ports/ISearchProviderPort'
import type { SearchDocument } from '../../domain/contracts/ISearchProvider'
import type { SearchInfrastructureConfig } from './SearchInfrastructureConfig'
import { DEFAULT_CONFIG } from './SearchInfrastructureConfig'
import type { SearchProviderRegistry } from './SearchProviderRegistry'
import type { ProviderPriorityManager } from './ProviderPriorityManager'
import type { SearchProviderMetrics } from '../metrics/SearchProviderMetrics'
import type { SearchHealthMonitor } from './SearchHealthMonitor'

export interface ProviderExecutionResult {
  readonly providerId: string
  readonly documents: SearchDocument[] | null
  readonly succeeded: boolean
  readonly elapsedMs: number
  readonly error?: string
}

export interface SearchExecutionResult {
  readonly documents: SearchDocument[]
  readonly providerResults: ProviderExecutionResult[]
  readonly totalElapsedMs: number
}

export class UnifiedSearchRuntime {
  private config: SearchInfrastructureConfig

  constructor(
    private registry: SearchProviderRegistry,
    private priorityManager: ProviderPriorityManager,
    private metrics: SearchProviderMetrics,
    private healthMonitor: SearchHealthMonitor,
    config?: Partial<SearchInfrastructureConfig>,
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Execute a search across all available providers in parallel.
   * Partial failures never fail the entire search.
   */
  async execute(query: string): Promise<SearchExecutionResult> {
    const startTime = performance.now()
    const searchQuery = SearchQuery.create(query)

    // Get providers in priority order
    const providers = this.priorityManager.getExecutionOrder(
      this.registry.getAvailableProviders(),
    )

    // Filter out offline providers
    const active = providers.filter(p => !this.healthMonitor.isOffline(p.providerId))

    // Parallel dispatch with timeout — Promise.allSettled
    const results = await Promise.allSettled(
      active.map(p => this._executeProvider(p, searchQuery)),
    )

    const providerResults: ProviderExecutionResult[] = []
    const documents: SearchDocument[] = []

    for (const result of results) {
      if (result.status === 'fulfilled') {
        providerResults.push(result.value)
        if (result.value.documents) {
          documents.push(...result.value.documents)
        }
      }
    }

    return {
      documents,
      providerResults,
      totalElapsedMs: Math.round(performance.now() - startTime),
    }
  }

  private async _executeProvider(
    provider: ISearchProviderPort,
    query: SearchQuery,
  ): Promise<ProviderExecutionResult> {
    const startTime = performance.now()
    try {
      const documents = await Promise.race([
        provider.search(query),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error(`Provider ${provider.providerId} timeout`)),
            this.config.timeoutMs,
          ),
        ),
      ])

      this.healthMonitor.recordSuccess(provider.providerId)
      this.metrics.recordSuccess(provider.providerId, performance.now() - startTime)

      return {
        providerId: provider.providerId,
        documents,
        succeeded: true,
        elapsedMs: Math.round(performance.now() - startTime),
      }
    } catch (err) {
      this.healthMonitor.recordFailure(provider.providerId)
      this.metrics.recordError(provider.providerId)

      return {
        providerId: provider.providerId,
        documents: null,
        succeeded: false,
        elapsedMs: Math.round(performance.now() - startTime),
        error: err instanceof Error ? err.message : String(err),
      }
    }
  }
}
