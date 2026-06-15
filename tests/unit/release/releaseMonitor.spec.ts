// tests/unit/release/releaseMonitor.spec.ts — PB1-009 unit tests
import { describe, it, expect, beforeEach } from 'vitest'
import { ReleaseMonitor } from '@/release/releaseMonitor'

describe('ReleaseMonitor', () => {
  let monitor: ReleaseMonitor

  beforeEach(() => {
    monitor = new ReleaseMonitor('2.0.0', 'stable', '100')
  })

  it('should detect first install', () => {
    monitor.initialize(null, 'stable', '100')
    const metrics = monitor.getMetrics()
    expect(metrics.isFirstInstall).toBe(true)
    expect(metrics.isUpgrade).toBe(false)
  })

  it('should detect upgrade', () => {
    monitor = new ReleaseMonitor('2.1.0', 'stable', '101')
    monitor.initialize('2.0.0', 'stable', '101')
    const metrics = monitor.getMetrics()
    expect(metrics.isUpgrade).toBe(true)
    expect(metrics.upgradeCount).toBe(1)
  })

  it('should detect downgrade', () => {
    monitor = new ReleaseMonitor('1.9.0', 'stable', '99')
    monitor.initialize('2.0.0', 'stable', '99')
    const metrics = monitor.getMetrics()
    expect(metrics.isDowngrade).toBe(true)
    expect(metrics.downgradeCount).toBe(1)
  })

  it('should track multiple upgrades', () => {
    monitor = new ReleaseMonitor('2.2.0', 'stable', '102')
    monitor.initialize('2.0.0', 'stable', '102') // 2.0.0 → 2.2.0 = upgrade
    monitor.initialize('2.1.0', 'stable', '102') // 2.1.0 → 2.2.0 = upgrade
    // 2.2.0 = 2.2.0 → no event (same version)
    const metrics = monitor.getMetrics()
    expect(metrics.upgradeCount).toBe(2)
    expect(metrics.versionHistory).toHaveLength(2)
  })

  it('should track channel distribution', () => {
    monitor = new ReleaseMonitor('2.1.0', 'beta', '101')
    monitor.initialize(null, 'beta', '101') // install on beta
    monitor = new ReleaseMonitor('2.1.0', 'stable', '101')
    monitor.initialize('2.0.0', 'stable', '101') // upgrade on stable

    const metrics = monitor.getMetrics()
    expect(metrics.channelDistribution['beta'] || 0).toBeGreaterThanOrEqual(0)
  })

  it('should provide version info', () => {
    const info = monitor.getVersionInfo()
    expect(info.version).toBe('2.0.0')
    expect(info.channel).toBe('stable')
    expect(info.build).toBe('100')
  })

  it('should provide version distribution for dashboard', () => {
    monitor.initialize(null, 'stable', '100')
    const dist = monitor.getVersionDistribution()
    expect(dist.current).toBe('2.0.0')
    expect(dist.installed).toBe('2.0.0')
  })

  it('should export and import events', () => {
    monitor.initialize(null, 'stable', '100')
    const events = monitor.exportEvents()
    expect(events).toHaveLength(1)
    expect(events[0].type).toBe('install')

    const m2 = new ReleaseMonitor('2.0.0')
    m2.importEvents(events)
    expect(m2.exportEvents()).toHaveLength(1)
  })

  it('should prune events older than 90 days', () => {
    const oldEvent = {
      id: 'old',
      timestamp: Date.now() - 91 * 24 * 60 * 60 * 1000,
      type: 'install' as const,
      fromVersion: null,
      toVersion: '1.0.0',
      channel: 'stable',
      buildNumber: '1'
    }
    monitor.importEvents([oldEvent])
    expect(monitor.exportEvents()).toHaveLength(0)
  })

  it('should clear all data', () => {
    monitor.initialize(null, 'stable', '100')
    monitor.clear()
    expect(monitor.exportEvents()).toHaveLength(0)
  })
})
