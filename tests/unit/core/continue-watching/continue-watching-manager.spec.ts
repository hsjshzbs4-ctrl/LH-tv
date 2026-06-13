// tests/unit/core/continue-watching/continue-watching-manager.spec.ts — ContinueWatchingManager 单元测试
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ContinueWatchingManager } from '@/core/continue-watching/manager/ContinueWatchingManager'
import { historyFacade } from '@/core/history'
import type { WatchHistoryItem } from '@/core/history/types/history.types'

vi.mock('@/core/history', () => ({
  historyFacade: {
    initialize: vi.fn().mockResolvedValue(undefined),
    getHistory: vi.fn().mockReturnValue([]),
    subscribe: vi.fn(() => () => {}),
  },
}))

function hist(overrides: Partial<WatchHistoryItem> = {}): WatchHistoryItem {
  return {
    id: 'h1', mediaId: 'm1', episodeId: 'ep1', providerId: 'p1',
    title: 'Test', cover: '', episodeLabel: '第01集',
    duration: 2400, currentTime: 600, progress: 0.25, lastWatchedAt: Date.now(),
    ...overrides,
  }
}

describe('ContinueWatchingManager', () => {
  let manager: ContinueWatchingManager

  beforeEach(() => { manager = new ContinueWatchingManager() })
  afterEach(() => { vi.clearAllMocks() })

  describe('refresh()', () => {
    it('should deduplicate by mediaId (keep most recent)', () => {
      const now = Date.now()
      vi.mocked(historyFacade.getHistory).mockReturnValue([
        hist({ mediaId: 'm1', episodeId: 'ep1', lastWatchedAt: now - 1000 }),
        hist({ mediaId: 'm1', episodeId: 'ep2', id: 'h2', lastWatchedAt: now }),
      ])
      manager.refresh()
      const items = manager.getContinueWatching()
      expect(items).toHaveLength(1)
      expect(items[0].episodeId).toBe('ep2') // 最新的
    })

    it('should filter out progress=0', () => {
      vi.mocked(historyFacade.getHistory).mockReturnValue([
        hist({ mediaId: 'm1', progress: 0 }),
      ])
      manager.refresh()
      expect(manager.getContinueWatching()).toHaveLength(0)
    })

    it('should filter out progress >= 0.98', () => {
      vi.mocked(historyFacade.getHistory).mockReturnValue([
        hist({ mediaId: 'm1', progress: 0.99 }),
      ])
      manager.refresh()
      expect(manager.getContinueWatching()).toHaveLength(0)
    })

    it('should keep progress in (0, 0.98) range', () => {
      vi.mocked(historyFacade.getHistory).mockReturnValue([
        hist({ mediaId: 'm1', progress: 0.5 }),
        hist({ mediaId: 'm2', id: 'h2', progress: 0.01 }),
      ])
      manager.refresh()
      expect(manager.getContinueWatching()).toHaveLength(2)
    })
  })

  describe('getContinueWatching()', () => {
    it('should limit to 20 items', () => {
      const items = Array.from({ length: 25 }, (_, i) =>
        hist({ mediaId: `m${i}`, episodeId: `ep${i}`, id: `h${i}`, lastWatchedAt: i * 100 })
      )
      vi.mocked(historyFacade.getHistory).mockReturnValue(items)
      manager.refresh()
      expect(manager.getContinueWatching()).toHaveLength(20)
    })

    it('should sort by lastWatchedAt DESC', () => {
      vi.mocked(historyFacade.getHistory).mockReturnValue([
        hist({ mediaId: 'older', episodeId: 'a', lastWatchedAt: 1000 }),
        hist({ mediaId: 'newer', episodeId: 'b', id: 'h2', lastWatchedAt: 2000 }),
      ])
      manager.refresh()
      const items = manager.getContinueWatching()
      expect(items[0].mediaId).toBe('newer')
    })
  })

  describe('getByMedia()', () => {
    it('should return item by mediaId', () => {
      vi.mocked(historyFacade.getHistory).mockReturnValue([
        hist({ mediaId: 'm1', episodeId: 'ep1' }),
      ])
      manager.refresh()
      expect(manager.getByMedia('m1')).not.toBeNull()
      expect(manager.getByMedia('missing')).toBeNull()
    })
  })

  describe('subscribe()', () => {
    it('should return unsubscribe function', () => {
      const unsub = manager.subscribe(() => {})
      expect(typeof unsub).toBe('function')
      unsub()
    })
  })
})
