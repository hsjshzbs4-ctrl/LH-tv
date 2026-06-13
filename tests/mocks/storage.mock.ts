// tests/mocks/storage.mock.ts — StorageService Mock 工厂
// 用于隔离测试 StorageService 及其依赖方

import { vi } from 'vitest'

import type { FavoriteMedia } from '@/core/favorites/types/favorite.types'
import type { WatchHistoryItem } from '@/core/history/types/history.types'
import type { PlaybackPosition } from '@/shared/types'
import type { DownloadTask } from '@/core/download/types/download.types'
import type { OfflineMedia } from '@/core/offline/types/offline.types'
import type { StorageSettings } from '@/shared/storage/storage.types'
import type { StorageSchema } from '@/shared/storage/storage.types'

export interface StorageMockState {
  favorites: FavoriteMedia[]
  history: WatchHistoryItem[]
  playbackPositions: Record<string, PlaybackPosition>
  searchHistory: Array<{ keyword: string; searchedAt: number }>
  settings: StorageSettings
  offlineLibrary: OfflineMedia[]
  downloadHistory: DownloadTask[]
}

/**
 * StorageMock — 完全可控的内存存储模拟
 *
 * 用法：
 *   const storage = new StorageMock()
 *   storage.install()         // 替换 window.app.storage*
 *   storage.favorites.push(...)
 *   // ... 运行测试 ...
 *   storage.reset()
 */
export class StorageMock {
  state: StorageMockState

  // window.app mock 方法
  storageLoad = vi.fn()
  storageSave = vi.fn()
  storageExport = vi.fn()
  storageImport = vi.fn()
  storageStats = vi.fn()

  private _originals: Record<string, unknown> = {}

  constructor(initial?: Partial<StorageMockState>) {
    this.state = {
      favorites: [],
      history: [],
      playbackPositions: {},
      searchHistory: [],
      settings: {},
      offlineLibrary: [],
      downloadHistory: [],
      ...initial,
    }

    // 绑定方法到实例
    this.storageLoad.mockImplementation(() => Promise.resolve({ ...this.state }))
    this.storageSave.mockImplementation((data: StorageSchema) => {
      this.state = { ...this.state, ...data }
      return Promise.resolve(true)
    })
    this.storageExport.mockImplementation(() => Promise.resolve(JSON.stringify(this.state)))
    this.storageImport.mockImplementation((json: string) => {
      try {
        const parsed = JSON.parse(json)
        this.state = { ...this.state, ...parsed }
        return Promise.resolve({ success: true, message: 'ok' })
      } catch {
        return Promise.resolve({ success: false, message: 'invalid json' })
      }
    })
    this.storageStats.mockImplementation(() =>
      Promise.resolve({
        favorites: this.state.favorites.length,
        history: this.state.history.length,
        positions: Object.keys(this.state.playbackPositions).length,
        fileSize: 0,
      })
    )
  }

  /** 安装到 window.app */
  install(): void {
    const app = (window as Record<string, unknown>).app as Record<string, unknown>
    if (!app) return

    const keys = ['storageLoad', 'storageSave', 'storageExport', 'storageImport', 'storageStats']
    for (const key of keys) {
      this._originals[key] = app[key]
      app[key] = (this as Record<string, unknown>)[key]
    }
  }

  /** 重置到初始状态 */
  reset(): void {
    const app = (window as Record<string, unknown>).app as Record<string, unknown>
    if (!app) return

    for (const [key, val] of Object.entries(this._originals)) {
      app[key] = val
    }
    this._originals = {}
    this.state = {
      favorites: [],
      history: [],
      playbackPositions: {},
      searchHistory: [],
      settings: {},
      offlineLibrary: [],
      downloadHistory: [],
    }
    vi.clearAllMocks()
  }

  /** 创建默认 Schema 快照 */
  get schema(): StorageSchema {
    return { ...this.state }
  }
}

/** 默认导出 */
export const storageMock = new StorageMock()
