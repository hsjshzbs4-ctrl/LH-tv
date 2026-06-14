// tests/unit/search-unified/search-metrics-aggregator.spec.ts — CE8-C2 MetricsAggregator tests

import { describe, it, expect, beforeEach } from 'vitest'
import { SearchMetricsAggregator } from '@/modules/search-unified/infrastructure/services/SearchMetricsAggregator'
import { SearchProviderMetrics } from '@/modules/search-unified/infrastructure/metrics/SearchProviderMetrics'

describe('SearchMetricsAggregator', () => {
  let metrics: SearchProviderMetrics
  let aggregator: SearchMetricsAggregator

  beforeEach(() => {
    metrics = new SearchProviderMetrics()
    aggregator = new SearchMetricsAggregator(metrics)
  })

  it('should aggregate across providers', () => {
    metrics.recordSuccess('tmdb', 40)
    metrics.recordSuccess('tmdb', 60)
    metrics.recordSuccess('jellyfin', 100)
    metrics.recordError('jellyfin')

    const result = aggregator.aggregate()
    expect(result.totalCalls).toBe(4)
    expect(result.totalSuccesses).toBe(3)
    expect(result.totalErrors).toBe(1)
    expect(result.overallSuccessRate).toBe(0.75)
  })

  it('should return zero aggregate when no data', () => {
    const result = aggregator.aggregate()
    expect(result.totalCalls).toBe(0)
    expect(result.overallSuccessRate).toBe(0)
    expect(result.averageLatencyMs).toBe(0)
  })

  it('should find slowest providers', () => {
    metrics.recordSuccess('fast', 20)
    metrics.recordSuccess('slow', 200)
    metrics.recordSuccess('mid', 100)

    const slowest = aggregator.getSlowestProviders(2)
    expect(slowest[0].providerId).toBe('slow')
    expect(slowest[1].providerId).toBe('mid')
  })

  it('should find most error-prone providers', () => {
    metrics.recordSuccess('good', 50)
    metrics.recordError('bad')
    metrics.recordError('bad')

    const errorProne = aggregator.getMostErrorProneProviders(1)
    expect(errorProne[0].providerId).toBe('bad')
    expect(errorProne[0].errorRate).toBe(1)
  })
})
