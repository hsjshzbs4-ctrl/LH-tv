// tests/unit/release/installationAnalytics.spec.ts — PB1-010 unit tests
import { describe, it, expect, beforeEach } from 'vitest'
import { InstallationAnalytics } from '@/release/installationAnalytics'

describe('InstallationAnalytics', () => {
  let analytics: InstallationAnalytics

  beforeEach(() => {
    analytics = new InstallationAnalytics('win32', 'x64', true)
  })

  it('should record first install', () => {
    const event = analytics.recordFirstInstall()
    expect(event.type).toBe('first-install')
    expect(event.platform).toBe('win32')
    expect(event.arch).toBe('x64')
    expect(event.isPortable).toBe(true)
  })

  it('should record reinstall', () => {
    const event = analytics.recordReinstall()
    expect(event.type).toBe('reinstall')
  })

  it('should record upgrade install', () => {
    const event = analytics.recordUpgradeInstall()
    expect(event.type).toBe('upgrade-install')
  })

  it('should record portable launch', () => {
    const event = analytics.recordLaunch()
    expect(event.type).toBe('portable-launch')
  })

  it('should compute install metrics', () => {
    analytics.recordFirstInstall()
    analytics.recordLaunch()
    analytics.recordLaunch()
    analytics.recordUpgradeInstall()

    const metrics = analytics.getMetrics()
    expect(metrics.totalInstalls).toBe(4)
    expect(metrics.firstInstalls).toBe(1)
    expect(metrics.portableLaunches).toBe(2)
    expect(metrics.upgradeInstalls).toBe(1)
  })

  it('should compute platform distribution', () => {
    analytics.recordLaunch()
    analytics.recordLaunch()
    const dist = analytics.getPlatformDistribution()
    expect(dist['win32']).toBe(2)
  })

  it('should compute type distribution', () => {
    analytics.recordFirstInstall()
    analytics.recordLaunch()
    analytics.recordLaunch()

    const metrics = analytics.getMetrics()
    expect(metrics.installTypeDistribution['first-install']).toBe(1)
    expect(metrics.installTypeDistribution['portable-launch']).toBe(2)
  })

  it('should provide install statistics for dashboard', () => {
    analytics.recordFirstInstall()
    const stats = analytics.getInstallStatistics()
    expect(stats.total).toBe(1)
    expect(stats.firstTime).toBe(1)
    expect(stats.portable).toBe(true)
    expect(stats.platform).toBe('win32')
    expect(stats.arch).toBe('x64')
  })

  it('should export and import events', () => {
    analytics.recordFirstInstall()
    analytics.recordLaunch()

    const events = analytics.exportEvents()
    expect(events).toHaveLength(2)

    const a2 = new InstallationAnalytics()
    a2.importEvents(events)
    expect(a2.exportEvents()).toHaveLength(2)
  })

  it('should prune events older than 90 days', () => {
    analytics.importEvents([{
      id: 'old',
      timestamp: Date.now() - 91 * 24 * 60 * 60 * 1000,
      type: 'first-install',
      platform: 'win32',
      arch: 'x64',
      version: '1.0.0',
      isPortable: true
    }])
    expect(analytics.exportEvents()).toHaveLength(0)
  })

  it('should clear all data', () => {
    analytics.recordLaunch()
    analytics.clear()
    expect(analytics.exportEvents()).toHaveLength(0)
  })
})
