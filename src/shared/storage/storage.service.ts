// src/shared/storage/storage.service.ts - 统一存储服务
// 所有用户数据读写必须通过此服务，禁止直接操作 localStorage
//
// 架构: 渲染进程 → IPC → 主进程 storage.service.ts → user-data.json
//       内存缓存层避免重复 IPC 调用

import type {
  PlaybackPosition,
  ImportResult,
} from '@/shared/types'
import type { OfflineMedia } from '@/core/offline/types/offline.types'
import type { DownloadTask } from '@/core/download/types/download.types'
import type { FavoriteMedia } from '@/core/favorites/types/favorite.types'
import type { WatchHistoryItem } from '@/core/history/types/history.types'
import type { SearchHistoryItem } from '@/core/search/types/search.types'
import type { StorageSchema, StorageSettings } from './storage.types'
import { STORAGE_LIMITS } from './storage.keys'

/** 默认 Schema（工厂函数，每次返回新对象避免引用污染） */
function defaultSchema(): StorageSchema {
  return {
    favorites: [],
    history: [],
    playbackPositions: {},
    searchHistory: [],
    settings: {},
    offlineLibrary: [],
    downloadHistory: [],
  }
}

class StorageServiceImpl {
  private cache: StorageSchema | null = null
  private loaded = false
  private saveTimer: ReturnType<typeof setTimeout> | null = null
  private readonly debounceMs = 500

  // ==================== 核心 load/save ====================

  /** 从主进程加载完整数据 */
  async load(): Promise<StorageSchema> {
    try {
      const raw = await window.app.storageLoad()
      if (raw && Array.isArray(raw.favorites) && Array.isArray(raw.history)) {
        this.cache = {
          favorites: this._migrateFavorites(raw.favorites),
          history: this._migrateHistory(raw.history),
          playbackPositions: raw.playbackPositions || {},
          searchHistory: this._migrateSearchHistory(raw.searchHistory),
          settings: raw.settings || {},
          offlineLibrary: Array.isArray(raw.offlineLibrary) ? raw.offlineLibrary : [],
          downloadHistory: Array.isArray(raw.downloadHistory) ? raw.downloadHistory as DownloadTask[] : [],
        }
      } else {
        this.cache = defaultSchema()
      }
      this.loaded = true
      return this.cache
    } catch {
      this.cache = defaultSchema()
      this.loaded = true
      return this.cache
    }
  }

  /** 保存到主进程（防抖写入） */
  async save(data?: StorageSchema): Promise<boolean> {
    if (data) this.cache = data
    if (!this.cache) return false

    // 防抖：短时间内多次 save 只执行最后一次
    if (this.saveTimer) clearTimeout(this.saveTimer)
    return new Promise((resolve) => {
      this.saveTimer = setTimeout(async () => {
        try {
          const payload = {
            ...this.cache!,
            version: 1,
            savedAt: new Date().toISOString(),
          }
          const ok = await window.app.storageSave(payload)
          resolve(ok)
        } catch {
          resolve(false)
        }
      }, this.debounceMs)
    })
  }

  /** 强制立即保存（跳过防抖） */
  async saveNow(): Promise<boolean> {
    if (this.saveTimer) { clearTimeout(this.saveTimer); this.saveTimer = null }
    if (!this.cache) return false
    try {
      const payload = {
        ...this.cache,
        version: 1,
        savedAt: new Date().toISOString(),
      }
      return await window.app.storageSave(payload)
    } catch {
      return false
    }
  }

  // ==================== 导出/导入 ====================

  async export(): Promise<string | null> {
    await this.saveNow()
    try {
      return await window.app.storageExport()
    } catch {
      return null
    }
  }

  async import(json: string): Promise<ImportResult> {
    try {
      const result = await window.app.storageImport(json)
      if (result.success) {
        // 重新加载以获取合并后的数据
        await this.load()
      }
      return result
    } catch (e) {
      return { success: false, message: '导入失败: ' + (e as Error).message }
    }
  }

  // ==================== 收藏 ====================

  async getFavorites(): Promise<FavoriteMedia[]> {
    if (!this.loaded) await this.load()
    return this.cache?.favorites || []
  }

  async setFavorites(items: FavoriteMedia[]): Promise<void> {
    if (!this.loaded) await this.load()
    this.cache!.favorites = items.slice(0, STORAGE_LIMITS.MAX_FAVORITES)
    await this.save()
  }

  // ==================== 历史 ====================

  async getHistory(): Promise<WatchHistoryItem[]> {
    if (!this.loaded) await this.load()
    return this.cache?.history || []
  }

  async setHistory(items: WatchHistoryItem[]): Promise<void> {
    if (!this.loaded) await this.load()
    this.cache!.history = items.slice(0, STORAGE_LIMITS.MAX_HISTORY)
    await this.save()
  }

  // ==================== 播放进度 ====================

  async getPlaybackPositions(): Promise<Record<string, PlaybackPosition>> {
    if (!this.loaded) await this.load()
    return this.cache?.playbackPositions || {}
  }

  async setPlaybackPositions(positions: Record<string, PlaybackPosition>): Promise<void> {
    if (!this.loaded) await this.load()
    this.cache!.playbackPositions = positions
    await this.save()
  }

  // ==================== 搜索历史 ====================

  async getSearchHistory(): Promise<SearchHistoryItem[]> {
    if (!this.loaded) await this.load()
    return this.cache?.searchHistory || []
  }

  async setSearchHistory(items: SearchHistoryItem[]): Promise<void> {
    if (!this.loaded) await this.load()
    this.cache!.searchHistory = items.slice(0, STORAGE_LIMITS.MAX_SEARCH_HISTORY)
    await this.save()
  }

  // ==================== 设置 ====================

  async getSettings(): Promise<StorageSettings> {
    if (!this.loaded) await this.load()
    return this.cache?.settings || {}
  }

  async setSettings(settings: StorageSettings): Promise<void> {
    if (!this.loaded) await this.load()
    this.cache!.settings = { ...this.cache!.settings, ...settings }
    await this.save()
  }

  // ==================== 离线媒体库 ====================

  async getOfflineLibrary(): Promise<OfflineMedia[]> {
    if (!this.loaded) await this.load()
    return this.cache?.offlineLibrary || []
  }

  async setOfflineLibrary(items: OfflineMedia[]): Promise<void> {
    if (!this.loaded) await this.load()
    this.cache!.offlineLibrary = items
    await this.save()
  }

  // ==================== 下载历史 ====================

  async getDownloadHistory(): Promise<DownloadTask[]> {
    if (!this.loaded) await this.load()
    return this.cache?.downloadHistory || []
  }

  async setDownloadHistory(tasks: DownloadTask[]): Promise<void> {
    if (!this.loaded) await this.load()
    this.cache!.downloadHistory = tasks
    await this.save()
  }

  // ==================== 内存管理 ====================

  /** 获取统计信息 */
  async getStats() {
    try {
      return await window.app.storageStats()
    } catch {
      return { favorites: 0, history: 0, positions: 0, fileSize: 0 }
    }
  }

  /** 标记已加载状态 */
  get isLoaded(): boolean {
    return this.loaded
  }

  /** 重置内存缓存（下次访问会重新从主进程加载） */
  invalidate(): void {
    this.cache = null
    this.loaded = false
  }

  // ==================== 内部 ====================

  /**
   * 迁移旧 HistoryItem 格式到 WatchHistoryItem
   */
  private _migrateHistory(raw: unknown): WatchHistoryItem[] {
    if (!Array.isArray(raw)) return []
    return raw.map((item: Record<string, unknown>) => {
      // 已是新格式
      if (item && typeof item.duration === 'number') {
        return item as unknown as WatchHistoryItem
      }
      // 旧 HistoryItem 格式：{ showId, showName, showImage, episodeId, episodeName, episodeNumber, season, watchedAt }
      return {
        id: `hist_${item.episodeId || item.showId || Date.now()}`,
        mediaId: String(item.showId || ''),
        episodeId: String(item.episodeId || ''),
        providerId: '',
        title: (item.showName as string) || '',
        cover: (item.showImage as string) || '',
        episodeLabel: (item.episodeName as string) || `第${item.episodeNumber}集`,
        duration: 0,
        currentTime: 0,
        progress: 0,
        lastWatchedAt: (item.watchedAt as number) || Date.now(),
      } as WatchHistoryItem
    })
  }

  /**
   * 迁移旧 FavoriteItem 格式到 FavoriteMedia
   * 向后兼容 P2 及更早版本的数据
   */
  private _migrateFavorites(raw: unknown): FavoriteMedia[] {
    if (!Array.isArray(raw)) return []
    return raw.map((item: Record<string, unknown>) => {
      // 已是新格式
      if (item && typeof item.mediaId === 'string') {
        return item as unknown as FavoriteMedia
      }
      // 旧 FavoriteItem 格式：{ id, name, image, genres, rating, addedAt }
      return {
        id: `fav_${item.id || Date.now()}`,
        mediaId: String(item.id || item.name || ''),
        providerId: '',
        title: (item.name as string) || '',
        cover: (item.image as string) || '',
        description: '',
        category: '',
        favoritedAt: (item.addedAt as number) || Date.now(),
      } as FavoriteMedia
    })
  }

  /**
   * 迁移旧 searchHistory 格式 (string[]) 到新格式 (SearchHistoryItem[])
   * 向后兼容 P3.3 及更早版本的数据
   */
  private _migrateSearchHistory(raw: unknown): SearchHistoryItem[] {
    if (!Array.isArray(raw)) return []
    const now = Date.now()
    return raw
      .map((item: unknown, index: number) => {
        // 已是新格式
        if (typeof item === 'object' && item !== null && typeof (item as Record<string, unknown>).keyword === 'string') {
          return item as SearchHistoryItem
        }
        // 旧格式 string[] → 转换为 SearchHistoryItem，通过递减时间戳保留顺序
        if (typeof item === 'string' && item.trim()) {
          return { keyword: item, searchedAt: now - index * 1000 }
        }
        return null
      })
      .filter((item): item is SearchHistoryItem => item !== null)
  }
}

/** 全局单例 */
export const storageService = new StorageServiceImpl()
