// modules/search-unified/bootstrap/SearchDependencyContainer.ts — CE8-C4
// Dependency composition. No service manually instantiates dependencies.
// Everything is resolved through this container.

import type { SearchModuleConfig } from './SearchModuleConfiguration'
import type { ISearchProviderPort } from '../application/ports/ISearchProviderPort'
import type { ISearchAnalyticsPort } from '../application/ports/ISearchAnalyticsPort'
import type { ISearchSuggestionPort } from '../application/ports/ISearchSuggestionPort'
// ISearchDataSource is a CE7 contract — used only in type position for reference

import { SearchProviderRegistry } from '../infrastructure/services/SearchProviderRegistry'
import { UnifiedSearchRuntime } from '../infrastructure/services/UnifiedSearchRuntime'
import { SearchAnalyticsRuntime } from '../infrastructure/services/SearchAnalyticsRuntime'
import { SearchProviderMetrics } from '../infrastructure/metrics/SearchProviderMetrics'
import { SearchHealthMonitor } from '../infrastructure/services/SearchHealthMonitor'
import { ProviderPriorityManager } from '../infrastructure/services/ProviderPriorityManager'
import { SuggestionEngine } from '../infrastructure/services/SuggestionEngine'

import { SearchAnalyticsStore } from '../infrastructure/storage/stores/SearchAnalyticsStore'
import { SearchHistoryStore } from '../infrastructure/storage/stores/SearchHistoryStore'
import { SearchTrendStore } from '../infrastructure/storage/stores/SearchTrendStore'
import { ProviderUsageStore } from '../infrastructure/storage/stores/ProviderUsageStore'
import { SuggestionUsageStore } from '../infrastructure/storage/stores/SuggestionUsageStore'

import { SearchContentUseCase } from '../application/use-cases/SearchContentUseCase'
import { SearchSuggestionsUseCase } from '../application/use-cases/SearchSuggestionsUseCase'
import { SearchAnalyticsUseCase } from '../application/use-cases/SearchAnalyticsUseCase'

import { InfrastructureDiagnostics } from '../infrastructure/services/InfrastructureDiagnostics'
import type { IStorageAdapter } from '../infrastructure/storage/stores/SearchAnalyticsStore'

export class SearchDependencyContainer {
  // Infrastructure
  readonly providerRegistry: SearchProviderRegistry
  readonly metrics: SearchProviderMetrics
  readonly healthMonitor: SearchHealthMonitor
  readonly priorityManager: ProviderPriorityManager
  readonly runtime: UnifiedSearchRuntime
  readonly analyticsRuntime: SearchAnalyticsRuntime
  readonly suggestionEngine: SuggestionEngine
  readonly diagnostics: InfrastructureDiagnostics

  // Stores
  readonly analyticsStore: SearchAnalyticsStore
  readonly historyStore: SearchHistoryStore
  readonly trendStore: SearchTrendStore
  readonly providerUsageStore: ProviderUsageStore
  readonly suggestionUsageStore: SuggestionUsageStore

  // Use Cases
  readonly searchUseCase: SearchContentUseCase
  readonly suggestionsUseCase: SearchSuggestionsUseCase
  readonly analyticsUseCase: SearchAnalyticsUseCase

  // Providers
  private _providers: ISearchProviderPort[] = []

  constructor(
    config: SearchModuleConfig,
    storageAdapter: IStorageAdapter,
  ) {
    // Infrastructure
    this.providerRegistry = new SearchProviderRegistry()
    this.metrics = new SearchProviderMetrics()
    this.healthMonitor = new SearchHealthMonitor(
      config.health.degradedThreshold,
      config.health.offlineThreshold,
    )
    this.priorityManager = new ProviderPriorityManager()
    this.runtime = new UnifiedSearchRuntime(
      this.providerRegistry, this.priorityManager,
      this.metrics, this.healthMonitor,
      { timeoutMs: config.runtime.timeoutMs },
    )
    this.analyticsRuntime = new SearchAnalyticsRuntime({
      analyticsFlushIntervalMs: config.analytics.flushIntervalMs,
      analyticsMaxBufferSize: config.analytics.maxBufferSize,
    })
    this.suggestionEngine = new SuggestionEngine(2, 10)
    this.diagnostics = new InfrastructureDiagnostics(
      this.providerRegistry, this.metrics, this.healthMonitor,
    )

    // Stores
    this.analyticsStore = new SearchAnalyticsStore(storageAdapter)
    this.historyStore = new SearchHistoryStore(storageAdapter)
    this.trendStore = new SearchTrendStore(storageAdapter)
    this.providerUsageStore = new ProviderUsageStore(storageAdapter)
    this.suggestionUsageStore = new SuggestionUsageStore(storageAdapter)

    // Use Cases
    this.searchUseCase = new SearchContentUseCase(
      this._providers,
      this.analyticsRuntime,
    )
    this.suggestionsUseCase = new SearchSuggestionsUseCase(this.suggestionEngine)
    this.analyticsUseCase = new SearchAnalyticsUseCase(this.analyticsRuntime)
  }

  /** Register providers after construction. */
  registerProvider(provider: ISearchProviderPort): void {
    this._providers.push(provider)
    this.providerRegistry.register(provider)
  }

  get providers(): ISearchProviderPort[] { return [...this._providers] }
}
