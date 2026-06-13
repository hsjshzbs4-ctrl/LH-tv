// tests/integration/monitoring.integration.spec.ts — Metrics + Dashboard 集成
import { describe, it, expect, beforeEach } from 'vitest'
import { MetricsCollector } from '@/core/monitoring/metrics/MetricsCollector'
import { ProviderHealthManager } from '@/core/aggregation/health/ProviderHealthManager'
import { ProviderHealthStatus } from '@/core/aggregation/types/aggregation.types'

describe('Monitoring Integration Flow', () => {
  let collector: MetricsCollector
  let health: ProviderHealthManager

  beforeEach(() => {
    collector = new MetricsCollector()
    health = new ProviderHealthManager()
  })

  // Case 01: Provider Metrics auto-update
  it('Case 01: should track provider search metrics', () => {
    collector.record('search.latency', 150, { provider: 'p1' })
    collector.record('search.latency', 200, { provider: 'p2' })
    collector.record('search.latency', 100, { provider: 'p1' })

    const stats = collector.getStats('search.latency')
    expect(stats!.count).toBe(3)
    expect(stats!.sum).toBe(450)
    expect(stats!.min).toBe(100)
    expect(stats!.max).toBe(200)
  })

  // Case 02: Download Metrics
  it('Case 02: should track download progress metrics', () => {
    collector.increment('download.started')
    collector.increment('download.started')
    collector.increment('download.completed')
    collector.increment('download.failed')

    expect(collector.getCount('download.started')).toBe(2)
    expect(collector.getCount('download.completed')).toBe(1)
    expect(collector.getCount('download.failed')).toBe(1)
  })

  // Case 03: Playback Metrics
  it('Case 03: should track playback metrics', () => {
    collector.increment('playback.started')
    collector.increment('playback.started')
    collector.increment('playback.error')

    collector.record('playback.startup_time', 800) // ms
    collector.record('playback.startup_time', 1200)

    expect(collector.getCount('playback.started')).toBe(2)
    const startupStats = collector.getStats('playback.startup_time')
    expect(startupStats!.avg).toBe(1000)
  })

  // Case 04: Dashboard 聚合
  it('Case 04: should aggregate health data for dashboard', () => {
    health.register('p1', 'Provider 1')
    health.register('p2', 'Provider 2')

    // p1 healthy, p2 degraded
    health.markFailure('p2')

    const healthyIds = health.getHealthyProviderIds()
    expect(healthyIds).toContain('p1')
    expect(healthyIds).toContain('p2') // DEGRADED still healthy

    // After 5 failures → OFFLINE
    for (let i = 0; i < 4; i++) health.markFailure('p2')
    expect(health.isHealthy('p2')).toBe(false)
  })

  // Combined metrics
  it('should track multiple metric types concurrently', () => {
    collector.increment('search.total')
    collector.record('search.latency', 100)
    collector.increment('download.total')
    collector.increment('playback.total')

    const names = collector.getMetricNames()
    expect(names).toContain('search.total')
    expect(names).toContain('search.latency')
    expect(names).toContain('download.total')
    expect(names).toContain('playback.total')
  })
})
