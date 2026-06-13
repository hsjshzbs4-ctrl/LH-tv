// tests/persistence/persistence-recovery.spec.ts — 统一恢复验证
// 模拟真实应用生命周期: 收藏→观看→下载→退出→重启
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { FavoritesManager } from '@/core/favorites/manager/FavoritesManager'
import { HistoryManager } from '@/core/history/manager/HistoryManager'
import { storageService } from '@/shared/storage/storage.service'
import { simulateRestart, simulateCrashRestart, simulateMultipleRestarts } from '../helpers/persistence-helper'
import type { FavoriteMedia } from '@/core/favorites/types/favorite.types'
import type { WatchHistoryItem } from '@/core/history/types/history.types'
import type { DownloadTask } from '@/core/download/types/download.types'
import type { OfflineMedia } from '@/core/offline/types/offline.types'

describe('Unified Persistence Recovery', () => {
  // 共享持久化存储
  let userData: {
    favorites: FavoriteMedia[]
    history: WatchHistoryItem[]
    downloads: DownloadTask[]
    offline: OfflineMedia[]
    playbackPositions: Record<string, unknown>
    searchHistory: Array<{ keyword: string; searchedAt: number }>
    settings: Record<string, unknown>
  }

  beforeEach(() => {
    userData = {
      favorites: [],
      history: [],
      downloads: [],
      offline: [],
      playbackPositions: {},
      searchHistory: [],
      settings: {},
    }

    // Mock 完整 storageService
    vi.spyOn(storageService, 'load').mockImplementation(async () => ({ ...userData }))
    vi.spyOn(storageService, 'getFavorites').mockImplementation(async () => [...userData.favorites])
    vi.spyOn(storageService, 'setFavorites').mockImplementation(async (items: FavoriteMedia[]) => {
      userData.favorites = [...items]
    })
    vi.spyOn(storageService, 'getHistory').mockImplementation(async () => [...userData.history])
    vi.spyOn(storageService, 'setHistory').mockImplementation(async (items: WatchHistoryItem[]) => {
      userData.history = [...items]
    })
    vi.spyOn(storageService, 'getDownloadHistory').mockImplementation(async () => [...userData.downloads])
    vi.spyOn(storageService, 'setDownloadHistory').mockImplementation(async (items: DownloadTask[]) => {
      userData.downloads = [...items]
    })
    vi.spyOn(storageService, 'getOfflineLibrary').mockImplementation(async () => [...userData.offline])
    vi.spyOn(storageService, 'setOfflineLibrary').mockImplementation(async (items: OfflineMedia[]) => {
      userData.offline = [...items]
    })
  })

  afterEach(() => { vi.restoreAllMocks() })

  // ==================== Scenario 01: 正常生命周期 ====================
  it('Scenario 01: should survive normal lifecycle (favorite → watch → download → restart)', async () => {
    // ---- 会话 1 ----
    const favMgr1 = new FavoritesManager()
    await favMgr1.initialize()
    await favMgr1.addFavorite({ id: 'f1', mediaId: 'm1', providerId: 'p1', title: 'Show A', cover: '' })

    const histMgr1 = new HistoryManager()
    await histMgr1.initialize()
    await histMgr1.recordHistory({
      id: 'h1', mediaId: 'm1', episodeId: 'ep1', providerId: 'p1',
      title: 'Show A', cover: '', episodeLabel: '第01集',
      duration: 2400, currentTime: 600, progress: 0.25, lastWatchedAt: Date.now(),
    })

    // ---- 重启 ----
    const favMgr2 = new FavoritesManager()
    await favMgr2.initialize()
    expect(favMgr2.isFavorite('m1')).toBe(true)

    const histMgr2 = new HistoryManager()
    await histMgr2.initialize()
    const hist = histMgr2.getByEpisode('ep1')
    expect(hist).not.toBeNull()
    expect(hist!.progress).toBeCloseTo(0.25, 2)
  })

  // ==================== Scenario 02: 崩溃恢复 ====================
  it('Scenario 02: should survive crash (favorite + downloading + playing → crash → recover)', async () => {
    // ---- 使用中崩溃 ----
    const favMgr = new FavoritesManager()
    await favMgr.initialize()
    await favMgr.addFavorite({ id: 'f1', mediaId: 'm1', providerId: 'p1', title: 'Crash Test', cover: '' })

    // 下载中的任务
    await storageService.setDownloadHistory([{
      id: 'dl-1', mediaId: 'm1', providerId: 'p1', providerName: 'Test',
      episodeId: 'ep1', episodeLabel: '第01集', episodeNum: 1,
      title: 'Crash Test', cover: '', sourceUrl: 'https://x.com/v.mp4',
      status: 'downloading', progress: 35, speed: 0, downloadedBytes: 0, totalBytes: 0,
      supportsResume: true, resumeCount: 0, createdAt: Date.now(), updatedAt: Date.now(),
    }])

    // ---- 崩溃（不经过正常销毁） ----
    // ---- 恢复 ----
    const favMgr2 = new FavoritesManager()
    await favMgr2.initialize()
    expect(favMgr2.isFavorite('m1')).toBe(true)

    const downloads = await storageService.getDownloadHistory()
    expect(downloads).toHaveLength(1)
    expect(downloads[0].status).toBe('downloading')
  })

  // ==================== Scenario 03: 连续 10 次重启 ====================
  it('Scenario 03: should survive 10 consecutive restarts without data loss', async () => {
    // 写入初始数据
    const favMgr = new FavoritesManager()
    await favMgr.initialize()
    await favMgr.addFavorite({ id: 'f1', mediaId: 'm1', providerId: 'p1', title: 'Immortal', cover: '' })

    // 连续重启 10 次
    for (let i = 0; i < 10; i++) {
      const restored = new FavoritesManager()
      await restored.initialize()
      expect(restored.isFavorite('m1')).toBe(true)
      expect(restored.getFavorites()).toHaveLength(1)
    }
  })

  // ==================== Scenario 04: 异常退出 → 自动恢复 ====================
  it('Scenario 04: should auto-recover from abnormal exit', async () => {
    // 写入多类型数据
    const favMgr = new FavoritesManager()
    await favMgr.initialize()
    await favMgr.addFavorite({ id: 'f1', mediaId: 'm1', providerId: 'p1', title: 'Show', cover: '' })

    const histMgr = new HistoryManager()
    await histMgr.initialize()
    await histMgr.recordHistory({
      id: 'h1', mediaId: 'm1', episodeId: 'ep1', providerId: 'p1',
      title: 'Show', cover: '', episodeLabel: '第01集',
      duration: 2400, currentTime: 300, progress: 0.125, lastWatchedAt: Date.now(),
    })

    // 模拟异常退出（不调用 destroy）
    // 重组后应自动恢复
    const favMgr2 = new FavoritesManager()
    await favMgr2.initialize()
    const histMgr2 = new HistoryManager()
    await histMgr2.initialize()

    expect(favMgr2.isFavorite('m1')).toBe(true)
    expect(histMgr2.getByEpisode('ep1')).not.toBeNull()
  })

  // ==================== 并发写入安全性 ====================
  it('should not lose data with concurrent writes', async () => {
    const favMgr = new FavoritesManager()
    await favMgr.initialize()

    // 并发添加
    await Promise.all([
      favMgr.addFavorite({ id: 'f1', mediaId: 'm1', providerId: 'p1', title: 'A', cover: '' }),
      favMgr.addFavorite({ id: 'f2', mediaId: 'm2', providerId: 'p1', title: 'B', cover: '' }),
      favMgr.addFavorite({ id: 'f3', mediaId: 'm3', providerId: 'p1', title: 'C', cover: '' }),
    ])

    expect(favMgr.getFavorites()).toHaveLength(3)

    // 重建后
    const restored = new FavoritesManager()
    await restored.initialize()
    expect(restored.getFavorites()).toHaveLength(3)
  })
})
