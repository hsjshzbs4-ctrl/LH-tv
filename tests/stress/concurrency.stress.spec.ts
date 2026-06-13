// tests/stress/concurrency.stress.spec.ts — Concurrency Stress Tests
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { FavoritesManager } from '@/core/favorites/manager/FavoritesManager'
import { HistoryManager } from '@/core/history/manager/HistoryManager'
import { MetricsCollector } from '@/core/monitoring/metrics/MetricsCollector'
import { ProviderRegistry } from '@/core/providers'
import { createMockProvider } from '../mocks/provider.mock'
import { storageService } from '@/shared/storage/storage.service'
import type { FavoriteMedia } from '@/core/favorites/types/favorite.types'
import type { WatchHistoryItem } from '@/core/history/types/history.types'

describe('Concurrency Stress', () => {
  let persistedFavs: FavoriteMedia[] = []
  let persistedHist: WatchHistoryItem[] = []

  beforeEach(() => {
    persistedFavs = []
    persistedHist = []
    vi.spyOn(storageService, 'getFavorites').mockImplementation(async () => [...persistedFavs])
    vi.spyOn(storageService, 'setFavorites').mockImplementation(async (items: FavoriteMedia[]) => { persistedFavs = [...items] })
    vi.spyOn(storageService, 'getHistory').mockImplementation(async () => [...persistedHist])
    vi.spyOn(storageService, 'setHistory').mockImplementation(async (items: WatchHistoryItem[]) => { persistedHist = [...items] })
  })

  afterEach(() => { vi.restoreAllMocks() })

  it('should handle concurrent favorites additions', async () => {
    const mgr = new FavoritesManager()
    await mgr.initialize()

    const promises = Array.from({ length: 100 }, (_, i) =>
      mgr.addFavorite({ id: `f-${i}`, mediaId: `m-${i}`, providerId: 'p1', title: `Concurrent ${i}`, cover: '' })
    )
    await Promise.all(promises)

    expect(mgr.getFavorites()).toHaveLength(100)
  })

  it('should handle concurrent history recordings', async () => {
    const mgr = new HistoryManager()
    await mgr.initialize()

    const promises = Array.from({ length: 100 }, (_, i) =>
      mgr.recordHistory({
        id: `h-${i}`, mediaId: `m-${i}`, episodeId: `ep-${i}`, providerId: 'p1',
        title: `Show ${i}`, cover: '', episodeLabel: `EP${i}`,
        duration: 2400, currentTime: i * 10, progress: i / 100, lastWatchedAt: Date.now() + i,
      })
    )
    await Promise.all(promises)
    expect(mgr.getHistory()).toHaveLength(100)
  })

  it('should handle concurrent metrics recording', () => {
    const collector = new MetricsCollector()
    const promises = Array.from({ length: 500 }, (_, i) => {
      collector.increment('concurrent.ops')
      collector.record('concurrent.value', i)
    })
    expect(collector.getCount('concurrent.ops')).toBe(500)
  })

  it('should interleave search + favorites + history + metrics without errors', async () => {
    const favMgr = new FavoritesManager()
    await favMgr.initialize()
    const histMgr = new HistoryManager()
    await histMgr.initialize()
    const metrics = new MetricsCollector()

    for (let round = 0; round < 50; round++) {
      // 交错操作
      await favMgr.addFavorite({ id: `f-${round}`, mediaId: `m-${round}`, providerId: 'p1', title: `S${round}`, cover: '' })
      await histMgr.recordHistory({
        id: `h-${round}`, mediaId: `m-${round}`, episodeId: `ep-${round}`, providerId: 'p1',
        title: `S${round}`, cover: '', episodeLabel: 'EP01',
        duration: 2400, currentTime: round * 10, progress: round / 2400, lastWatchedAt: Date.now(),
      })
      metrics.increment('rounds')

      if (round % 5 === 0) {
        await favMgr.removeFavorite(`m-${round - 5}`)
        await histMgr.removeHistory(`ep-${round - 5}`)
      }
    }

    expect(metrics.getCount('rounds')).toBe(50)
    expect(favMgr.getFavorites().length).toBeGreaterThan(0)
    expect(histMgr.getHistory().length).toBeGreaterThan(0)
  })

  it('should not deadlock with concurrent read/write on same manager', async () => {
    const mgr = new FavoritesManager()
    await mgr.initialize()

    // 同时读写
    const writes = Array.from({ length: 20 }, (_, i) =>
      mgr.addFavorite({ id: `rw-${i}`, mediaId: `rwm-${i}`, providerId: 'p1', title: `RW ${i}`, cover: '' })
    )
    const reads = Array.from({ length: 20 }, () =>
      Promise.resolve(mgr.getFavorites())
    )

    await Promise.all([...writes, ...reads])
    expect(mgr.getFavorites().length).toBeGreaterThanOrEqual(20)
  })
})
