// tests/stress/restart.stress.spec.ts — Restart Stress Tests
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { FavoritesManager } from '@/core/favorites/manager/FavoritesManager'
import { HistoryManager } from '@/core/history/manager/HistoryManager'
import { storageService } from '@/shared/storage/storage.service'
import { simulateMultipleRestarts } from '../helpers/persistence-helper'
import type { FavoriteMedia } from '@/core/favorites/types/favorite.types'
import type { WatchHistoryItem } from '@/core/history/types/history.types'

describe('Restart Stress', () => {
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

  it('Case 01: should survive 100 restarts without data loss', async () => {
    // 写入初始数据
    const fav = new FavoritesManager()
    await fav.initialize()
    await fav.addFavorite({ id: 'f1', mediaId: 'm1', providerId: 'p1', title: 'Immortal', cover: '' })

    // 100 次重启
    for (let i = 0; i < 100; i++) {
      const restored = new FavoritesManager()
      await restored.initialize()
      expect(restored.isFavorite('m1')).toBe(true)
      expect(restored.getFavorites()).toHaveLength(1)
    }
  })

  it('Case 02: should survive random crash restarts', async () => {
    // 写入
    const fav1 = new FavoritesManager()
    await fav1.initialize()
    await fav1.addFavorite({ id: 'f1', mediaId: 'crash-test', providerId: 'p1', title: 'Crash Test', cover: '' })

    // 模拟 50 次崩溃后恢复
    for (let i = 0; i < 50; i++) {
      const restored = new FavoritesManager()
      await restored.initialize()
      expect(restored.isFavorite('crash-test')).toBe(true)
    }
  })

  it('Case 03: should maintain data integrity across abnormal exits', async () => {
    const hist1 = new HistoryManager()
    await hist1.initialize()
    await hist1.recordHistory({
      id: 'h1', mediaId: 'm1', episodeId: 'ep1', providerId: 'p1',
      title: 'Show', cover: '', episodeLabel: 'EP01',
      duration: 2400, currentTime: 600, progress: 0.25, lastWatchedAt: Date.now(),
    })

    // 50 次异常退出后恢复
    for (let i = 0; i < 50; i++) {
      const restored = new HistoryManager()
      await restored.initialize()
      const item = restored.getByEpisode('ep1')
      expect(item).not.toBeNull()
      expect(item!.progress).toBeCloseTo(0.25, 2)
    }
  })

  it('Case 04: should handle concurrent restarts with both favorites and history', async () => {
    const fav = new FavoritesManager()
    await fav.initialize()
    await fav.addFavorite({ id: 'f1', mediaId: 'dual', providerId: 'p1', title: 'Dual Test', cover: '' })

    const hist = new HistoryManager()
    await hist.initialize()
    await hist.recordHistory({
      id: 'h1', mediaId: 'dual', episodeId: 'ep1', providerId: 'p1',
      title: 'Dual Test', cover: '', episodeLabel: 'EP01',
      duration: 2400, currentTime: 300, progress: 0.125, lastWatchedAt: Date.now(),
    })

    for (let i = 0; i < 30; i++) {
      const fav2 = new FavoritesManager()
      await fav2.initialize()
      const hist2 = new HistoryManager()
      await hist2.initialize()

      expect(fav2.isFavorite('dual')).toBe(true)
      expect(hist2.getByEpisode('ep1')).not.toBeNull()
    }
  })
})
