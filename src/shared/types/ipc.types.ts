// src/shared/types/ipc.types.ts - IPC 相关类型

import type {
  HomeData,
  CategoryVideos,
  Video,
  ShowDetail,
  AnimeListResponse,
  CatalogStatus,
} from './video.types'
import type { CatalogItem, YearRange, CatalogMap } from './catalog.types'
import type { UserData, StorageStats } from './user.types'
import type { SearchResult } from './search.types'
import type { PlaybackSpeed } from './player.types'
import type { Nullable } from './common.types'

/** IPC 响应包装 */
export interface IpcResponse<T = void> {
  ok: boolean
  data?: T
  error?: string
}

/** 海报刷新结果 */
export interface PosterRefreshResult {
  ok: boolean
  total: number
  toRefresh: number
  error?: string
}

/** 海报刷新进度事件数据 */
export interface PosterProgressData {
  current: number
  total: number
  name: string
  hasUrl: boolean
}

/** 海报更新完成事件数据 */
export interface PostersUpdatedData {
  fetched: number
  total: number
}

/** 应用错误事件数据 */
export interface AppErrorData {
  message: string
  fatal?: boolean
  nonFatal?: boolean
}

/** 更新可用事件数据 */
export interface UpdateAvailableData {
  version: string
  releaseName: string
  releaseNotes: string[]
  releaseDate: string
  downloading: boolean
}

/** 更新进度事件数据 */
export interface UpdateProgressData {
  percent: number
  bytesPerSecond: number
  total: number
  transferred: number
}

/** 更新下载完成事件数据 */
export interface UpdateDownloadedData {
  version: string
  releaseName: string
  releaseNotes: string[]
  releaseDate: string
  ready: boolean
  postponed?: boolean
}

/** 更新错误事件数据 */
export interface UpdateErrorData {
  message: string
}

/** 应用配置 */
export interface AppConfig {
  ALLOWED_HOSTS: string[]
  FALLBACK_SOURCES: Record<string, FallbackSource[]>
  WIN: WindowConfig
  APP_VERSION: string
}

/** 备用源配置 */
export interface FallbackSource {
  label: string
  url: string
  type: 'iframe' | 'webview'
}

/** 窗口配置 */
export interface WindowConfig {
  width: number
  height: number
  minWidth: number
  minHeight: number
  title: string
  backgroundColor: string
}

/** 队列统计 */
export interface QueueStats {
  activeCount: number
  pendingCount: number
}

/** 导入结果 */
export interface ImportResult {
  success: boolean
  message: string
}

/** ==================== Channel → 类型映射 ==================== */
/** IPC Handle 请求/响应映射 */
export interface IpcChannelMap {
  // 窗口
  'win-minimize': { request: void; response: void }
  'win-maximize': { request: void; response: boolean }
  'win-close': { request: void; response: void }
  'win-is-maximized': { request: void; response: boolean }

  // 加密
  'secrets-encrypt': { request: string; response: string }
  'secrets-decrypt': { request: string; response: string }

  // 应用
  'get-app-config': { request: void; response: AppConfig }
  'open-external': { request: string; response: void }
  'queue-stats': { request: void; response: QueueStats }

  // 存储
  'storage-load': { request: void; response: UserData }
  'storage-save': { request: UserData; response: boolean }
  'storage-export': { request: void; response: Nullable<string> }
  'storage-import': { request: string; response: ImportResult }
  'storage-stats': { request: void; response: StorageStats }

  // 搜索
  'get-home-data': { request: void; response: HomeData }
  'get-category-videos': { request: [catId: number, page: number]; response: CategoryVideos }
  'search-video': { request: [showName: string, epNum: number]; response: SearchResult[] }
  'get-show-detail': { request: string; response: Nullable<ShowDetail> }
  'clear-search-cache': { request: void; response: boolean }

  // 目录
  'get-type-catalog': { request: [type: string, sub: string]; response: CatalogItem[] }
  'get-year-catalog': { request: [year: string, type: string]; response: CatalogItem[] }
  'search-year-catalog': { request: string; response: CatalogItem[] }
  'get-full-catalog': { request: void; response: CatalogMap }
  'get-catalog-status': { request: void; response: CatalogStatus }
  'get-year-range': { request: void; response: YearRange }
  'trigger-update': { request: void; response: void }

  // 动漫
  'get-anime-list': { request: [catId: string, page: number]; response: AnimeListResponse }
  'get-anime-detail': { request: number; response: Nullable<ShowDetail> }
  'get-anime-play-url': { request: string; response: { url: string } }
  'search-anime': { request: string; response: SearchResult[] }
  'get-anime-catalog': { request: string; response: Video[] }

  // 海报
  'fetch-poster': { request: [showName: string, year: string]; response: Nullable<string> }
  'get-catalog-with-posters': { request: [type: string, sub: string]; response: CatalogItem[] }
  'refresh-all-posters': { request: void; response: PosterRefreshResult }
  'force-refresh-all-posters': { request: void; response: PosterRefreshResult }

  // 下载
  'get-local-shows': { request: void; response: LocalShow[] }
  'get-local-library': { request: void; response: LocalLibraryItem[] }
  'delete-local-episode': { request: string; response: boolean }
  'open-download-dir': { request: void; response: void }

  // 更新
  'check-for-update': { request: void; response: IpcResponse<{ version: string | null; releaseNotes: string[] }> }
  'install-update': { request: void; response: void }
  'postpone-update': { request: void; response: void }
}

/** 本地剧集 */
export interface LocalEpisode {
  name?: string
  number: number
  filePath: string
}

/** 本地影视 */
export interface LocalShow {
  name: string
  episodes: LocalEpisode[]
}

/** 本地库项 */
export interface LocalLibraryItem {
  name: string
  episodes: LocalEpisode[]
}

// ==================== AppAPI 泛型 invoke ====================

/**
 * 类型安全的 IPC 调用函数
 * 用法: const result = await window.app.invoke<IPCChannelMap['get-home-data']>('get-home-data')
 */
export type AppInvoke = <C extends keyof IpcChannelMap>(
  channel: C,
  ...args: IpcChannelMap[C]['request'] extends void ? [] : IpcChannelMap[C]['request'] extends unknown[] ? IpcChannelMap[C]['request'] : [IpcChannelMap[C]['request']]
) => Promise<IpcChannelMap[C]['response']>
