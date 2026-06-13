// tests/persistence/history.persistence.spec.ts — 观看历史持久化验证
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { HistoryManager } from '@/core/history/manager/HistoryManager'
import { storageService } from '@/shared/storage/storage.service'
import { simulateRestart, simulateMultipleRestarts } from '../helpers/persistence-helper'
import type { WatchHistoryItem } from '@/core/history/types/history.types'

function hist(episodeId: string, overrides: Partial<WatchHistoryItem> = {}): WatchHistoryItem {
  return {
    id: `h-${episodeId}`, mediaId: `m-${episodeId}`, episodeId, providerId: 'p1',
    title: `Show ${episodeId}`, cover: '', episodeLabel: `EP${episodeId}`,
    duration: 2400, currentTime: 0, progress: 0, lastWatchedAt: Date.now(),
    ...overrides,
  }
}

describe('History Persistence', () => {
  let persistedData: WatchHistoryItem[] = []

  beforeEach(() => {
    persistedData = []
    vi.spyOn(storageService, 'getHistory').mockImplementation(async () => [...persistedData])
    vi.spyOn(storageService, 'setHistory').mockImplementation(async (items: WatchHistoryItem[]) => {
      persistedData = [...items]
    })
  })

  afterEach(() => { vi.restoreAllMocks() })

  // ==================== Case 01: 播放记录恢复 ====================
  it('Case 01: should restore watch history after restart', async () => {
    const restored = await simulateRestart(
      () => new HistoryManager(),
      async (mgr) => {
        await mgr.initialize()
        await mgr.recordHistory(hist('ep1'))
        await mgr.recordHistory(hist('ep2'))
      },
    )

    await restored.initialize()
    expect(restored.getHistory()).toHaveLength(2)
  })

  // ==================== Case 02: 进度恢复 ====================
  it('Case 02: should restore progress at various levels', async () => {
    const restored = await simulateRestart(
      () => new HistoryManager(),
      async (mgr) => {
        await mgr.initialize()
        await mgr.recordHistory(hist('ep1', { currentTime: 0, progress: 0 }))
        await mgr.recordHistory(hist('ep2', { currentTime: 840, duration: 2400, progress: 0.35 }))
        await mgr.recordHistory(hist('ep3', { currentTime: 1920, duration: 2400, progress: 0.80 }))
      },
    )

    await restored.initialize()
    const items = restored.getHistory()
    const ep2 = items.find(i => i.episodeId === 'ep2')
    const ep3 = items.find(i => i.episodeId === 'ep3')
    expect(ep2?.progress).toBeCloseTo(0.35, 2)
    expect(ep3?.progress).toBeCloseTo(0.80, 2)
  })

  // ==================== Case 03: 排序恢复 ====================
  it('Case 03: should preserve lastWatchedAt sort order', async () => {
    const manager = new HistoryManager()
    await manager.initialize()
    await manager.recordHistory(hist('a', { lastWatchedAt: 1000 }))
    await new Promise(r => setTimeout(r, 10))
    await manager.recordHistory(hist('b', { lastWatchedAt: 2000 }))

    // 销毁并重建
    const restored = new HistoryManager()
    await restored.initialize()
    const items = restored.getHistory()
    expect(items[0].episodeId).toBe('b') // 最新在前
  })

  // ==================== Case 04: 删除恢复 ====================
  it('Case 04: should persist deletions after restart', async () => {
    await simulateRestart(
      () => new HistoryManager(),
      async (mgr) => {
        await mgr.initialize()
        await mgr.recordHistory(hist('ep1'))
        await mgr.recordHistory(hist('ep2'))
        await mgr.removeHistory('ep1')
      },
    )

    const restored = new HistoryManager()
    await restored.initialize()
    expect(restored.getHistory()).toHaveLength(1)
    expect(restored.getByEpisode('ep1')).toBeNull()
    expect(restored.getByEpisode('ep2')).not.toBeNull()
  })

  // ==================== Case 05: 大量历史恢复 ====================
  it('Case 05: should restore 200 history items', async () => {
    const restored = await simulateRestart(
      () => new HistoryManager(),
      async (mgr) => {
        await mgr.initialize()
        for (let i = 0; i < 200; i++) {
          await mgr.recordHistory(hist(`ep${i}`, { lastWatchedAt: Date.now() + i }))
        }
      },
    )

    await restored.initialize()
    expect(restored.getHistory()).toHaveLength(200)
  })

  // ==================== 10 次连续重启 ====================
  it('should survive 10 consecutive restarts', async () => {
    await simulateMultipleRestarts(
      () => new HistoryManager(),
      async (mgr) => {
        await mgr.initialize()
        await mgr.recordHistory(hist('ep1', { currentTime: 600, progress: 0.25 }))
      },
      async (mgr) => {
        await mgr.initialize()
        const item = mgr.getByEpisode('ep1')
        expect(item).not.toBeNull()
        expect(item!.progress).toBeCloseTo(0.25, 2)
      },
      10,
    )
  })
})
