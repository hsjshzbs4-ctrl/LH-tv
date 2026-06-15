// tests/unit/feedback/telemetrySnapshot.spec.ts — PB1-008 unit tests
import { describe, it, expect, beforeEach } from 'vitest'
import { TelemetrySnapshotCapture, type ITelemetryProvider } from '@/feedback/telemetrySnapshot'

class MockTelemetryProvider implements ITelemetryProvider {
  getDashboard() {
    return {
      totalSessions: 10,
      totalCrashes: 2,
      crashFreeSessionRate: 0.8,
      recoverySuccessRate: 0.9,
      averageStartupTime: 350,
      averageSessionDuration: 120000,
      startupSuccessRate: 0.95,
      dailyActiveSessions: 3,
      averageColdStartTime: 400,
      averageWarmStartTime: 100
    }
  }
  crash = {
    exportEvents: () => [
      { id: 'c1', timestamp: Date.now(), type: 'renderer-crash' as const, reason: 'crash-1' },
      { id: 'c2', timestamp: Date.now(), type: 'recovery-success' as const, reason: 'recovered' }
    ],
    getCrashFreeSessionRate: () => 0.8,
    getRecoverySuccessRate: () => 0.9,
    getMetrics: () => ({
      crashCount: 2,
      crashFreeSessions: 8,
      totalSessions: 10,
      recoveryAttempts: 3,
      recoverySuccesses: 2,
      recoveryFailures: 1,
      crashReasons: { 'crashed': 2 },
      recentCrashes: []
    })
  }
  session = {
    exportRecords: () => [
      { sessionId: 's1', startTime: Date.now() - 10000, endTime: Date.now(), duration: 10000, crashDetected: false }
    ],
    getMetrics: () => ({
      totalSessions: 10,
      activeSessions: 1,
      averageDuration: 120000,
      dailyActiveSessions: 3,
      totalDuration: 1200000,
      sessionsToday: 3,
      peakConcurrentSessions: 1
    })
  }
  startup = {
    exportRecords: () => [
      { id: 'st1', timestamp: Date.now(), type: 'cold-start' as const, stages: [], totalDuration: 350, success: true }
    ],
    getMetrics: () => ({
      coldStartCount: 5,
      warmStartCount: 5,
      averageColdStartTime: 400,
      averageWarmStartTime: 100,
      startupSuccessRate: 0.95,
      stageAverages: {},
      recentStartups: []
    })
  }
}

describe('TelemetrySnapshotCapture', () => {
  let capture: TelemetrySnapshotCapture

  beforeEach(() => {
    capture = new TelemetrySnapshotCapture()
  })

  it('should return empty snapshot without provider', () => {
    expect(capture.hasProvider()).toBe(false)
    const snapshot = capture.capture()
    expect(snapshot.dashboard).toBeNull()
    expect(snapshot.crashEvents).toHaveLength(0)
    expect(snapshot.summary.totalSessions).toBe(0)
    expect(snapshot.summary.crashFreeRate).toBe(1)
  })

  it('should capture snapshot with provider', () => {
    capture.setProvider(new MockTelemetryProvider())
    expect(capture.hasProvider()).toBe(true)

    const snapshot = capture.capture()
    expect(snapshot.dashboard).not.toBeNull()
    expect(snapshot.dashboard!.totalSessions).toBe(10)
    expect(snapshot.crashEvents).toHaveLength(2)
    expect(snapshot.startupRecords).toHaveLength(1)
    expect(snapshot.sessionRecords).toHaveLength(1)
  })

  it('should compute summary from dashboard', () => {
    capture.setProvider(new MockTelemetryProvider())
    const snapshot = capture.capture()
    expect(snapshot.summary.totalSessions).toBe(10)
    expect(snapshot.summary.totalCrashes).toBe(2)
    expect(snapshot.summary.crashFreeRate).toBe(0.8)
    expect(snapshot.summary.recoverySuccessRate).toBe(0.9)
    expect(snapshot.summary.averageStartupTime).toBe(350)
    expect(snapshot.summary.averageSessionDuration).toBe(120000)
    expect(snapshot.summary.startupSuccessRate).toBe(0.95)
  })

  it('should get lightweight summary without full snapshot', () => {
    capture.setProvider(new MockTelemetryProvider())
    const summary = capture.getSummary()
    expect(summary.totalSessions).toBe(10)
    expect(summary.totalCrashes).toBe(2)
    expect(summary.crashFreeRate).toBe(0.8)
  })

  it('should return empty summary without provider', () => {
    const summary = capture.getSummary()
    expect(summary.totalSessions).toBe(0)
    expect(summary.totalCrashes).toBe(0)
    expect(summary.crashFreeRate).toBe(1)
  })

  it('should handle provider errors gracefully', () => {
    const badProvider: ITelemetryProvider = {
      getDashboard: () => { throw new Error('fail') },
      crash: { exportEvents: () => { throw new Error('fail') }, getCrashFreeSessionRate: () => 0, getRecoverySuccessRate: () => 0, getMetrics: () => ({ crashCount: 0, crashFreeSessions: 0, totalSessions: 0, recoveryAttempts: 0, recoverySuccesses: 0, recoveryFailures: 0, crashReasons: {}, recentCrashes: [] }) },
      session: { exportRecords: () => [], getMetrics: () => ({ totalSessions: 0, activeSessions: 0, averageDuration: 0, dailyActiveSessions: 0, totalDuration: 0, sessionsToday: 0, peakConcurrentSessions: 0 }) },
      startup: { exportRecords: () => [], getMetrics: () => ({ coldStartCount: 0, warmStartCount: 0, averageColdStartTime: 0, averageWarmStartTime: 0, startupSuccessRate: 1, stageAverages: {}, recentStartups: [] }) }
    }
    capture.setProvider(badProvider)
    const snapshot = capture.capture()
    expect(snapshot.dashboard).toBeNull() // Graceful fallback
  })

  it('should limit event slices', () => {
    capture.setProvider(new MockTelemetryProvider())
    const snapshot = capture.capture()
    expect(snapshot.crashEvents.length).toBeLessThanOrEqual(50)
    expect(snapshot.startupRecords.length).toBeLessThanOrEqual(20)
    expect(snapshot.sessionRecords.length).toBeLessThanOrEqual(30)
  })
})
