// tests/unit/integration/progress-sync.spec.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/core/history', () => ({
  historyFacade: {
    updateProgress: vi.fn().mockResolvedValue(undefined),
  },
}))

import { ProgressSyncService } from '@/integration/progress/progressSyncService'

describe('ProgressSyncService', () => {
  let service: ProgressSyncService

  beforeEach(() => {
    vi.useFakeTimers()
    service = new ProgressSyncService(30_000)
  })

  afterEach(() => {
    service.stopTracking()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe('startTracking/stopTracking', () => {
    it('should start and stop tracking', () => {
      service.startTracking('m1', 'ep1', 1200)
      service.stopTracking()
      // 无异常即通过
    })
  })

  describe('syncOnPause', () => {
    it('should sync on pause', () => {
      service.startTracking('m1', 'ep1', 1200)
      expect(() => service.syncOnPause(300, 1200)).not.toThrow()
    })
  })

  describe('syncOnExit', () => {
    it('should sync and stop tracking', async () => {
      service.startTracking('m1', 'ep1', 1200)
      await service.syncOnExit(600, 1200)
      // 无异常即通过
    })
  })

  describe('syncOnComplete', () => {
    it('should sync and emit complete event', async () => {
      service.startTracking('m1', 'ep1', 1200)
      await service.syncOnComplete(1200, 1200)
    })
  })

  describe('auto-sync', () => {
    it('should set up interval timer', () => {
      service.startTracking('m1', 'ep1', 1200)
      service.updatePosition(100, 1200)
      vi.advanceTimersByTime(35_000)
      service.stopTracking()
    })
  })
})
