// tests/unit/core/download/recovery-manager.spec.ts — RecoveryManager 单元测试
// 覆盖: canRecover/recoverTask/markRecovered

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { RecoveryManager } from '@/core/download/recovery/RecoveryManager'
import type { DownloadTask } from '@/core/download/types/download.types'

function createTask(overrides: Partial<DownloadTask> = {}): DownloadTask {
  return {
    id: 'dl-1', mediaId: 'm1', providerId: 'p1', providerName: 'Test',
    episodeId: 'ep-1', episodeLabel: '第01集', episodeNum: 1,
    title: 'Test Show', cover: '', sourceUrl: 'https://x.com/v.mp4',
    status: 'pending', progress: 0, speed: 0, downloadedBytes: 0, totalBytes: 0,
    supportsResume: true, resumeCount: 0, createdAt: Date.now(), updatedAt: Date.now(),
    ...overrides,
  }
}

describe('RecoveryManager', () => {
  let recovery: RecoveryManager

  beforeEach(() => {
    recovery = new RecoveryManager()
    vi.clearAllMocks()
  })

  // ==================== canRecover ====================
  describe('canRecover()', () => {
    it('should return true for paused task', () => {
      expect(recovery.canRecover(createTask({ status: 'paused' }))).toBe(true)
    })

    it('should return true for failed task', () => {
      expect(recovery.canRecover(createTask({ status: 'failed' }))).toBe(true)
    })

    it('should return false for completed task', () => {
      expect(recovery.canRecover(createTask({ status: 'completed' }))).toBe(false)
    })

    it('should return false for downloading task', () => {
      expect(recovery.canRecover(createTask({ status: 'downloading' }))).toBe(false)
    })

    it('should return false for recovering task (already in recovery)', () => {
      expect(recovery.canRecover(createTask({ status: 'recovering' }))).toBe(false)
    })

    it('should return false when supportsResume is false', () => {
      expect(recovery.canRecover(createTask({ status: 'paused', supportsResume: false }))).toBe(false)
    })

    it('should return false for pending task', () => {
      expect(recovery.canRecover(createTask({ status: 'pending' }))).toBe(false)
    })
  })

  // ==================== recoverTask ====================
  describe('recoverTask()', () => {
    it('should call downloadEpisode with correct params for mp4', async () => {
      const app = (window as Record<string, unknown>).app as Record<string, Record<string, unknown>>
      const downloadEpisode = app.downloadEpisode as ReturnType<typeof vi.fn>
      downloadEpisode.mockResolvedValue({ id: 'new-legacy-1', status: 'downloading' })

      const task = createTask({
        status: 'paused',
        title: 'Naruto',
        episodeLabel: '第01集',
        episodeNum: 1,
        sourceUrl: 'https://test.com/naruto.mp4',
      })

      const result = await recovery.recoverTask(task)
      expect(downloadEpisode).toHaveBeenCalledWith({
        showName: 'Naruto',
        episodeLabel: '第01集',
        episodeNum: 1,
        url: 'https://test.com/naruto.mp4',
        type: 'mp4',
      })
      expect(result.id).toBe('new-legacy-1')
    })

    it('should detect m3u8 type', async () => {
      const app = (window as Record<string, unknown>).app as Record<string, Record<string, unknown>>
      const downloadEpisode = app.downloadEpisode as ReturnType<typeof vi.fn>
      downloadEpisode.mockResolvedValue({ id: 'dl-2', status: 'downloading' })

      const task = createTask({
        sourceUrl: 'https://test.com/stream.m3u8',
      })

      await recovery.recoverTask(task)
      expect(downloadEpisode).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'm3u8' })
      )
    })
  })

  // ==================== markRecovered ====================
  describe('markRecovered()', () => {
    it('should increment resumeCount and update timestamp', () => {
      const task = createTask({ resumeCount: 1 })
      recovery.markRecovered(task)

      expect(task.resumeCount).toBe(2)
      expect(task.lastResumeAt).toBeGreaterThan(0)
      expect(task.supportsResume).toBe(true)
      expect(task.error).toBeUndefined()
    })

    it('should handle task with no resumeCount', () => {
      const task = createTask()
      task.resumeCount = undefined as unknown as number
      recovery.markRecovered(task)
      expect(task.resumeCount).toBe(1)
    })
  })
})
