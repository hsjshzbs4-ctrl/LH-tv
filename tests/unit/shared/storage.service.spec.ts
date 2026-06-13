// tests/unit/shared/storage.service.spec.ts — StorageService 单元测试
// 覆盖: load/save/debounce/field accessors/export/import/invalidate/migration

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { storageService } from '@/shared/storage/storage.service'
import type { FavoriteMedia } from '@/core/favorites/types/favorite.types'
import type { WatchHistoryItem } from '@/core/history/types/history.types'
import type { PlaybackPosition } from '@/shared/types'

// ============================================================
// Helpers
// ============================================================

function getApp(): Record<string, ReturnType<typeof vi.fn>> {
  return (window as Record<string, unknown>).app as Record<string, ReturnType<typeof vi.fn>>
}

function createFavorite(overrides: Partial<FavoriteMedia> = {}): FavoriteMedia {
  return {
    id: 'fav-1', mediaId: 'media-1', providerId: 'p1',
    title: 'Test Show', cover: '', favoritedAt: Date.now(),
    ...overrides,
  }
}

function createHistory(overrides: Partial<WatchHistoryItem> = {}): WatchHistoryItem {
  return {
    id: 'hist-1', mediaId: 'media-1', episodeId: 'ep-1', providerId: 'p1',
    title: 'Test Show', cover: '', episodeLabel: '第01集',
    duration: 2400, currentTime: 600, progress: 0.25, lastWatchedAt: Date.now(),
    ...overrides,
  }
}

// ============================================================
// Tests
// ============================================================

describe('StorageService', () => {
  beforeEach(() => {
    // 重置 singleton 状态
    storageService.invalidate()
    // 重置全部 window.app mock
    const app = getApp()
    Object.values(app).forEach((fn) => {
      if (typeof fn?.mockReset === 'function') fn.mockReset()
      if (typeof fn?.mockResolvedValue === 'function') {
        fn.mockResolvedValue(undefined)
      }
    })
    // 恢复默认 mock 返回值
    const defaultData = {
      favorites: [],
      history: [],
      playbackPositions: {},
      searchHistory: [],
      settings: {},
      offlineLibrary: [],
      downloadHistory: [],
    }
    app.storageLoad.mockResolvedValue(defaultData)
    app.storageSave.mockResolvedValue(true)
    app.storageExport.mockResolvedValue(null)
    app.storageImport.mockResolvedValue({ success: false, message: '' })
    app.storageStats.mockResolvedValue({ favorites: 0, history: 0, positions: 0, fileSize: 0 })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ==================== load ====================
  describe('load()', () => {
    it('should load data from main process on first call', async () => {
      const app = getApp()
      app.storageLoad.mockResolvedValue({
        favorites: [createFavorite()],
        history: [],
        playbackPositions: {},
        searchHistory: [],
        settings: {},
        offlineLibrary: [],
        downloadHistory: [],
      })

      const schema = await storageService.load()
      expect(schema.favorites).toHaveLength(1)
      expect(app.storageLoad).toHaveBeenCalledTimes(1)
      expect(storageService.isLoaded).toBe(true)
    })

    it('should cache loaded data and avoid re-IPC on field access', async () => {
      const app = getApp()
      storageService.invalidate()
      app.storageLoad.mockClear()
      app.storageLoad.mockResolvedValue({
        favorites: [createFavorite()],
        history: [],
        playbackPositions: {},
        searchHistory: [],
        settings: {},
        offlineLibrary: [],
        downloadHistory: [],
      })

      // 第一次访问触发 load()
      await storageService.getFavorites()
      const callsAfterFirst = app.storageLoad.mock.calls.length

      // 第二次访问同一字段不应再次 IPC
      await storageService.getFavorites()
      expect(app.storageLoad).toHaveBeenCalledTimes(callsAfterFirst)
    })

    it('should return empty schema when storageLoad returns malformed data', async () => {
      const app = getApp()
      app.storageLoad.mockResolvedValue({ favorites: 'not-an-array' })

      const schema = await storageService.load()
      expect(schema.favorites).toEqual([])
      expect(schema.history).toEqual([])
    })

    it('should return empty schema when storageLoad throws', async () => {
      const app = getApp()
      app.storageLoad.mockRejectedValue(new Error('IPC error'))

      const schema = await storageService.load()
      expect(schema.favorites).toEqual([])
      expect(schema.history).toEqual([])
    })

    it('should mark isLoaded as true even on error', async () => {
      const app = getApp()
      app.storageLoad.mockRejectedValue(new Error('crash'))
      await storageService.load()
      expect(storageService.isLoaded).toBe(true)
    })
  })

  // ==================== save (debounce) ====================
  describe('save()', () => {
    it('should clear previous debounce timer on subsequent save', () => {
      vi.useFakeTimers()
      const app = getApp()
      storageService.invalidate()
      app.storageLoad.mockClear()
      app.storageSave.mockClear()
      app.storageLoad.mockResolvedValue({
        favorites: [], history: [], playbackPositions: {}, searchHistory: [],
        settings: {}, offlineLibrary: [], downloadHistory: [],
      })
      app.storageSave.mockResolvedValue(true)

      const schema = {
        favorites: [createFavorite()],
        history: [], playbackPositions: {}, searchHistory: [],
        settings: {}, offlineLibrary: [], downloadHistory: [],
      }

      // Trigger save (which uses setTimeout debounce internally)
      storageService.save(schema)
      // Second save should clear the first timer
      storageService.save({ ...schema, favorites: [createFavorite({ id: 'fav-2' })] })

      // Before debounce period, storageSave should NOT be called
      expect(app.storageSave).not.toHaveBeenCalled()

      // Advance past debounce window
      vi.advanceTimersByTime(600)

      // Now exactly one call should have been made (the second timer)
      expect(app.storageSave).toHaveBeenCalledTimes(1)
    })

    it('saveNow() should bypass debounce', async () => {
      const app = getApp()
      app.storageLoad.mockResolvedValue({
        favorites: [], history: [], playbackPositions: {}, searchHistory: [],
        settings: {}, offlineLibrary: [], downloadHistory: [],
      })

      await storageService.load()
      await storageService.setFavorites([createFavorite()])
      const result = await storageService.saveNow()

      expect(result).toBe(true)
      expect(app.storageSave).toHaveBeenCalled()
    })
  })

  // ==================== Field Accessors ====================
  describe('getFavorites() / setFavorites()', () => {
    it('should round-trip favorites', async () => {
      const fav = createFavorite()
      await storageService.setFavorites([fav])
      const result = await storageService.getFavorites()
      expect(result).toEqual([fav])
    })

    it('should auto-load if not loaded', async () => {
      const result = await storageService.getFavorites()
      expect(Array.isArray(result)).toBe(true)
      expect(storageService.isLoaded).toBe(true)
    })
  })

  describe('getHistory() / setHistory()', () => {
    it('should round-trip history', async () => {
      const hist = createHistory()
      await storageService.setHistory([hist])
      const result = await storageService.getHistory()
      expect(result).toEqual([hist])
    })
  })

  describe('getPlaybackPositions() / setPlaybackPositions()', () => {
    it('should round-trip playback positions', async () => {
      const pos: Record<string, PlaybackPosition> = {
        'media-1:ep-1': { mediaId: 'media-1', episodeId: 'ep-1', currentTime: 600, updatedAt: Date.now() },
      }
      await storageService.setPlaybackPositions(pos)
      const result = await storageService.getPlaybackPositions()
      expect(result['media-1:ep-1'].currentTime).toBe(600)
    })
  })

  describe('getSearchHistory() / setSearchHistory()', () => {
    it('should round-trip search history', async () => {
      const items = [{ keyword: 'naruto', searchedAt: Date.now() }]
      await storageService.setSearchHistory(items)
      const result = await storageService.getSearchHistory()
      expect(result).toEqual(items)
    })
  })

  describe('getSettings() / setSettings()', () => {
    it('should merge settings (not overwrite unset keys)', async () => {
      await storageService.setSettings({ playbackSpeed: 1.5 })
      await storageService.setSettings({ maxHistory: 100 })
      const settings = await storageService.getSettings()
      expect(settings.playbackSpeed).toBe(1.5)
      expect(settings.maxHistory).toBe(100)
    })
  })

  describe('getOfflineLibrary() / setOfflineLibrary()', () => {
    it('should round-trip offline library', async () => {
      const items = [{ id: 'off-1', mediaId: 'm1', title: 'Offline Show', episodeLabel: '01' }] as any[]
      await storageService.setOfflineLibrary(items)
      const result = await storageService.getOfflineLibrary()
      expect(result).toEqual(items)
    })
  })

  describe('getDownloadHistory() / setDownloadHistory()', () => {
    it('should round-trip download history', async () => {
      const tasks = [{ id: 'dl-1', mediaId: 'm1', status: 'pending' }] as any[]
      await storageService.setDownloadHistory(tasks)
      const result = await storageService.getDownloadHistory()
      expect(result).toEqual(tasks)
    })
  })

  // ==================== Export / Import ====================
  describe('export()', () => {
    it('should call storageExport and return result', async () => {
      const app = getApp()
      app.storageExport.mockResolvedValue('{"favorites":[]}')
      const result = await storageService.export()
      expect(result).toBe('{"favorites":[]}')
      expect(app.storageExport).toHaveBeenCalled()
    })

    it('should return null on IPC error', async () => {
      const app = getApp()
      app.storageExport.mockRejectedValue(new Error('fail'))
      const result = await storageService.export()
      expect(result).toBeNull()
    })
  })

  describe('import()', () => {
    it('should call storageImport and reload on success', async () => {
      const app = getApp()
      app.storageImport.mockResolvedValue({ success: true, message: 'ok' })
      const result = await storageService.import('{"favorites":[]}')
      expect(result.success).toBe(true)
      // 成功后应该重新加载数据
      expect(app.storageLoad).toHaveBeenCalled()
    })

    it('should return error on failed import', async () => {
      const app = getApp()
      app.storageImport.mockResolvedValue({ success: false, message: 'invalid' })
      const result = await storageService.import('bad json')
      expect(result.success).toBe(false)
    })
  })

  // ==================== invalidate ====================
  describe('invalidate()', () => {
    it('should clear cache and force reload on next access', async () => {
      const app = getApp()
      app.storageLoad.mockResolvedValue({
        favorites: [], history: [], playbackPositions: {}, searchHistory: [],
        settings: {}, offlineLibrary: [], downloadHistory: [],
      })

      await storageService.load()
      expect(storageService.isLoaded).toBe(true)

      storageService.invalidate()
      expect(storageService.isLoaded).toBe(false)

      // 下次访问应重新从 IPC 加载
      await storageService.getFavorites()
      // load() 被调用了 2 次（初始 + invalidate后）
      expect(app.storageLoad).toHaveBeenCalledTimes(2)
    })
  })

  // ==================== Stats ====================
  describe('getStats()', () => {
    it('should return stats from main process', async () => {
      const app = getApp()
      app.storageStats.mockResolvedValue({
        favorites: 10, history: 20, positions: 5, fileSize: 1024,
      })
      const stats = await storageService.getStats()
      expect(stats.favorites).toBe(10)
      expect(stats.history).toBe(20)
    })

    it('should return zeros on IPC error', async () => {
      const app = getApp()
      app.storageStats.mockRejectedValue(new Error('fail'))
      const stats = await storageService.getStats()
      expect(stats.favorites).toBe(0)
    })
  })

  // ==================== Migration ====================
  describe('_migrateFavorites()', () => {
    it('should detect new format (has mediaId) and pass through', async () => {
      const app = getApp()
      app.storageLoad.mockResolvedValue({
        favorites: [createFavorite({ id: 'fav-1', mediaId: 'media-1' })],
        history: [], playbackPositions: {}, searchHistory: [], settings: {},
        offlineLibrary: [], downloadHistory: [],
      })
      const schema = await storageService.load()
      expect(schema.favorites[0].mediaId).toBe('media-1')
    })

    it('should migrate old format (has name, no mediaId)', async () => {
      const app = getApp()
      app.storageLoad.mockResolvedValue({
        favorites: [{ id: 'old-1', name: 'Old Show', image: 'img.jpg', rating: 8, addedAt: 1000 }],
        history: [], playbackPositions: {}, searchHistory: [], settings: {},
        offlineLibrary: [], downloadHistory: [],
      })
      const schema = await storageService.load()
      expect(schema.favorites[0].title).toBe('Old Show')
      expect(schema.favorites[0].mediaId).toBe('old-1') // 从 id 映射
    })
  })

  describe('_migrateHistory()', () => {
    it('should detect new format (has duration) and pass through', async () => {
      const app = getApp()
      app.storageLoad.mockResolvedValue({
        favorites: [],
        history: [createHistory({ duration: 2400 })],
        playbackPositions: {}, searchHistory: [], settings: {},
        offlineLibrary: [], downloadHistory: [],
      })
      const schema = await storageService.load()
      expect(schema.history[0].duration).toBe(2400)
    })
  })
})
