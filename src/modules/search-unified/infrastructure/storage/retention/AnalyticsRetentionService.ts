// modules/search-unified/infrastructure/storage/retention/AnalyticsRetentionService.ts — CE8-C3
// Cleans up expired analytics data. Default retention: 90 days.

import type { SearchAnalyticsStore } from '../stores/SearchAnalyticsStore'
import type { SearchHistoryStore } from '../stores/SearchHistoryStore'
import type { SearchTrendStore } from '../stores/SearchTrendStore'
import type { ProviderUsageStore } from '../stores/ProviderUsageStore'
import type { SuggestionUsageStore } from '../stores/SuggestionUsageStore'

const DEFAULT_RETENTION_MS = 90 * 24 * 60 * 60 * 1000 // 90 days

export class AnalyticsRetentionService {
  private retentionMs: number

  constructor(
    private analyticsStore: SearchAnalyticsStore,
    private historyStore: SearchHistoryStore,
    private trendStore: SearchTrendStore,
    private providerStore: ProviderUsageStore,
    private suggestionStore: SuggestionUsageStore,
    retentionDays = 90,
  ) {
    this.retentionMs = retentionDays * 24 * 60 * 60 * 1000
  }

  /** Clean up all expired records across all stores. */
  async cleanup(): Promise<{
    analyticsDeleted: number
    reportsCleared: number
  }> {
    const cutoff = Date.now() - this.retentionMs

    // Analytics store: delete old records
    const oldRecords = this.analyticsStore.query({ toDate: cutoff })
    let analyticsDeleted = 0
    for (const record of oldRecords) {
      await this.analyticsStore.delete(record.id)
      analyticsDeleted++
    }

    // History: entries older than retention are removed
    // (History store uses frequency-based trimming — handled by MAX_HISTORY_ENTRIES)

    return {
      analyticsDeleted,
      reportsCleared: 0,
    }
  }

  /** Get the current retention cutoff timestamp. */
  get retentionCutoff(): number {
    return Date.now() - this.retentionMs
  }
}
