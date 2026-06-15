// tests/unit/release/healthMonitor.spec.ts — PB1-012 unit tests
import { describe, it, expect, beforeEach } from 'vitest'
import { HealthMonitor } from '@/release/healthMonitor'

describe('HealthMonitor', () => {
  let monitor: HealthMonitor

  beforeEach(() => {
    monitor = new HealthMonitor()
  })

  it('should evaluate healthy status when all metrics pass', () => {
    const snapshot = monitor.feed({
      crashFreeRate: 0.98,
      startupSuccessRate: 0.995,
      recoveryRate: 0.95,
      averageStartupTime: 350,
      averageSessionDuration: 120000,
      totalSessions: 100,
      totalCrashes: 2
    })
    expect(snapshot.status).toBe('healthy')
  })

  it('should evaluate degraded when one metric fails', () => {
    const snapshot = monitor.feed({
      crashFreeRate: 0.90, // Below 0.95 threshold
      startupSuccessRate: 0.995,
      recoveryRate: 0.95,
      averageStartupTime: 350,
      averageSessionDuration: 120000,
      totalSessions: 100,
      totalCrashes: 10
    })
    expect(snapshot.status).toBe('degraded')
  })

  it('should evaluate unhealthy when two metrics fail', () => {
    const snapshot = monitor.feed({
      crashFreeRate: 0.90, // Below 0.95
      startupSuccessRate: 0.95, // Below 0.99
      recoveryRate: 0.85, // Below 0.90
      averageStartupTime: 350,
      averageSessionDuration: 120000,
      totalSessions: 100,
      totalCrashes: 10
    })
    expect(snapshot.status).toBe('unhealthy')
  })

  it('should identify degraded metrics', () => {
    const snapshot = monitor.feed({
      crashFreeRate: 0.90,
      startupSuccessRate: 0.995,
      recoveryRate: 0.85,
      averageStartupTime: 350,
      averageSessionDuration: 120000,
      totalSessions: 100,
      totalCrashes: 10
    })
    const degraded = monitor.getDegradedMetrics(snapshot)
    expect(degraded).toContain('crashFreeRate')
    expect(degraded).toContain('recoveryRate')
  })

  it('should collect history', () => {
    monitor.feed({ crashFreeRate: 0.98, startupSuccessRate: 1, recoveryRate: 1, averageStartupTime: 300, averageSessionDuration: 100000, totalSessions: 50, totalCrashes: 1 })
    monitor.feed({ crashFreeRate: 0.97, startupSuccessRate: 1, recoveryRate: 1, averageStartupTime: 320, averageSessionDuration: 110000, totalSessions: 100, totalCrashes: 3 })
    monitor.feed({ crashFreeRate: 0.96, startupSuccessRate: 1, recoveryRate: 1, averageStartupTime: 340, averageSessionDuration: 120000, totalSessions: 150, totalCrashes: 6 })

    const history = monitor.exportHistory()
    expect(history).toHaveLength(3)
    expect(history[0].crashFreeRate).toBe(0.98)
    expect(history[2].crashFreeRate).toBe(0.96)
  })

  it('should provide health summary with current status', () => {
    monitor.feed({ crashFreeRate: 0.98, startupSuccessRate: 1, recoveryRate: 1, averageStartupTime: 300, averageSessionDuration: 100000, totalSessions: 50, totalCrashes: 1 })

    const summary = monitor.getHealthSummary()
    expect(summary.current.status).toBe('healthy')
    expect(summary.status).toBe('healthy')
    expect(summary.degradedMetrics).toHaveLength(0)
    expect(summary.history).toHaveLength(1)
    expect(summary.thresholds.crashFreeMin).toBe(0.95)
  })

  it('should return healthy when no data', () => {
    const summary = monitor.getHealthSummary()
    expect(summary.status).toBe('healthy')
    expect(summary.current.totalSessions).toBe(0)
  })

  it('should provide status shorthand', () => {
    monitor.feed({ crashFreeRate: 0.98, startupSuccessRate: 1, recoveryRate: 1, averageStartupTime: 300, averageSessionDuration: 100000, totalSessions: 50, totalCrashes: 1 })
    expect(monitor.getStatus()).toBe('healthy')
  })

  it('should support custom thresholds', () => {
    const strict = new HealthMonitor({
      crashFreeMin: 0.99,
      startupSuccessMin: 0.995,
      recoveryMin: 0.95
    })

    const snapshot = strict.feed({
      crashFreeRate: 0.98, // Fails 0.99 threshold
      startupSuccessRate: 0.99, // Fails 0.995 threshold
      recoveryRate: 0.96,
      averageStartupTime: 300,
      averageSessionDuration: 100000,
      totalSessions: 100,
      totalCrashes: 2
    })
    expect(snapshot.status).toBe('unhealthy') // 2 failed metrics
  })

  it('should update thresholds dynamically', () => {
    monitor.setThresholds({ crashFreeMin: 0.999 })
    expect(monitor.getThresholds().crashFreeMin).toBe(0.999)
  })

  it('should export and import history', () => {
    monitor.feed({ crashFreeRate: 0.98, startupSuccessRate: 1, recoveryRate: 1, averageStartupTime: 300, averageSessionDuration: 100000, totalSessions: 50, totalCrashes: 1 })

    const history = monitor.exportHistory()

    const m2 = new HealthMonitor()
    m2.importHistory(history)
    expect(m2.exportHistory()).toHaveLength(1)
    expect(m2.exportHistory()[0].crashFreeRate).toBe(0.98)
  })

  it('should prune history older than 90 days', () => {
    monitor.importHistory([{
      timestamp: Date.now() - 91 * 24 * 60 * 60 * 1000,
      crashFreeRate: 0.5,
      startupSuccessRate: 0.5,
      recoveryRate: 0.5,
      averageStartupTime: 0,
      averageSessionDuration: 0,
      totalSessions: 0,
      totalCrashes: 0,
      status: 'unhealthy'
    }])
    expect(monitor.exportHistory()).toHaveLength(0)
  })

  it('should clear all data', () => {
    monitor.feed({ crashFreeRate: 1, startupSuccessRate: 1, recoveryRate: 1, averageStartupTime: 0, averageSessionDuration: 0, totalSessions: 0, totalCrashes: 0 })
    monitor.clear()
    expect(monitor.exportHistory()).toHaveLength(0)
  })

  it('should keep last 30 snapshots in summary history', () => {
    for (let i = 0; i < 35; i++) {
      monitor.feed({ crashFreeRate: 1, startupSuccessRate: 1, recoveryRate: 1, averageStartupTime: i * 10, averageSessionDuration: 100000, totalSessions: i, totalCrashes: 0 })
    }
    const summary = monitor.getHealthSummary()
    expect(summary.history).toHaveLength(30)
  })
})
