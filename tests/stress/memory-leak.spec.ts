// tests/stress/memory-leak.spec.ts — Memory Leak Verification
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { FavoritesManager } from '@/core/favorites/manager/FavoritesManager'
import { HistoryManager } from '@/core/history/manager/HistoryManager'
import { MetricsCollector } from '@/core/monitoring/metrics/MetricsCollector'
import { ProviderRegistry } from '@/core/providers'
import { createMockProvider } from '../mocks/provider.mock'
import { storageService } from '@/shared/storage/storage.service'
import type { FavoriteMedia } from '@/core/favorites/types/favorite.types'
import type { WatchHistoryItem } from '@/core/history/types/history.types'

describe('Memory Leak Verification', () => {
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

  it('Map leak: should not grow indefinitely with repeated add/remove cycles', async () => {
    const mgr = new FavoritesManager()
    await mgr.initialize()

    for (let cycle = 0; cycle < 50; cycle++) {
      for (let i = 0; i < 100; i++) {
        await mgr.addFavorite({ id: `f-${i}`, mediaId: `m-${i}`, providerId: 'p1', title: `Show ${i}`, cover: '' })
      }
      for (let i = 0; i < 100; i++) {
        await mgr.removeFavorite(`m-${i}`)
      }
    }
    expect(mgr.getFavorites()).toHaveLength(0)
  })

  it('EventEmitter/Subscriber leak: should not accumulate dead subscribers', async () => {
    const mgr = new FavoritesManager()
    await mgr.initialize()

    // 注册和取消大量订阅者
    const unsubs: Array<() => void> = []
    for (let i = 0; i < 100; i++) {
      const unsub = mgr.subscribe(() => {})
      unsubs.push(unsub)
    }
    // 全部取消
    for (const u of unsubs) u()

    // 添加数据 → 通知已取消的订阅者不应被调用
    let notified = 0
    mgr.subscribe(() => { notified++ })
    await mgr.addFavorite({ id: 'f1', mediaId: 'm1', providerId: 'p1', title: 'Test', cover: '' })
    expect(notified).toBe(1) // 只有最新的活跃订阅者被调用
  })

  it('Metrics buffer: should cap record limit', () => {
    const collector = new MetricsCollector()
    // 写入超过 MAX_RECORDS
    for (let i = 0; i < 15000; i++) {
      collector.record('test', i)
    }
    const recent = collector.getRecentRecords(500)
    expect(recent.length).toBeLessThanOrEqual(500)
  })

  it('ProviderRegistry scalability: should not degrade with many providers', () => {
    const registry = new ProviderRegistry()
    const count = 500
    for (let i = 0; i < count; i++) {
      registry.register(createMockProvider({ id: `p${i}`, priority: i }))
    }
    expect(registry.count).toBe(count)
    // O(1) lookup
    expect(registry.get('p499')).toBeDefined()
  })

  it('History cleanup: should not accumulate completed items', async () => {
    const mgr = new HistoryManager()
    await mgr.initialize()
    // 大量已完成条目应被清理
    for (let i = 0; i < 200; i++) {
      await mgr.recordHistory({
        id: `h-${i}`, mediaId: `m-${i}`, episodeId: `ep-${i}`, providerId: 'p1',
        title: `Show ${i}`, cover: '', episodeLabel: 'EP01',
        duration: 1000, currentTime: 990, progress: 0.99, lastWatchedAt: Date.now(),
      })
      await mgr.updateProgress(`ep-${i}`, 990, 1000)
    }
    // 完成的应该被清理
    const remaining = mgr.getHistory()
    expect(remaining.length).toBeLessThan(200) // 应少于初始数
  })
})
