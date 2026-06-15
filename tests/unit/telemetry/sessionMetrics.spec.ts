// tests/unit/telemetry/sessionMetrics.spec.ts — PB1-002 unit tests
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SessionMetricsTracker } from '@/telemetry/sessionMetrics'

describe('SessionMetricsTracker', () => {
  let tracker: SessionMetricsTracker

  beforeEach(() => {
    tracker = new SessionMetricsTracker()
  })

  // ── Session Lifecycle ──

  it('should start a session', () => {
    const id = tracker.startSession()
    expect(id).toMatch(/^session-/)
    expect(tracker.getCurrentSessionId()).toBe(id)
  })

  it('should end a session with duration', () => {
    vi.useFakeTimers()
    tracker.startSession()
    vi.advanceTimersByTime(5000) // 5 seconds

    const record = tracker.endSession(false)
    expect(record).not.toBeNull()
    expect(record!.duration).toBe(5000)
    expect(record!.crashDetected).toBe(false)
    expect(tracker.getCurrentSessionId()).toBeNull()

    vi.useRealTimers()
  })

  it('should track crash-detected flag on end', () => {
    tracker.startSession()
    const record = tracker.endSession(true)
    expect(record!.crashDetected).toBe(true)
  })

  it('should automatically end previous session on new start', () => {
    vi.useFakeTimers()
    const id1 = tracker.startSession()
    vi.advanceTimersByTime(1000)
    const id2 = tracker.startSession()

    expect(id2).not.toBe(id1)
    const records = tracker.exportRecords()
    expect(records).toHaveLength(1) // First session auto-ended
    expect(records[0].duration).toBe(1000)

    vi.useRealTimers()
  })

  // ── Pause / Resume ──

  it('should pause and resume without counting pause time', () => {
    vi.useFakeTimers()
    tracker.startSession()
    vi.advanceTimersByTime(2000) // 2s active

    tracker.pauseSession()
    vi.advanceTimersByTime(3000) // 3s paused (should be excluded)

    tracker.resumeSession()
    vi.advanceTimersByTime(1000) // 1s active

    const record = tracker.endSession(false)
    expect(record!.duration).toBe(3000) // 2s + 1s, excluding 3s pause

    vi.useRealTimers()
  })

  it('should handle multiple pause/resume cycles', () => {
    vi.useFakeTimers()
    tracker.startSession()
    vi.advanceTimersByTime(1000) // 1s

    tracker.pauseSession()
    vi.advanceTimersByTime(500) // pause

    tracker.resumeSession()
    vi.advanceTimersByTime(1000) // 1s

    tracker.pauseSession()
    vi.advanceTimersByTime(300) // pause

    tracker.resumeSession()
    vi.advanceTimersByTime(1000) // 1s

    const record = tracker.endSession(false)
    expect(record!.duration).toBe(3000) // 3s active total

    vi.useRealTimers()
  })

  it('should ignore pause if not in session', () => {
    tracker.pauseSession() // No session active — should not throw
    expect(tracker.getCurrentSessionId()).toBeNull()
  })

  // ── Current Duration ──

  it('should report current session duration excluding pauses', () => {
    vi.useFakeTimers()
    tracker.startSession()
    vi.advanceTimersByTime(5000)
    expect(tracker.getCurrentSessionDuration()).toBe(5000)

    tracker.pauseSession()
    vi.advanceTimersByTime(2000)
    expect(tracker.getCurrentSessionDuration()).toBe(5000) // Unchanged during pause

    vi.useRealTimers()
  })

  it('should return 0 duration when no session', () => {
    expect(tracker.getCurrentSessionDuration()).toBe(0)
  })

  // ── Metrics ──

  it('should compute session metrics', () => {
    vi.useFakeTimers()
    // Session 1: 10s
    tracker.startSession()
    vi.advanceTimersByTime(10000)
    tracker.endSession(false)

    // Session 2: 20s
    tracker.startSession()
    vi.advanceTimersByTime(20000)
    tracker.endSession(false)

    const metrics = tracker.getMetrics()
    expect(metrics.totalSessions).toBe(2)
    expect(metrics.averageDuration).toBe(15000) // (10+20)/2
    expect(metrics.totalDuration).toBe(30000)

    vi.useRealTimers()
  })

  it('should count daily active sessions', () => {
    tracker.startSession()
    tracker.endSession(false)

    const metrics = tracker.getMetrics()
    expect(metrics.sessionsToday).toBeGreaterThanOrEqual(1)
    expect(metrics.dailyActiveSessions).toBeGreaterThanOrEqual(1)
  })

  // ── Export / Import ──

  it('should export records', () => {
    tracker.startSession()
    tracker.endSession(false)

    const records = tracker.exportRecords()
    expect(records).toHaveLength(1)
    expect(records[0].sessionId).toMatch(/^session-/)
    expect(records[0].duration).toBeGreaterThanOrEqual(0)
  })

  it('should export events including pause/resume', () => {
    tracker.startSession()
    tracker.pauseSession()
    tracker.resumeSession()
    tracker.endSession(false)

    const events = tracker.exportEvents()
    expect(events.length).toBe(4) // start, pause, resume, end
    expect(events[0].type).toBe('session-start')
    expect(events[1].type).toBe('session-pause')
    expect(events[2].type).toBe('session-resume')
    expect(events[3].type).toBe('session-end')
  })

  it('should import records and prune old ones', () => {
    const oldRecord = {
      sessionId: 'old',
      startTime: Date.now() - 31 * 24 * 60 * 60 * 1000, // 31 days
      endTime: Date.now() - 31 * 24 * 60 * 60 * 1000 + 5000,
      duration: 5000,
      crashDetected: false
    }
    tracker.importRecords([oldRecord])
    expect(tracker.exportRecords()).toHaveLength(0) // Pruned
  })

  // ── Clear ──

  it('should clear all data', () => {
    tracker.startSession()
    tracker.endSession(false)
    tracker.startSession() // Active session

    tracker.clear()
    expect(tracker.exportRecords()).toHaveLength(0)
    expect(tracker.exportEvents()).toHaveLength(0)
    expect(tracker.getCurrentSessionId()).toBeNull()
  })

  // ── Edge Cases ──

  it('should handle endSession with no active session', () => {
    const record = tracker.endSession(false)
    expect(record).toBeNull()
  })

  it('should handle pause during endSession', () => {
    vi.useFakeTimers()
    tracker.startSession()
    vi.advanceTimersByTime(2000)
    tracker.pauseSession()
    vi.advanceTimersByTime(500)

    // End without explicit resume — pause time should be excluded
    const record = tracker.endSession(false)
    expect(record!.duration).toBe(2000) // Pause time excluded

    vi.useRealTimers()
  })
})
