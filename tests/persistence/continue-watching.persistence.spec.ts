// tests/persistence/continue-watching.persistence.spec.ts — 继续观看持久化验证
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

function hist(mediaId: string, episodeId: string, progress: number, lastWatchedAt = Date.now()): WatchHistoryItem {
  return {
    id: `h-${episodeId}`, mediaId, episodeId, providerId: 'p1',
    title: `Show ${mediaId}`, cover: '', episodeLabel: `EP${episodeId}`,
    duration: 2400, currentTime: Math.floor(progress * 2400), progress,
    lastWatchedAt,
  }
}

describe('Continue Watching Persistence', () => {
  beforeEach(() => { vi.clearAllMocks() })
  afterEach(() => { vi.restoreAllMocks() })

  // ==================== Case 01: 中断播放恢复 ====================
  it('Case 01: should restore interrupted playback state', () => {
    vi.mocked(historyFacade.getHistory).mockReturnValue([
      hist('m1', 'ep5', 0.42, Date.now()),
    ])
    const mgr = new ContinueWatchingManager()
    mgr.refresh()
    const items = mgr.getContinueWatching()
    expect(items).toHaveLength(1)
    expect(items[0].mediaId).toBe('m1')
    expect(items[0].episodeId).toBe('ep5')
    expect(items[0].progress).toBeCloseTo(0.42, 2)
  })

  // ==================== Case 02: 多剧集恢复 ====================
  it('Case 02: should restore multiple shows', () => {
    vi.mocked(historyFacade.getHistory).mockReturnValue([
      hist('m1', 'ep3', 0.30, 3000),
      hist('m2', 'ep7', 0.60, 2000),
      hist('m3', 'ep1', 0.10, 1000),
    ])
    const mgr = new ContinueWatchingManager()
    mgr.refresh()
    expect(mgr.getContinueWatching()).toHaveLength(3)
  })

  // ==================== Case 03: 已完成不进入 ====================
  it('Case 03: should exclude completed episodes', () => {
    vi.mocked(historyFacade.getHistory).mockReturnValue([
      hist('m1', 'ep1', 0.50, Date.now()),   // include
      hist('m2', 'ep10', 0.99, Date.now()),  // exclude (>=0.98)
      hist('m3', 'ep1', 0.00, Date.now()),   // exclude (0 progress)
    ])
    const mgr = new ContinueWatchingManager()
    mgr.refresh()
    const items = mgr.getContinueWatching()
    expect(items).toHaveLength(1)
    expect(items[0].mediaId).toBe('m1')
  })

  // ==================== Case 04: 排序恢复 ====================
  it('Case 04: should sort by lastWatchedAt DESC', () => {
    vi.mocked(historyFacade.getHistory).mockReturnValue([
      hist('m1', 'ep1', 0.30, 1000),
      hist('m2', 'ep1', 0.30, 3000),
      hist('m3', 'ep1', 0.30, 2000),
    ])
    const mgr = new ContinueWatchingManager()
    mgr.refresh()
    const items = mgr.getContinueWatching()
    expect(items[0].mediaId).toBe('m2')
    expect(items[1].mediaId).toBe('m3')
    expect(items[2].mediaId).toBe('m1')
  })

  // ==================== Max 20 ====================
  it('should limit to max 20 items', () => {
    const histories = Array.from({ length: 30 }, (_, i) =>
      hist(`m${i}`, `ep1`, 0.30, Date.now() + i)
    )
    vi.mocked(historyFacade.getHistory).mockReturnValue(histories)
    const mgr = new ContinueWatchingManager()
    mgr.refresh()
    expect(mgr.getContinueWatching()).toHaveLength(20)
  })
})
