// modules/search-unified/infrastructure/storage/aggregation/AnalyticsAggregationService.ts — CE8-C3
// Aggregates analytics into hourly/daily/weekly summaries.
// Generates: top queries, top providers, top clicked, top played, top suggestions.

import type { SearchAnalyticsStore } from '../stores/SearchAnalyticsStore'
import type { SearchTrendStore } from '../stores/SearchTrendStore'
import type { ProviderUsageStore } from '../stores/ProviderUsageStore'
import type { SuggestionUsageStore } from '../stores/SuggestionUsageStore'
import type { SearchHistoryStore } from '../stores/SearchHistoryStore'

export type AggregationPeriod = 'hourly' | 'daily' | 'weekly'

export interface AggregatedSummary {
  readonly period: AggregationPeriod
  readonly generatedAt: number
  readonly windowStart: number
  readonly windowEnd: number
  readonly topQueries: string[]
  readonly topProviders: string[]
  readonly topClicked: string[]
  readonly topPlayed: string[]
  readonly topSuggestions: string[]
  readonly totalSearches: number
  readonly totalClicks: number
  readonly totalPlays: number
}

export class AnalyticsAggregationService {
  constructor(
    private analyticsStore: SearchAnalyticsStore,
    private trendStore: SearchTrendStore,
    private historyStore: SearchHistoryStore,
    private providerStore: ProviderUsageStore,
    private suggestionStore: SuggestionUsageStore,
  ) {}

  /** Generate hourly aggregation (last 1 hour). */
  generateHourly(): AggregatedSummary {
    return this._generate('hourly', 60 * 60 * 1000)
  }

  /** Generate daily aggregation (last 24 hours). */
  generateDaily(): AggregatedSummary {
    return this._generate('daily', 24 * 60 * 60 * 1000)
  }

  /** Generate weekly aggregation (last 7 days). */
  generateWeekly(): AggregatedSummary {
    return this._generate('weekly', 7 * 24 * 60 * 60 * 1000)
  }

  private _generate(period: AggregationPeriod, windowMs: number): AggregatedSummary {
    const now = Date.now()
    const windowStart = now - windowMs

    // Query analytics within window
    const recentRecords = this.analyticsStore.query({ fromDate: windowStart, toDate: now })
    const searches = recentRecords.filter(r => r.type === 'search')
    const clicks = recentRecords.filter(r => r.type === 'click')
    const plays = recentRecords.filter(r => r.type === 'play')

    // Top queries from trends
    const topQueries = this.trendStore.getTopSearches(10).map(t => t.query)

    // Top providers from usage
    const topProviders = this.providerStore.getAllUsage()
      .sort((a, b) => b.searches - a.searches)
      .slice(0, 5)
      .map(p => p.providerId)

    // Top clicked content
    const topClicked = this._topContentIds(clicks, 10)

    // Top played content
    const topPlayed = this._topContentIds(plays, 10)

    // Top suggestions
    const topSuggestions = this.suggestionStore.getTopSuggestions(10).map(s => s.suggestion)

    return {
      period,
      generatedAt: now,
      windowStart,
      windowEnd: now,
      topQueries,
      topProviders,
      topClicked,
      topPlayed,
      topSuggestions,
      totalSearches: searches.length,
      totalClicks: clicks.length,
      totalPlays: plays.length,
    }
  }

  private _topContentIds(items: Array<{ contentId?: string }>, limit: number): string[] {
    const counts = new Map<string, number>()
    for (const item of items) {
      if (item.contentId) {
        counts.set(item.contentId, (counts.get(item.contentId) ?? 0) + 1)
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => id)
  }
}
