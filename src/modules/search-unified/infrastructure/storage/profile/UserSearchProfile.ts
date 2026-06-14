// modules/search-unified/infrastructure/storage/profile/UserSearchProfile.ts — CE8-C3
// Builds user search profile from analytics data.
// Foundation for personalization (CE9). No recommendation logic — only profile generation.

import type { SearchHistoryStore } from '../stores/SearchHistoryStore'
import type { ProviderUsageStore } from '../stores/ProviderUsageStore'
import type { SuggestionUsageStore } from '../stores/SuggestionUsageStore'
import type { SearchTrendStore } from '../stores/SearchTrendStore'

export interface UserSearchProfile {
  readonly generatedAt: number
  readonly favoriteProviders: string[]
  readonly frequentQueries: string[]
  readonly preferredContentTypes: string[]
  readonly recentInteractions: string[]
}

export class UserSearchProfileGenerator {
  constructor(
    private historyStore: SearchHistoryStore,
    private providerStore: ProviderUsageStore,
    private suggestionStore: SuggestionUsageStore,
    private trendStore: SearchTrendStore,
  ) {}

  /** Generate user search profile from stored analytics. */
  generate(): UserSearchProfile {
    const now = Date.now()

    // Favorite providers: most used in last 30 days
    const providers = this.providerStore.getAllUsage()
      .sort((a, b) => b.searches - a.searches)
      .slice(0, 5)

    // Frequent queries: top from history
    const frequent = this.historyStore.getRecentQueries(20)

    // Preferred content types: inferred from clicked content
    // (requires content metadata — placeholders for now)
    const contentTypes = this._inferContentTypes()

    // Recent interactions: last 20 history entries
    const recent = frequent.slice(0, 20).map(e => e.query)

    return {
      generatedAt: now,
      favoriteProviders: providers.map(p => p.providerId),
      frequentQueries: frequent.slice(0, 10).map(e => e.query),
      preferredContentTypes: contentTypes,
      recentInteractions: recent,
    }
  }

  /** Placeholder: infer content types from query patterns. */
  private _inferContentTypes(): string[] {
    // Future: analyze query content to detect movie/tv/anime preference
    return []
  }
}
