// tests/integration/history-flow.integration.spec.ts — History + ContinueWatching 集成
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { HistoryManager } from '@/core/history/manager/HistoryManager'
import { storageService } from '@/shared/storage/storage.service'
import type { WatchHistoryItem } from '@/core/history/types/history.types'

function hist(episodeId: string, overrides: Partial<WatchHistoryItem> = {}): WatchHistoryItem {
  return {
    id: `h-${episodeId}`, mediaId: `m-${episodeId}`, episodeId, providerId: 'p1',
    title: `Show ${episodeId}`, cover: '', episodeLabel: `EP${episodeId}`,
    duration: 2400, currentTime: 0, progress: 0, lastWatchedAt: Date.now(),
    ...overrides,
  }
}

describe('History Integration Flow', () => {
  let persistedData: WatchHistoryItem[] = []

  beforeEach(() => {
    persistedData = []
    vi.spyOn(storageService, 'getHistory').mockImplementation(async () => [...persistedData])
    vi.spyOn(storageService, 'setHistory').mockImplementation(async (items: WatchHistoryItem[]) => {
      persistedData = [...items]
    })
  })

  afterEach(() => { vi.restoreAllMocks() })

  // Case 01: Play → History → Storage
  it('Case 01: should flow from play to history to storage', async () => {
    const mgr = new HistoryManager()
    await mgr.initialize()
    await mgr.recordHistory(hist('ep1', { currentTime: 300, progress: 0.125 }))
    await mgr.recordHistory(hist('ep2', { currentTime: 600, progress: 0.25 }))

    // 验证持久化数据
    expect(persistedData).toHaveLength(2)
    expect(persistedData.find(i => i.episodeId === 'ep1')?.progress).toBeCloseTo(0.125, 3)
  })

  // Case 02: Resume → ContinueWatching integration
  it('Case 02: should generate continue-watching data from history', async () => {
    const mgr = new HistoryManager()
    await mgr.initialize()
    await mgr.recordHistory(hist('ep1', { mediaId: 'm1', progress: 0.42, lastWatchedAt: Date.now() }))
    await mgr.recordHistory(hist('ep2', { mediaId: 'm2', progress: 0.01, lastWatchedAt: Date.now() - 1000 }))

    // 从 history 构建 continue-watching 数据
    const histories = mgr.getHistory()
    const continueWatching = histories
      .filter(h => h.progress > 0 && h.progress < 0.98)
      .sort((a, b) => b.lastWatchedAt - a.lastWatchedAt)

    expect(continueWatching).toHaveLength(2)
    expect(continueWatching[0].mediaId).toBe('m1') // 最新
  })

  // Case 03: Delete → sync update
  it('Case 03: should sync deletion to storage', async () => {
    const mgr = new HistoryManager()
    await mgr.initialize()
    await mgr.recordHistory(hist('ep1'))
    await mgr.recordHistory(hist('ep2'))

    await mgr.removeHistory('ep1')

    // Storage 应同步
    expect(persistedData).toHaveLength(1)
    expect(persistedData[0].episodeId).toBe('ep2')
  })

  // 进度更新流程
  it('should update progress and notify', async () => {
    const mgr = new HistoryManager()
    await mgr.initialize()
    await mgr.recordHistory(hist('ep1', { currentTime: 100, duration: 1000 }))

    await mgr.updateProgress('ep1', 500, 1000)
    const item = mgr.getByEpisode('ep1')
    expect(item?.progress).toBe(0.5)
  })

  // 自动清理已完成
  it('should auto-cleanup completed items', async () => {
    const mgr = new HistoryManager()
    await mgr.initialize()
    await mgr.recordHistory(hist('ep1', { currentTime: 100 }))

    await mgr.updateProgress('ep1', 990, 1000) // 99% → 清理
    expect(mgr.getByEpisode('ep1')).toBeNull()
  })
})
