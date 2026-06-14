// tests/unit/search-unified/provider-client-wrapper.spec.ts — CE8-C1 Wrapper tests

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ProviderClientWrapper } from '@/modules/search-unified/infrastructure/adapters/ProviderClientWrapper'
import { SearchProviderMetrics } from '@/modules/search-unified/infrastructure/metrics/SearchProviderMetrics'
import { SearchProviderError, SearchTimeoutError } from '@/modules/search-unified/application/errors/SearchErrors'
import { SearchQuery } from '@/modules/search-unified/domain/value-objects/SearchQuery'
import type { SearchDocument } from '@/modules/search-unified/domain/contracts/ISearchProvider'

function makeDoc(): SearchDocument {
  return { id: '1', contentId: 'tmdb:1', title: 'Test', type: 'movie', genres: [], externalIds: {}, source: 'metadata', sourceId: 'tmdb', popularity: 50 }
}

describe('ProviderClientWrapper', () => {
  const metrics = new SearchProviderMetrics()
  const wrapper = new ProviderClientWrapper(metrics)

  beforeEach(() => metrics.clear())

  it('should execute a successful search', async () => {
    const fn = vi.fn().mockResolvedValue([makeDoc()])
    const result = await wrapper.execute('test-provider', { maxRetries: 1, baseDelayMs: 10 },
      fn, SearchQuery.create('test'))
    expect(result).toHaveLength(1)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(metrics.totalCalls).toBe(1)
  })

  it('should retry on failure', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce([makeDoc()])

    const result = await wrapper.execute('test-provider', { maxRetries: 2, baseDelayMs: 10 },
      fn, SearchQuery.create('test'), 5000)
    expect(result).toHaveLength(1)
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('should throw after exhausting retries', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('Down'))

    await expect(
      wrapper.execute('test-provider', { maxRetries: 1, baseDelayMs: 10 },
        fn, SearchQuery.create('test'), 1000),
    ).rejects.toThrow(SearchProviderError)
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('should translate timeout errors', async () => {
    const fn = vi.fn().mockImplementation(() =>
      new Promise(r => setTimeout(r, 5000)),
    )

    await expect(
      wrapper.execute('slow', { maxRetries: 0, baseDelayMs: 10 },
        fn, SearchQuery.create('test'), 10),
    ).rejects.toThrow(SearchTimeoutError)
  })

  it('should record metrics on success', () => {
    // Metrics are internal — verify they were tracked
    // Test the metrics directly
    metrics.recordSuccess('tmdb', 42)
    const stats = metrics.getProviderStats('tmdb')
    expect(stats.successCount).toBe(1)
    expect(stats.averageLatencyMs).toBe(42)
  })

  it('should record metrics on error', () => {
    metrics.recordError('tmdb')
    const stats = metrics.getProviderStats('tmdb')
    expect(stats.errorCount).toBe(1)
    expect(stats.successRate).toBe(0)
  })

  it('should record timeout', () => {
    metrics.recordTimeout('slow-provider')
    const stats = metrics.getProviderStats('slow-provider')
    expect(stats.timeoutCount).toBe(1)
  })
})
