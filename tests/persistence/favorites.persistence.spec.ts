// tests/persistence/favorites.persistence.spec.ts — 收藏持久化验证
// 验证: Create → Write → Persist → Destroy → Recreate → Restore → Validate
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { FavoritesManager } from '@/core/favorites/manager/FavoritesManager'
import { storageService } from '@/shared/storage/storage.service'
import { simulateRestart, simulateMultipleRestarts } from '../helpers/persistence-helper'
import type { FavoriteMedia } from '@/core/favorites/types/favorite.types'

function fav(mediaId: string, title: string): Omit<FavoriteMedia, 'favoritedAt'> {
  return { id: `fav-${mediaId}`, mediaId, providerId: 'p1', title, cover: '' }
}

describe('Favorites Persistence', () => {
  let persistedData: FavoriteMedia[] = []

  beforeEach(() => {
    persistedData = []
    vi.spyOn(storageService, 'getFavorites').mockImplementation(async () => [...persistedData])
    vi.spyOn(storageService, 'setFavorites').mockImplementation(async (items: FavoriteMedia[]) => {
      persistedData = [...items]
    })
  })

  afterEach(() => { vi.restoreAllMocks() })

  // ==================== Case 01: 新增收藏恢复 ====================
  it('Case 01: should restore favorites after restart', async () => {
    const restored = await simulateRestart(
      () => new FavoritesManager(),
      async (mgr) => {
        await mgr.initialize()
        await mgr.addFavorite(fav('m1', 'Movie A'))
        await mgr.addFavorite(fav('m2', 'Movie B'))
        await mgr.addFavorite(fav('m3', 'Movie C'))
      },
    )

    await restored.initialize()
    const items = restored.getFavorites()
    expect(items).toHaveLength(3)
    expect(items.map(i => i.title)).toEqual(expect.arrayContaining(['Movie A', 'Movie B', 'Movie C']))
  })

  // ==================== Case 02: 删除收藏恢复 ====================
  it('Case 02: should persist deletions after restart', async () => {
    await simulateRestart(
      () => new FavoritesManager(),
      async (mgr) => {
        await mgr.initialize()
        await mgr.addFavorite(fav('m1', 'Keep'))
        await mgr.addFavorite(fav('m2', 'Delete'))
        await mgr.removeFavorite('m2')
      },
    )

    const restored = new FavoritesManager()
    await restored.initialize()
    const items = restored.getFavorites()
    expect(items).toHaveLength(1)
    expect(items[0].mediaId).toBe('m1')
  })

  // ==================== Case 03: 批量收藏 100 条 ====================
  it('Case 03: should restore 100 favorites correctly', async () => {
    const restored = await simulateRestart(
      () => new FavoritesManager(),
      async (mgr) => {
        await mgr.initialize()
        for (let i = 0; i < 100; i++) {
          await mgr.addFavorite(fav(`m${i}`, `Movie ${i}`))
        }
      },
    )

    await restored.initialize()
    expect(restored.getFavorites()).toHaveLength(100)
  })

  // ==================== Case 04: 重复收藏去重 ====================
  it('Case 04: should not duplicate on re-add after restart', async () => {
    // Add m1, then restart, then try to add m1 again
    await simulateRestart(
      () => new FavoritesManager(),
      async (mgr) => {
        await mgr.initialize()
        await mgr.addFavorite(fav('m1', 'Movie A'))
      },
    )

    const restored = new FavoritesManager()
    await restored.initialize()
    await restored.addFavorite(fav('m1', 'Movie A')) // duplicate
    expect(restored.getFavorites()).toHaveLength(1)
  })

  // ==================== Case 05: 排序恢复 ====================
  it('Case 05: should preserve timestamp sort order across restart', async () => {
    await simulateRestart(
      () => new FavoritesManager(),
      async (mgr) => {
        await mgr.initialize()
        await mgr.addFavorite(fav('m1', 'First'))
        await new Promise(r => setTimeout(r, 10))
        await mgr.addFavorite(fav('m2', 'Second'))
        await new Promise(r => setTimeout(r, 10))
        await mgr.addFavorite(fav('m3', 'Third'))
      },
    )

    const restored = new FavoritesManager()
    await restored.initialize()
    const items = restored.getFavorites()
    // 最近收藏的在前
    expect(items[0].mediaId).toBe('m3')
    expect(items[2].mediaId).toBe('m1')
  })

  // ==================== 连续重启 10 次 ====================
  it('should survive 10 consecutive restarts without data loss', async () => {
    await simulateMultipleRestarts(
      () => new FavoritesManager(),
      async (mgr) => {
        await mgr.initialize()
        await mgr.addFavorite(fav('m1', 'Persistent'))
      },
      async (mgr) => {
        await mgr.initialize()
        expect(mgr.isFavorite('m1')).toBe(true)
        expect(mgr.getFavorites().length).toBeGreaterThanOrEqual(1)
      },
      10,
    )
  })
})
