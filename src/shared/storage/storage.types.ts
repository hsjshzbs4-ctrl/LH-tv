// src/shared/storage/storage.types.ts - 存储类型定义

import type { PlaybackPosition } from '@/shared/types'
import type { OfflineMedia } from '@/core/offline/types/offline.types'
import type { DownloadTask } from '@/core/download/types/download.types'
import type { FavoriteMedia } from '@/core/favorites/types/favorite.types'
import type { WatchHistoryItem } from '@/core/history/types/history.types'

/** 完整存储 Schema */
export interface StorageSchema {
  favorites: FavoriteMedia[]
  history: WatchHistoryItem[]
  playbackPositions: Record<string, PlaybackPosition>
  searchHistory: Array<{ keyword: string; searchedAt: number }>
  settings: StorageSettings
  /** 离线媒体库 */
  offlineLibrary: OfflineMedia[]
  /** 下载历史 */
  downloadHistory: DownloadTask[]
}

/** 存储设置 */
export interface StorageSettings {
  /** 播放速度 */
  playbackSpeed?: number
  /** 最大历史条数 */
  maxHistory?: number
  /** 已完成的引导 */
  completedOnboarding?: boolean
  [key: string]: unknown
}

/** 存储服务接口 */
export interface IStorageService {
  load(): Promise<StorageSchema>
  save(data: StorageSchema): Promise<boolean>
  export(): Promise<string | null>
  import(json: string): Promise<{ success: boolean; message: string }>

  getFavorites(): Promise<FavoriteMedia[]>
  setFavorites(items: FavoriteMedia[]): Promise<void>
  getHistory(): Promise<WatchHistoryItem[]>
  setHistory(items: WatchHistoryItem[]): Promise<void>
  getPlaybackPositions(): Promise<Record<string, PlaybackPosition>>
  setPlaybackPositions(positions: Record<string, PlaybackPosition>): Promise<void>
  getSearchHistory(): Promise<Array<{ keyword: string; searchedAt: number }>>
  setSearchHistory(items: Array<{ keyword: string; searchedAt: number }>): Promise<void>
}
