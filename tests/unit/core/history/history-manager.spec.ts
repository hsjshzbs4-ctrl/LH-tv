// tests/unit/core/history/history-manager.spec.ts — HistoryManager 单元测试
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { HistoryManager } from '@/core/history/manager/HistoryManager'
import { storageService } from '@/shared/storage/storage.service'
import type { WatchHistoryItem } from '@/core/history/types/history.types'

function hist(overrides: Partial<WatchHistoryItem> = {}): WatchHistoryItem {
  return {
    id: 'h1', mediaId: 'm1', episodeId: 'ep1', providerId: 'p1',
    title: 'Test', cover: '', episodeLabel: '第01集',
    duration: 2400, currentTime: 600, progress: 0.25, lastWatchedAt: Date.now(),
    ...overrides,
  }
}

describe('HistoryManager', () => {
  let manager: HistoryManager

  beforeEach(async () => {
    manager = new HistoryManager()
    vi.spyOn(storageService, 'getHistory').mockResolvedValue([])
    vi.spyOn(storageService, 'setHistory').mockResolvedValue()
    await manager.initialize()
  })

  afterEach(() => { vi.restoreAllMocks() })

  describe('recordHistory()', () => {
    it('should record and persist', async () => {
      const setSpy = vi.spyOn(storageService, 'setHistory')
      await manager.recordHistory(hist())
      expect(manager.getHistory()).toHaveLength(1)
      expect(setSpy).toHaveBeenCalled()
    })

    it('should update existing entry (same episodeId)', async () => {
      await manager.recordHistory(hist({ episodeId: 'ep1', currentTime: 100 }))
      await manager.recordHistory(hist({ episodeId: 'ep1', currentTime: 500 }))
      expect(manager.getHistory()).toHaveLength(1)
      expect(manager.getByEpisode('ep1')?.currentTime).toBe(500)
    })
  })

  describe('updateProgress()', () => {
    it('should update progress and persist', async () => {
      await manager.recordHistory(hist({ episodeId: 'ep1', currentTime: 100, duration: 1000 }))
      await manager.updateProgress('ep1', 500, 1000)
      const item = manager.getByEpisode('ep1')
      expect(item?.progress).toBe(0.5)
      expect(item?.currentTime).toBe(500)
    })

    it('should auto-remove when progress >= 0.98', async () => {
      await manager.recordHistory(hist({ episodeId: 'ep1', currentTime: 100 }))
      await manager.updateProgress('ep1', 990, 1000)
      expect(manager.getByEpisode('ep1')).toBeNull()
    })

    it('should noop for unknown episodeId', async () => {
      await expect(manager.updateProgress('unknown', 500, 1000)).resolves.not.toThrow()
    })
  })

  describe('removeHistory() / clearHistory()', () => {
    it('should remove single entry', async () => {
      await manager.recordHistory(hist({ episodeId: 'ep1' }))
      await manager.removeHistory('ep1')
      expect(manager.getHistory()).toHaveLength(0)
    })

    it('should clear all', async () => {
      await manager.recordHistory(hist({ episodeId: 'ep1' }))
      await manager.recordHistory(hist({ episodeId: 'ep2', id: 'h2' }))
      await manager.clearHistory()
      expect(manager.getHistory()).toHaveLength(0)
    })
  })

  describe('getHistory()', () => {
    it('should sort by lastWatchedAt DESC', async () => {
      // recordHistory 内部会设置 lastWatchedAt = Date.now()
      // 所以先后记录的条目自然有先后顺序
      await manager.recordHistory(hist({ episodeId: 'a' }))
      // 短暂延迟确保时间戳不同
      await new Promise(r => setTimeout(r, 5))
      await manager.recordHistory(hist({ episodeId: 'b', id: 'h2' }))
      const items = manager.getHistory()
      expect(items[0].episodeId).toBe('b') // b 更新
    })
  })

  describe('search()', () => {
    it('should filter by title', async () => {
      await manager.recordHistory(hist({ episodeId: 'a', title: 'Naruto' }))
      await manager.recordHistory(hist({ episodeId: 'b', id: 'h2', title: 'Bleach' }))
      expect(manager.search('nar')).toHaveLength(1)
    })
  })
})
