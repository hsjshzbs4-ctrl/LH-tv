// modules/search-unified/infrastructure/services/SearchMetricsAggregator.ts — CE8-C2
// Aggregates provider-level metrics into application-level view.
// Wraps SearchProviderMetrics with convenience aggregations.

import type { SearchProviderMetrics, ProviderStats } from '../metrics/SearchProviderMetrics'

export interface AggregatedMetrics {
  readonly totalCalls: number
  readonly totalSuccesses: number
  readonly totalErrors: number
  readonly totalTimeouts: number
  readonly overallSuccessRate: number
  readonly averageLatencyMs: number
  readonly perProvider: Map<string, ProviderStats>
}

export class SearchMetricsAggregator {
  constructor(private metrics: SearchProviderMetrics) {}

  /** Aggregate all provider metrics into a single view. */
  aggregate(): AggregatedMetrics {
    const allStats = this.metrics.getAllStats()
    let totalCalls = 0
    let totalSuccesses = 0
    let totalErrors = 0
    let totalTimeouts = 0
    let totalLatency = 0
    let latencyCount = 0

    for (const stats of allStats.values()) {
      totalCalls += stats.totalCalls
      totalSuccesses += stats.successCount
      totalErrors += stats.errorCount
      totalTimeouts += stats.timeoutCount
      if (stats.averageLatencyMs > 0) {
        totalLatency += stats.averageLatencyMs * stats.successCount
        latencyCount += stats.successCount
      }
    }

    return {
      totalCalls,
      totalSuccesses,
      totalErrors,
      totalTimeouts,
      overallSuccessRate: totalCalls > 0
        ? Math.round((totalSuccesses / totalCalls) * 100) / 100
        : 0,
      averageLatencyMs: latencyCount > 0
        ? Math.round(totalLatency / latencyCount)
        : 0,
      perProvider: allStats,
    }
  }

  /** Get top N slowest providers by average latency. */
  getSlowestProviders(n: number = 3): Array<{ providerId: string; latencyMs: number }> {
    return Array.from(this.metrics.getAllStats().entries())
      .map(([id, stats]) => ({ providerId: id, latencyMs: stats.averageLatencyMs }))
      .sort((a, b) => b.latencyMs - a.latencyMs)
      .slice(0, n)
  }

  /** Get top N most error-prone providers. */
  getMostErrorProneProviders(n: number = 3): Array<{ providerId: string; errorRate: number }> {
    return Array.from(this.metrics.getAllStats().entries())
      .map(([id, stats]) => ({
        providerId: id,
        errorRate: stats.totalCalls > 0
          ? Math.round((stats.errorCount / stats.totalCalls) * 100) / 100
          : 0,
      }))
      .sort((a, b) => b.errorRate - a.errorRate)
      .slice(0, n)
  }
}
