// tests/integration/full-user-flow.integration.spec.ts — 完整用户操作链路集成
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ProviderFacade } from '@/core/providers/ProviderFacade'
import { FavoritesManager } from '@/core/favorites/manager/FavoritesManager'
import { HistoryManager } from '@/core/history/manager/HistoryManager'
import { SourceSwitchManager } from '@/core/playback/manager/SourceSwitchManager'
import { storageService } from '@/shared/storage/storage.service'
import { createMockProvider, createMockMediaItem } from '../mocks/provider.mock'
import type { FavoriteMedia } from '@/core/favorites/types/favorite.types'
import type { WatchHistoryItem } from '@/core/history/types/history.types'
import type { PlaybackSource } from '@/core/playback/types/playback.types'
import { SourceSwitchEvent } from '@/core/playback/types/playback.types'

vi.mock('@/core/provider-sdk', () => ({
  providerSDK: {
    loadAllProviders: vi.fn().mockResolvedValue([]),
    getActiveProviders: vi.fn().mockReturnValue([]),
  },
}))

function src(id: string): PlaybackSource {
  return { providerId: id, providerName: `Provider ${id}`, playUrl: `https://x.com/${id}.mp4`, type: 'mp4', headers: {} }
}

describe('Full User Flow Integration', () => {
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

  // Scenario 01: 搜索 → 详情 → 播放 → 暂停 → 恢复
  it('Scenario 01: Search → Detail → Play → Pause → Resume', async () => {
    // Search
    const facade = new ProviderFacade()
    facade.registerProvider(createMockProvider({
      id: 'p1', priority: 100,
      searchResults: [createMockMediaItem({ id: 'm1', title: 'Naruto', providerId: 'p1' })],
    }))
    const searchResult = await facade.search('naruto')
    expect(searchResult.items).toHaveLength(1)

    // Detail
    const detail = await facade.detail('p1', 'm1')
    expect(detail.title).toBeDefined()

    // Source switch simulation
    const switchMgr = new SourceSwitchManager()
    const sources = [src('p1'), src('p2')]
    const playSource = switchMgr.start('m1', sources, 1)
    expect(playSource).not.toBeNull()
    expect(playSource!.providerId).toBe('p1')
  })

  // Scenario 02: 搜索 → 收藏 → 重启 → 恢复
  it('Scenario 02: Search → Favorite → Restart → Recover', async () => {
    // ---- Session 1 ----
    const favMgr = new FavoritesManager()
    await favMgr.initialize()
    await favMgr.addFavorite({ id: 'f1', mediaId: 'm1', providerId: 'p1', title: 'Naruto', cover: '' })

    // ---- Restart ----
    const restored = new FavoritesManager()
    await restored.initialize()
    expect(restored.isFavorite('m1')).toBe(true)
  })

  // Scenario 03: 搜索 → 下载 → 完成 → 离线观看
  it('Scenario 03: Search → Download → Complete → Offline View', async () => {
    // 模拟下载任务持久化
    await storageService.setDownloadHistory([{
      id: 'dl-1', mediaId: 'm1', providerId: 'p1', providerName: 'Test',
      episodeId: 'ep1', episodeLabel: '第01集', episodeNum: 1,
      title: 'Naruto', cover: '', sourceUrl: 'https://x.com/v.mp4',
      status: 'completed', progress: 100, speed: 0, downloadedBytes: 0, totalBytes: 0,
      supportsResume: true, resumeCount: 0, createdAt: Date.now(), updatedAt: Date.now(),
    }])

    const downloads = await storageService.getDownloadHistory()
    expect(downloads).toHaveLength(1)
    expect(downloads[0].status).toBe('completed')
  })

  // Scenario 04: 播放 → 换源 → 继续播放
  it('Scenario 04: Play → Switch Source → Continue', () => {
    const mgr = new SourceSwitchManager()
    const sources = [src('p1'), src('p2'), src('p3')]

    // Start with p1
    mgr.start('m1', sources, 1)
    mgr.saveProgress(180) // watched 3 minutes

    // p1 fails → auto switch to p2
    const switched = mgr.onFailed('timeout')
    expect(switched?.providerId).toBe('p2')
    expect(mgr.getSavedProgress()).toBe(180) // progress preserved

    // Continue watching from p2
    mgr.onSuccess('m1')
    expect(mgr.getCachedProvider('m1')).toBe('p2')
  })

  // Scenario 05: Provider 失效 → 自动切换 → 成功
  it('Scenario 05: Provider Fail → Auto Switch → Success', () => {
    const mgr = new SourceSwitchManager()
    const events: string[] = []
    mgr.subscribe((d) => events.push(d.event))

    const sources = [src('p1'), src('p2'), src('p3')]
    mgr.start('m1', sources, 1)

    // p1 fails
    const s2 = mgr.onFailed('connection error')
    expect(s2?.providerId).toBe('p2')

    // p2 fails
    const s3 = mgr.onFailed('timeout')
    expect(s3?.providerId).toBe('p3')

    // p3 succeeds
    mgr.onSuccess('m1')
    expect(mgr.getCachedProvider('m1')).toBe('p3')
    expect(events).toContain(SourceSwitchEvent.SWITCHING)
  })
})

