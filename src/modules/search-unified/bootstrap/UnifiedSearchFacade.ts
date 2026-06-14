// modules/search-unified/bootstrap/UnifiedSearchFacade.ts — CE8-C4
// Single public entry point for the entire unified search module.
// UI, IPC, Electron must ONLY talk to this facade. Nothing else.

import type { SearchDependencyContainer } from './SearchDependencyContainer'
import type { SearchModuleDiagnostics } from './SearchModuleDiagnostics'
import type { SearchReadinessValidator, ReadinessResult } from './SearchReadinessValidator'
import type { SearchFeatureFlagsManager } from './SearchFeatureFlags'
import type { SearchRequestDto } from '../application/dto/SearchRequestDto'
import type { SearchResponseDto } from '../application/dto/SearchResponseDto'
import type { SearchHistoryEntry } from '../infrastructure/storage/models/SearchHistoryEntry'
import type { SearchTrendEntry } from '../infrastructure/storage/models/SearchTrendEntry'
import type { UserSearchProfile } from '../infrastructure/storage/profile/UserSearchProfile'
import type { ProviderUsageEntry } from '../infrastructure/storage/models/ProviderUsageEntry'
import type { ModuleDiagnosticSnapshot } from './SearchModuleDiagnostics'
import { UserSearchProfileGenerator } from '../infrastructure/storage/profile/UserSearchProfile'

export class UnifiedSearchFacade {
  constructor(
    private container: SearchDependencyContainer,
    private diagnostics: SearchModuleDiagnostics,
    private readiness: SearchReadinessValidator,
    private flags: SearchFeatureFlagsManager,
  ) {}

  // ─── Search ───

  async search(dto: SearchRequestDto): Promise<SearchResponseDto> {
    const result = await this.container.searchUseCase.execute(dto)

    // Record to trend and history
    if (this.flags.isEnabled('trending')) {
      this.container.trendStore.recordQuery(dto.query).catch(() => {})
    }
    if (this.flags.isEnabled('analytics')) {
      this.container.historyStore.addQuery(dto.query, result.response.total).catch(() => {})
    }

    return result.response
  }

  // ─── Suggestions ───

  async suggest(query: string): Promise<string[]> {
    if (!this.flags.isEnabled('suggestions')) return []
    const result = await this.container.suggestionsUseCase.execute(query)
    return result.suggestions
  }

  // ─── Analytics Recording ───

  recordClick(contentId: string, query: string, position: number): void {
    if (!this.flags.isEnabled('analytics')) return
    this.container.analyticsUseCase.recordClick(contentId, query, position)
  }

  recordPlay(contentId: string, sourceId: string): void {
    if (!this.flags.isEnabled('analytics')) return
    this.container.analyticsUseCase.recordPlay(contentId, sourceId)
  }

  // ─── History ───

  getHistory(limit?: number): SearchHistoryEntry[] {
    return this.container.historyStore.getRecentQueries(limit ?? 50)
  }

  async clearHistory(): Promise<void> {
    await this.container.historyStore.clearHistory()
  }

  // ─── Trending ───

  getTrending(limit?: number): SearchTrendEntry[] {
    return this.container.trendStore.getTrendingSearches(limit ?? 20)
  }

  // ─── Profile ───

  getProfile(): UserSearchProfile | null {
    if (!this.flags.isEnabled('profiles')) return null
    const generator = new UserSearchProfileGenerator(
      this.container.historyStore,
      this.container.providerUsageStore,
      this.container.suggestionUsageStore,
      this.container.trendStore,
    )
    return generator.generate()
  }

  // ─── Diagnostics ───

  getStatus(): ModuleDiagnosticSnapshot {
    return this.diagnostics.dumpModuleState()
  }

  validateReadiness(): ReadinessResult {
    return this.readiness.validate()
  }

  // ─── Provider Usage ───

  getProviderUsage(): ProviderUsageEntry[] {
    return this.container.providerUsageStore.getAllUsage()
  }
}
