// tests/unit/content/history-service.spec.ts — HistoryService 单元测试
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { HistoryService } from '@/content/historyService'
import { historyFacade } from '@/core/history'

vi.mock('@/core/history', () => ({
  historyFacade: {
    recordHistory: vi.fn(),
    updateProgress: vi.fn(),
    removeHistory: vi.fn(),
    clearHistory: vi.fn(),
    getHistory: vi.fn(),
    getByEpisode: vi.fn(),
    search: vi.fn(),
    subscribe: vi.fn(),
  },
}))

function makeMediaItem(overrides: Record<string, unknown> = {}) {
  return {
    id: 'm1', title: 'Test', cover: '', providerId: 'p1', providerName: 'TestP', type: 'tv' as const,
    ...overrides,
  }
}

function makeEpisode(overrides: Record<string, unknown> = {}) {
  return { id: 'ep1', title: '第1集', episodeNumber: 1, ...overrides }
}

describe('HistoryService', () => {
  let service: HistoryService

  beforeEach(() => {
    service = new HistoryService()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('recordHistory()', () => {
    it('should build WatchHistoryItem and call facade', async () => {
      vi.mocked(historyFacade.recordHistory).mockResolvedValue()
      await service.recordHistory(makeMediaItem(), makeEpisode(), 600, 1200)
      expect(historyFacade.recordHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          mediaId: 'm1',
          episodeId: 'ep1',
          currentTime: 600,
          duration: 1200,
          progress: 0.5,
        })
      )
    })

    it('should cap progress at 1', async () => {
      vi.mocked(historyFacade.recordHistory).mockResolvedValue()
      await service.recordHistory(makeMediaItem(), makeEpisode(), 2000, 1000)
      const callArgs = vi.mocked(historyFacade.recordHistory).mock.calls[0][0]
      expect(callArgs.progress).toBe(1)
    })
  })

  describe('updateProgress()', () => {
    it('should delegate to facade', async () => {
      vi.mocked(historyFacade.updateProgress).mockResolvedValue()
      await service.updateProgress('ep1', 300, 1200)
      expect(historyFacade.updateProgress).toHaveBeenCalledWith('ep1', 300, 1200)
    })
  })

  describe('removeHistory()', () => {
    it('should delegate to facade', async () => {
      vi.mocked(historyFacade.removeHistory).mockResolvedValue()
      await service.removeHistory('ep1')
      expect(historyFacade.removeHistory).toHaveBeenCalledWith('ep1')
    })
  })

  describe('clearHistory()', () => {
    it('should delegate to facade', async () => {
      vi.mocked(historyFacade.clearHistory).mockResolvedValue()
      await service.clearHistory()
      expect(historyFacade.clearHistory).toHaveBeenCalled()
    })
  })

  describe('getHistory()', () => {
    it('should return facade history', () => {
      vi.mocked(historyFacade.getHistory).mockReturnValue([])
      expect(service.getHistory()).toEqual([])
    })
  })

  describe('getContinueWatching()', () => {
    it('should deduplicate by mediaId', () => {
      const now = Date.now()
      const items = [
        { id: 'h1', mediaId: 'm1', episodeId: 'e2', providerId: 'p1', title: 'Show A', cover: '', episodeLabel: 'E2', duration: 1200, currentTime: 600, progress: 0.5, lastWatchedAt: now - 1000 },
        { id: 'h2', mediaId: 'm1', episodeId: 'e1', providerId: 'p1', title: 'Show A', cover: '', episodeLabel: 'E1', duration: 1200, currentTime: 300, progress: 0.25, lastWatchedAt: now - 60000 },
        { id: 'h3', mediaId: 'm2', episodeId: 'e1', providerId: 'p1', title: 'Show B', cover: '', episodeLabel: 'E1', duration: 1800, currentTime: 900, progress: 0.5, lastWatchedAt: now - 100 },
      ]
      vi.mocked(historyFacade.getHistory).mockReturnValue(items)
      const cw = service.getContinueWatching()
      expect(cw).toHaveLength(2)
      // Should keep most recent episode per media
      expect(cw.find(i => i.mediaId === 'm1')?.episodeId).toBe('e2')
      expect(cw.find(i => i.mediaId === 'm2')?.episodeId).toBe('e1')
    })
  })

  describe('getPlaybackPosition()', () => {
    it('should return currentTime from history', () => {
      vi.mocked(historyFacade.getByEpisode).mockReturnValue({
        id: 'h1', mediaId: 'm1', episodeId: 'ep1', providerId: 'p1', title: '', cover: '', episodeLabel: '', duration: 1200, currentTime: 450, progress: 0.375, lastWatchedAt: Date.now(),
      })
      expect(service.getPlaybackPosition('ep1')).toBe(450)
    })

    it('should return 0 when no history', () => {
      vi.mocked(historyFacade.getByEpisode).mockReturnValue(null)
      expect(service.getPlaybackPosition('unknown')).toBe(0)
    })
  })

  describe('subscribe()', () => {
    it('should delegate to facade', () => {
      const cb = vi.fn()
      vi.mocked(historyFacade.subscribe).mockReturnValue(() => {})
      const unsub = service.subscribe(cb)
      expect(typeof unsub).toBe('function')
    })
  })
})
