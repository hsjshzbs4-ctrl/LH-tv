// tests/unit/core/offline/offline-library-manager.spec.ts — OfflineLibraryManager 单元测试
// 覆盖: load/addMedia/removeMedia/getMedia/getAllMedia/search/subscribe/isLoaded

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { OfflineLibraryManager } from '@/core/offline/manager/OfflineLibraryManager'
import { storageService } from '@/shared/storage/storage.service'
import type { OfflineMedia } from '@/core/offline/types/offline.types'

function createOfflineMedia(overrides: Partial<OfflineMedia> = {}): OfflineMedia {
  return {
    id: 'off-1', mediaId: 'm1', providerId: 'p1',
    title: 'Test Show', cover: '',
    episodeId: 'ep-1', episodeLabel: '第01集', episodeNum: 1,
    localFilePath: 'C:\\media\\video.mp4',
    fileSize: 100 * 1024 * 1024,
    downloadedAt: Date.now(),
    ...overrides,
  }
}

describe('OfflineLibraryManager', () => {
  let manager: OfflineLibraryManager

  beforeEach(async () => {
    manager = new OfflineLibraryManager()

    // Setup storageService mocks
    vi.spyOn(storageService, 'getOfflineLibrary').mockResolvedValue([])
    vi.spyOn(storageService, 'setOfflineLibrary').mockResolvedValue()

    // Setup window.app mock
    const app = (window as Record<string, unknown>).app as Record<string, Record<string, unknown>>
    const getLocalLibrary = app.getLocalLibrary as ReturnType<typeof vi.fn>
    getLocalLibrary.mockResolvedValue([])
    const deleteLocalEpisode = app.deleteLocalEpisode as ReturnType<typeof vi.fn>
    deleteLocalEpisode.mockResolvedValue(true)

    await manager.load()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ==================== load ====================
  describe('load()', () => {
    it('should populate from StorageService', async () => {
      const items = [createOfflineMedia()]
      vi.spyOn(storageService, 'getOfflineLibrary').mockResolvedValue(items)

      await manager.load()
      expect(manager.getAllMedia()).toHaveLength(1)
      expect(manager.isLoaded).toBe(true)
    })

    it('should handle load error gracefully', async () => {
      vi.spyOn(storageService, 'getOfflineLibrary').mockRejectedValue(new Error('fail'))

      await manager.load()
      expect(manager.getAllMedia()).toHaveLength(0)
      expect(manager.isLoaded).toBe(true)
    })
  })

  // ==================== addMedia ====================
  describe('addMedia()', () => {
    it('should add and persist media', async () => {
      const setSpy = vi.spyOn(storageService, 'setOfflineLibrary')
      const media = createOfflineMedia()
      await manager.addMedia(media)

      expect(manager.getMedia('off-1')).toBeDefined()
      expect(setSpy).toHaveBeenCalledWith([media])
    })

    it('should auto-load if not loaded', async () => {
      const fresh = new OfflineLibraryManager()
      vi.spyOn(storageService, 'getOfflineLibrary').mockResolvedValue([])

      await fresh.addMedia(createOfflineMedia())
      expect(fresh.isLoaded).toBe(true)
      expect(fresh.getMedia('off-1')).toBeDefined()
    })
  })

  // ==================== removeMedia ====================
  describe('removeMedia()', () => {
    it('should remove and persist', async () => {
      const setSpy = vi.spyOn(storageService, 'setOfflineLibrary')
      await manager.addMedia(createOfflineMedia({ id: 'off-1' }))

      await manager.removeMedia('off-1')
      expect(manager.getMedia('off-1')).toBeUndefined()
      expect(setSpy).toHaveBeenCalledTimes(2) // add + remove
    })

    it('should call deleteLocalEpisode for file cleanup', async () => {
      const app = (window as Record<string, unknown>).app as Record<string, Record<string, unknown>>
      const deleteLocalEpisode = app.deleteLocalEpisode as ReturnType<typeof vi.fn>

      await manager.addMedia(createOfflineMedia({ id: 'rm-1', localFilePath: 'C:\\test.mp4' }))
      await manager.removeMedia('rm-1')

      expect(deleteLocalEpisode).toHaveBeenCalledWith('C:\\test.mp4')
    })

    it('should noop for missing id', async () => {
      await expect(manager.removeMedia('nonexistent')).resolves.not.toThrow()
    })
  })

  // ==================== getMedia / getAllMedia ====================
  describe('getMedia() / getAllMedia()', () => {
    it('should return single media by id', async () => {
      const m = createOfflineMedia({ id: 'find-me' })
      await manager.addMedia(m)
      expect(manager.getMedia('find-me')).toBe(m)
    })

    it('should return undefined for missing id', () => {
      expect(manager.getMedia('missing')).toBeUndefined()
    })

    it('should return all media', async () => {
      await manager.addMedia(createOfflineMedia({ id: 'a' }))
      await manager.addMedia(createOfflineMedia({ id: 'b' }))
      expect(manager.getAllMedia()).toHaveLength(2)
    })
  })

  // ==================== search ====================
  describe('search()', () => {
    it('should filter by title (case insensitive)', async () => {
      await manager.addMedia(createOfflineMedia({ id: 'a', title: 'Naruto' }))
      await manager.addMedia(createOfflineMedia({ id: 'b', title: 'One Piece' }))

      const results = manager.search('naruto')
      expect(results).toHaveLength(1)
      expect(results[0].id).toBe('a')
    })

    it('should filter by episodeLabel', async () => {
      await manager.addMedia(createOfflineMedia({ id: 'a', episodeLabel: '第01集' }))
      await manager.addMedia(createOfflineMedia({ id: 'b', episodeLabel: '第05集' }))

      expect(manager.search('01')).toHaveLength(1)
    })

    it('should return all for empty keyword', async () => {
      await manager.addMedia(createOfflineMedia({ id: 'a' }))
      await manager.addMedia(createOfflineMedia({ id: 'b' }))
      expect(manager.search('')).toHaveLength(2)
      expect(manager.search('   ')).toHaveLength(2)
    })
  })

  // ==================== subscribe ====================
  describe('subscribe()', () => {
    it('should notify subscribers on mutation', async () => {
      const notifications: string[] = []
      const unsub = manager.subscribe(() => notifications.push('changed'))

      await manager.addMedia(createOfflineMedia())
      expect(notifications).toEqual(['changed'])

      unsub()
      await manager.addMedia(createOfflineMedia({ id: 'off-2' }))
      expect(notifications).toEqual(['changed']) // no new notification
    })

    it('should not throw when subscriber throws', async () => {
      manager.subscribe(() => { throw new Error('oops') })
      await expect(manager.addMedia(createOfflineMedia())).resolves.not.toThrow()
    })
  })
})
