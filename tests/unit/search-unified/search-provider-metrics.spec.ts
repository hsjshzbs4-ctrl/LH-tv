// tests/unit/search-unified/search-provider-metrics.spec.ts — CE8-C1 Metrics tests

import { describe, it, expect, beforeEach } from 'vitest'
import { SearchProviderMetrics } from '@/modules/search-unified/infrastructure/metrics/SearchProviderMetrics'

describe('SearchProviderMetrics', () => {
  let metrics: SearchProviderMetrics

  beforeEach(() => metrics = new SearchProviderMetrics())

  it('should track success metrics', () => {
    metrics.recordSuccess('tmdb', 42)
    metrics.recordSuccess('tmdb', 58)
    metrics.recordSuccess('jellyfin', 30)

    const tmdb = metrics.getProviderStats('tmdb')
    expect(tmdb.totalCalls).toBe(2)
    expect(tmdb.successCount).toBe(2)
    expect(tmdb.errorCount).toBe(0)
    expect(tmdb.successRate).toBe(1)
    expect(tmdb.averageLatencyMs).toBe(50)
    expect(tmdb.lastCallAt).toBeGreaterThan(0)
  })

  it('should track error metrics', () => {
    metrics.recordSuccess('tmdb', 42)
    metrics.recordError('tmdb')

    const stats = metrics.getProviderStats('tmdb')
    expect(stats.totalCalls).toBe(2)
    expect(stats.successCount).toBe(1)
    expect(stats.errorCount).toBe(1)
    expect(stats.successRate).toBe(0.5)
  })

  it('should track timeout metrics', () => {
    metrics.recordTimeout('tmdb')
    metrics.recordTimeout('tmdb')

    const stats = metrics.getProviderStats('tmdb')
    expect(stats.timeoutCount).toBe(2)
    expect(stats.totalCalls).toBe(2)
    expect(stats.errorCount).toBe(2)
    expect(stats.successRate).toBe(0)
  })

  it('should return all provider stats', () => {
    metrics.recordSuccess('tmdb', 42)
    metrics.recordSuccess('jellyfin', 30)

    const all = metrics.getAllStats()
    expect(all.size).toBe(2)
    expect(all.get('tmdb')?.totalCalls).toBe(1)
    expect(all.get('jellyfin')?.totalCalls).toBe(1)
  })

  it('should return zero stats for unknown provider', () => {
    const stats = metrics.getProviderStats('unknown')
    expect(stats.totalCalls).toBe(0)
    expect(stats.successRate).toBe(0)
    expect(stats.lastCallAt).toBeNull()
  })

  it('should clear all metrics', () => {
    metrics.recordSuccess('tmdb', 42)
    metrics.clear()
    expect(metrics.totalCalls).toBe(0)
  })
})
