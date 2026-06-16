// tests/unit/player/resume-manager.spec.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ResumeManager } from '@/player/resumeManager'

vi.mock('@/core/history', () => ({
  historyFacade: {
    updateProgress: vi.fn().mockResolvedValue(undefined),
    getByEpisode: vi.fn().mockReturnValue(null),
    recordHistory: vi.fn().mockResolvedValue(undefined),
  },
}))

describe('ResumeManager', () => {
  let manager: ResumeManager

  beforeEach(() => {
    manager = new ResumeManager(30)
    localStorage.clear()
  })

  afterEach(() => { vi.restoreAllMocks() })

  describe('savePosition()', () => {
    it('should save position when > minPosition', async () => {
      await manager.savePosition('m1', 'ep1', 120, 3600)
      const pos = await manager.loadPosition('ep1')
      expect(pos).toBe(120)
    })

    it('should NOT save when < minPosition', async () => {
      await manager.savePosition('m1', 'ep1', 10, 3600)
      const pos = await manager.loadPosition('ep1')
      expect(pos).toBe(0)
    })
  })

  describe('loadPosition()', () => {
    it('should return 0 when no saved position', async () => {
      expect(await manager.loadPosition('unknown')).toBe(0)
    })

    it('should return 0 when episodeId mismatch', async () => {
      await manager.savePosition('m1', 'ep1', 120, 3600)
      expect(await manager.loadPosition('ep2')).toBe(0)
    })
  })

  describe('shouldResume()', () => {
    it('should return true when > 30s', () => {
      expect(manager.shouldResume(60)).toBe(true)
    })

    it('should return false when <= 30s', () => {
      expect(manager.shouldResume(10)).toBe(false)
    })
  })

  describe('clearPosition()', () => {
    it('should clear saved position', async () => {
      await manager.savePosition('m1', 'ep1', 120, 3600)
      await manager.clearPosition()
      expect(await manager.loadPosition('ep1')).toBe(0)
    })
  })
})
