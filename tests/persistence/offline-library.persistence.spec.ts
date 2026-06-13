// tests/persistence/offline-library.persistence.spec.ts — 离线媒体库持久化验证
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { OfflineLibraryManager } from '@/core/offline/manager/OfflineLibraryManager'
import { storageService } from '@/shared/storage/storage.service'
import { simulateRestart } from '../helpers/persistence-helper'
import type { OfflineMedia } from '@/core/offline/types/offline.types'

function off(id: string, title = `Show ${id}`): OfflineMedia {
  return {
    id, mediaId: `m-${id}`, providerId: 'p1',
    title, cover: '',
    episodeId: `ep-${id}`, episodeLabel: '第01集', episodeNum: 1,
    localFilePath: `C:\\media\\${id}.mp4`,
    fileSize: 100 * 1024 * 1024,
    downloadedAt: Date.now(),
    exists: false,
  }
}

describe('Offline Library Persistence', () => {
  let persistedData: OfflineMedia[] = []

  beforeEach(() => {
    persistedData = []
    vi.spyOn(storageService, 'getOfflineLibrary').mockImplementation(async () => [...persistedData])
    vi.spyOn(storageService, 'setOfflineLibrary').mockImplementation(async (items: OfflineMedia[]) => {
      persistedData = [...items]
    })
    // Mock legacy library (empty)
    const app = (window as Record<string, unknown>).app as Record<string, Record<string, unknown>>
    const getLocalLibrary = app.getLocalLibrary as ReturnType<typeof vi.fn>
    getLocalLibrary.mockResolvedValue([])
    const deleteLocalEpisode = app.deleteLocalEpisode as ReturnType<typeof vi.fn>
    deleteLocalEpisode.mockResolvedValue(true)
  })

  afterEach(() => { vi.restoreAllMocks() })

  // ==================== Case 01: 媒体索引恢复 ====================
  it('Case 01: should restore media index after restart', async () => {
    const restored = await simulateRestart(
      () => new OfflineLibraryManager(),
      async (mgr) => {
        await mgr.addMedia(off('1', 'Movie A'))
        await mgr.addMedia(off('2', 'Movie B'))
      },
    )

    await restored.load()
    expect(restored.getAllMedia()).toHaveLength(2)
  })

  // ==================== Case 02: 分类信息恢复 ====================
  it('Case 02: should restore media metadata after restart', async () => {
    const restored = await simulateRestart(
      () => new OfflineLibraryManager(),
      async (mgr) => {
        await mgr.addMedia(off('1', 'Movie A'))
      },
    )

    await restored.load()
    const item = restored.getMedia('1')
    expect(item?.title).toBe('Movie A')
    expect(item?.episodeLabel).toBe('第01集')
    expect(item?.localFilePath).toBe('C:\\media\\1.mp4')
  })

  // ==================== Case 03: 文件路径恢复 ====================
  it('Case 03: should preserve file paths after restart', async () => {
    const media = off('path-1', 'Path Test')
    media.localFilePath = 'D:\\Movies\\Test\\S01E01.mp4'

    await simulateRestart(
      () => new OfflineLibraryManager(),
      async (mgr) => { await mgr.addMedia(media) },
    )

    const restored = new OfflineLibraryManager()
    await restored.load()
    const item = restored.getMedia('path-1')
    expect(item?.localFilePath).toBe('D:\\Movies\\Test\\S01E01.mp4')
  })

  // ==================== Case 04: 批量恢复 ====================
  it('Case 04: should restore 50 media items', async () => {
    const restored = await simulateRestart(
      () => new OfflineLibraryManager(),
      async (mgr) => {
        for (let i = 0; i < 50; i++) await mgr.addMedia(off(`${i}`))
      },
    )

    await restored.load()
    expect(restored.getAllMedia()).toHaveLength(50)
  })

  // ==================== 删除后恢复 ====================
  it('should persist deletion after restart', async () => {
    await simulateRestart(
      () => new OfflineLibraryManager(),
      async (mgr) => {
        await mgr.addMedia(off('1'))
        await mgr.addMedia(off('2'))
        await mgr.removeMedia('1')
      },
    )

    const restored = new OfflineLibraryManager()
    await restored.load()
    expect(restored.getAllMedia()).toHaveLength(1)
    expect(restored.getMedia('1')).toBeUndefined()
    expect(restored.getMedia('2')).toBeDefined()
  })
})
