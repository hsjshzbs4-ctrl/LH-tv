// tests/unit/release/updateAnalytics.spec.ts — PB1-011 unit tests
import { describe, it, expect, beforeEach } from 'vitest'
import { UpdateAnalytics } from '@/release/updateAnalytics'

describe('UpdateAnalytics', () => {
  let analytics: UpdateAnalytics

  beforeEach(() => {
    analytics = new UpdateAnalytics('2.0.0')
  })

  it('should record update available', () => {
    const event = analytics.recordUpdateAvailable('2.0.0', '2.1.0', 50 * 1024 * 1024)
    expect(event.type).toBe('update-available')
    expect(event.fromVersion).toBe('2.0.0')
    expect(event.toVersion).toBe('2.1.0')
    expect(event.downloadSize).toBe(50 * 1024 * 1024)
  })

  it('should record update downloaded', () => {
    const event = analytics.recordUpdateDownloaded('2.0.0', '2.1.0', 30000)
    expect(event.type).toBe('update-downloaded')
    expect(event.downloadDuration).toBe(30000)
  })

  it('should record update installed and bump version', () => {
    analytics.recordUpdateInstalled('2.0.0', '2.1.0')
    const metrics = analytics.getMetrics()
    expect(metrics.updatesInstalled).toBe(1)
    expect(metrics.currentVersion).toBe('2.1.0')
  })

  it('should record update failed', () => {
    const event = analytics.recordUpdateFailed('2.0.0', '2.1.0', 'Network timeout')
    expect(event.type).toBe('update-failed')
    expect(event.failureReason).toBe('Network timeout')
  })

  it('should record rollback', () => {
    analytics.recordUpdateInstalled('2.0.0', '2.1.0')
    const event = analytics.recordRollback('2.1.0', '2.0.0', 'Crashes on startup')
    expect(event.type).toBe('rollback')
    expect(event.toVersion).toBe('2.0.0')

    const metrics = analytics.getMetrics()
    expect(metrics.rollbacks).toBe(1)
  })

  it('should calculate update success rate', () => {
    analytics.recordUpdateAvailable('2.0.0', '2.1.0')
    analytics.recordUpdateDownloaded('2.0.0', '2.1.0')
    analytics.recordUpdateInstalled('2.0.0', '2.1.0')

    analytics.recordUpdateAvailable('2.1.0', '2.2.0')
    analytics.recordUpdateDownloaded('2.1.0', '2.2.0')
    analytics.recordUpdateFailed('2.1.0', '2.2.0', 'Disk full')

    expect(analytics.getUpdateSuccessRate()).toBe(0.5)
  })

  it('should return 1.0 when no updates attempted', () => {
    expect(analytics.getUpdateSuccessRate()).toBe(1)
  })

  it('should aggregate failure reasons', () => {
    analytics.recordUpdateFailed('2.0.0', '2.1.0', 'Network timeout')
    analytics.recordUpdateFailed('2.0.0', '2.1.0', 'Network timeout')
    analytics.recordUpdateFailed('2.0.0', '2.2.0', 'Disk full')

    const metrics = analytics.getMetrics()
    expect(metrics.failureReasons['Network timeout']).toBe(2)
    expect(metrics.failureReasons['Disk full']).toBe(1)
  })

  it('should calculate download success rate', () => {
    analytics.recordUpdateDownloaded('2.0.0', '2.1.0')
    analytics.recordUpdateFailed('2.0.0', '2.1.0', 'Download failed')
    analytics.recordUpdateFailed('2.0.0', '2.1.1', 'Checksum mismatch')

    const metrics = analytics.getMetrics()
    expect(metrics.downloadSuccessRate).toBe(1 / 3)
  })

  it('should export and import events', () => {
    analytics.recordUpdateAvailable('2.0.0', '2.1.0')
    analytics.recordUpdateInstalled('2.0.0', '2.1.0')

    const events = analytics.exportEvents()

    const a2 = new UpdateAnalytics()
    a2.importEvents(events)
    expect(a2.exportEvents()).toHaveLength(2)
    expect(a2.getMetrics().currentVersion).toBe('2.1.0')
  })

  it('should prune events older than 90 days', () => {
    analytics.importEvents([{
      id: 'old',
      timestamp: Date.now() - 91 * 24 * 60 * 60 * 1000,
      type: 'update-installed',
      fromVersion: '1.0.0',
      toVersion: '1.1.0'
    }])
    expect(analytics.exportEvents()).toHaveLength(0)
  })

  it('should clear all data', () => {
    analytics.recordUpdateAvailable('2.0.0', '2.1.0')
    analytics.clear()
    expect(analytics.exportEvents()).toHaveLength(0)
  })
})
