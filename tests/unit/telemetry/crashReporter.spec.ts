// tests/unit/telemetry/crashReporter.spec.ts — PB1-001 unit tests
import { describe, it, expect, beforeEach } from 'vitest'
import { CrashReporter } from '@/telemetry/crashReporter'

describe('CrashReporter', () => {
  let reporter: CrashReporter

  beforeEach(() => {
    reporter = new CrashReporter()
  })

  // ── Crash Recording ──

  it('should record a renderer crash', () => {
    const event = reporter.recordCrash('crashed', 1, 'session-1')
    expect(event.type).toBe('renderer-crash')
    expect(event.reason).toBe('crashed')
    expect(event.exitCode).toBe(1)
    expect(event.sessionId).toBe('session-1')
    expect(event.id).toMatch(/^crash-/)
  })

  it('should record an unresponsive event', () => {
    const event = reporter.recordUnresponsive('session-2')
    expect(event.type).toBe('unresponsive')
    expect(event.reason).toBe('renderer-unresponsive')
  })

  it('should record a load failure', () => {
    const event = reporter.recordLoadFailure(-106, 'ERR_INTERNET_DISCONNECTED', 'session-3')
    expect(event.type).toBe('load-failure')
    expect(event.reason).toContain('ERR_INTERNET_DISCONNECTED')
    expect(event.exitCode).toBe(-106)
  })

  it('should mark session as crashed', () => {
    expect(reporter.hasSessionCrashed()).toBe(false)
    reporter.recordCrash('crashed', 1)
    expect(reporter.hasSessionCrashed()).toBe(true)
  })

  // ── Recovery Tracking ──

  it('should track recovery attempt → success', () => {
    const recoveryId = reporter.beginRecovery('reload')
    expect(recoveryId).toMatch(/^crash-/)

    reporter.recordRecoverySuccess(1500)
    const metrics = reporter.getMetrics()
    expect(metrics.recoveryAttempts).toBe(1)
    expect(metrics.recoverySuccesses).toBe(1)
    expect(metrics.recoveryFailures).toBe(0)
  })

  it('should track recovery attempt → failure', () => {
    reporter.beginRecovery('quit')
    reporter.recordRecoveryFailure('user chose quit')
    const metrics = reporter.getMetrics()
    expect(metrics.recoveryAttempts).toBe(1)
    expect(metrics.recoveryFailures).toBe(1)
  })

  it('should clear crash flag on successful recovery', () => {
    reporter.recordCrash('crashed', 1)
    expect(reporter.hasSessionCrashed()).toBe(true)

    reporter.beginRecovery('reload')
    reporter.recordRecoverySuccess()
    expect(reporter.hasSessionCrashed()).toBe(false)
  })

  // ── Metrics ──

  it('should calculate crash-free session rate', () => {
    // 10 sessions, 2 crashed
    const metrics = reporter.getMetrics(10, 8)
    expect(metrics.crashFreeSessions).toBe(8)
    expect(reporter.getCrashFreeSessionRate(10, 8)).toBe(0.8)
  })

  it('should return 1.0 when no sessions', () => {
    expect(reporter.getCrashFreeSessionRate()).toBe(1)
  })

  it('should calculate recovery success rate', () => {
    reporter.beginRecovery('reload')
    reporter.recordRecoverySuccess()

    reporter.recordCrash('crash2', 2)
    reporter.beginRecovery('reload')
    reporter.recordRecoveryFailure('failed')

    expect(reporter.getRecoverySuccessRate()).toBe(0.5)
  })

  it('should return 1.0 when no recovery attempts', () => {
    expect(reporter.getRecoverySuccessRate()).toBe(1)
  })

  // ── Crash Reasons Aggregation ──

  it('should aggregate crash reasons', () => {
    reporter.recordCrash('crashed', 1)
    reporter.recordCrash('crashed', 1)
    reporter.recordCrash('oom', 137)
    reporter.recordUnresponsive()

    const metrics = reporter.getMetrics()
    expect(metrics.crashCount).toBe(4)
    expect(metrics.crashReasons['crashed']).toBe(2)
    expect(metrics.crashReasons['oom']).toBe(1)
    expect(metrics.crashReasons['renderer-unresponsive']).toBe(1)
  })

  // ── Export / Import ──

  it('should export events', () => {
    reporter.recordCrash('test', 0)
    reporter.recordUnresponsive()
    const exported = reporter.exportEvents()
    expect(exported).toHaveLength(2)
  })

  it('should import events without clearing existing', () => {
    reporter.recordCrash('first', 0)
    reporter.importEvents([
      { id: 'ext-1', timestamp: Date.now() - 1000, type: 'renderer-crash', reason: 'old' }
    ])
    expect(reporter.exportEvents()).toHaveLength(2)
  })

  it('should prune events older than 30 days on import', () => {
    const oldEvent: Parameters<typeof reporter.importEvents>[0][number] = {
      id: 'old-1',
      timestamp: Date.now() - 31 * 24 * 60 * 60 * 1000,
      type: 'renderer-crash',
      reason: 'ancient'
    }
    reporter.importEvents([oldEvent])
    expect(reporter.exportEvents()).toHaveLength(0)
  })

  // ── Clear ──

  it('should clear all events and state', () => {
    reporter.recordCrash('test', 0)
    reporter.beginRecovery('reload')
    reporter.clear()

    expect(reporter.exportEvents()).toHaveLength(0)
    expect(reporter.hasSessionCrashed()).toBe(false)
  })

  // ── markSessionClean ──

  it('should mark session clean', () => {
    reporter.recordCrash('crash', 1)
    expect(reporter.hasSessionCrashed()).toBe(true)
    reporter.markSessionClean()
    expect(reporter.hasSessionCrashed()).toBe(false)
  })

  // ── Recent Crashes Limit ──

  it('should keep only last 10 crashes in metrics', () => {
    for (let i = 0; i < 15; i++) {
      reporter.recordCrash(`crash-${i}`, i)
    }
    const metrics = reporter.getMetrics()
    expect(metrics.recentCrashes).toHaveLength(10)
  })
})
