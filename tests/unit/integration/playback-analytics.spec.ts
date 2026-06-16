// tests/unit/integration/playback-analytics.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/telemetry', () => ({
  getTelemetryService: vi.fn(() => ({
    getDashboard: vi.fn(() => ({
      crashFreeSessionRate: 100, startupSuccessRate: 100,
      averageStartupTime: 200, averageColdStartTime: 300, averageWarmStartTime: 100,
      averageSessionDuration: 600, totalSessions: 10, dailyActiveSessions: 3,
      totalCrashes: 0, recoverySuccessRate: 100,
    })),
    exportAll: vi.fn(() => ({
      crashEvents: [], sessionRecords: [
        { sessionId: 's1', startTime: Date.now() - 600000, endTime: Date.now(), duration: 600, crashDetected: false },
        { sessionId: 's2', startTime: Date.now() - 300000, endTime: Date.now(), duration: 300, crashDetected: false },
      ],
      sessionEvents: [
        { type: 'session-start', timestamp: Date.now() - 600000 },
        { type: 'session-end', timestamp: Date.now() },
      ],
      startupRecords: [],
      dashboard: {},
    })),
  })),
}))

import { PlaybackAnalytics } from '@/integration/analytics/playbackAnalytics'

describe('PlaybackAnalytics', () => {
  let analytics: PlaybackAnalytics

  beforeEach(() => { analytics = new PlaybackAnalytics() })

  describe('getSnapshot', () => {
    it('should compute watchTimeTotal in minutes', () => {
      const snapshot = analytics.getSnapshot()
      expect(snapshot.watchTimeTotal).toBeGreaterThan(0)
    })

    it('should compute completionRate', () => {
      const snapshot = analytics.getSnapshot()
      expect(typeof snapshot.completionRate).toBe('number')
    })

    it('should return quality and subtitle usage', () => {
      const snapshot = analytics.getSnapshot()
      expect(snapshot.qualityUsage).toBeDefined()
      expect(typeof snapshot.subtitleUsage).toBe('number')
    })
  })

  describe('refresh', () => {
    it('should return fresh snapshot', () => {
      const s = analytics.refresh()
      expect(s.watchTimeTotal).toBeGreaterThan(0)
    })
  })
})
