// tests/unit/search-unified/search-health-monitor.spec.ts — CE8-C2 HealthMonitor tests

import { describe, it, expect, beforeEach } from 'vitest'
import { SearchHealthMonitor } from '@/modules/search-unified/infrastructure/services/SearchHealthMonitor'

describe('SearchHealthMonitor', () => {
  let monitor: SearchHealthMonitor

  beforeEach(() => { monitor = new SearchHealthMonitor(3, 5) })

  it('should start healthy', () => {
    expect(monitor.getStatus('tmdb')).toBe('healthy')
  })

  it('should remain healthy after <3 failures', () => {
    monitor.recordFailure('tmdb')
    monitor.recordFailure('tmdb')
    expect(monitor.getStatus('tmdb')).toBe('healthy')
  })

  it('should become degraded after 3 failures', () => {
    monitor.recordFailure('tmdb')
    monitor.recordFailure('tmdb')
    monitor.recordFailure('tmdb')
    expect(monitor.getStatus('tmdb')).toBe('degraded')
  })

  it('should become offline after 5 failures', () => {
    for (let i = 0; i < 5; i++) monitor.recordFailure('tmdb')
    expect(monitor.getStatus('tmdb')).toBe('offline')
    expect(monitor.isOffline('tmdb')).toBe(true)
  })

  it('should recover after success', () => {
    for (let i = 0; i < 5; i++) monitor.recordFailure('tmdb')
    expect(monitor.getStatus('tmdb')).toBe('offline')

    monitor.recordSuccess('tmdb')
    expect(monitor.getStatus('tmdb')).toBe('healthy')
    expect(monitor.isOffline('tmdb')).toBe(false)
  })

  it('should track per-provider independently', () => {
    for (let i = 0; i < 3; i++) monitor.recordFailure('tmdb')
    monitor.recordFailure('jellyfin')

    expect(monitor.getStatus('tmdb')).toBe('degraded')
    expect(monitor.getStatus('jellyfin')).toBe('healthy')
  })

  it('should reset provider state', () => {
    for (let i = 0; i < 5; i++) monitor.recordFailure('tmdb')
    monitor.reset('tmdb')
    expect(monitor.getStatus('tmdb')).toBe('healthy')
  })

  it('should return all statuses', () => {
    monitor.recordSuccess('tmdb')
    monitor.recordFailure('jellyfin')
    expect(monitor.getAllStatuses()).toHaveLength(2)
  })
})
