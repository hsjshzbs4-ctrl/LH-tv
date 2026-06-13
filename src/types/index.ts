// src/types/index.ts - 向后兼容 re-export 入口
// 所有旧 import 路径 '@/types' 仍然有效
// 新代码建议直接从 '@shared/types' 导入

// ==================== Re-export 全部新类型 ====================
export type {
  // common
  Nullable,
  DeepReadonly,
  Result,
  Timestamp,
  JsonValue,
  JsonObject,
  // video
  VideoType,
  Video,
  Episode,
  PlaySource,
  ShowDetail,
  HomeData,
  CategoryInfo,
  CategoryVideos,
  AnimeListResponse,
  CatalogStatus,
  // catalog
  CatalogItem,
  CatalogMap,
  YearRange,
  // user
  FavoriteItem,
  HistoryItem,
  PlaybackPosition,
  UserData,
  StorageStats,
  // search
  SearchResult,
  SearchHistoryItem,
  // player
  PlaybackSpeed,
  PlayerSourceType,
  PlayerSource,
  PlayerConfig,
  PlayerStateSnapshot,
  // cache
  CacheEntry,
  CacheStats,
  TTLConfig,
  // ipc
  IpcResponse,
  PosterRefreshResult,
  PosterProgressData,
  PostersUpdatedData,
  AppErrorData,
  UpdateAvailableData,
  UpdateProgressData,
  UpdateDownloadedData,
  UpdateErrorData,
  AppConfig,
  FallbackSource,
  WindowConfig,
  QueueStats,
  ImportResult,
  IpcChannelMap,
  LocalEpisode,
  LocalShow,
  LocalLibraryItem,
  AppInvoke,
} from '@/shared/types'

export { PlayerStatus } from '@/shared/types'

// ==================== 渲染进程 API 接口 ====================
// 精准类型，消除全部 unknown

import type {
  Video,
  ShowDetail,
  CatalogItem,
  CatalogMap,
  FavoriteItem,
  HistoryItem,
  PlaybackPosition,
  SearchResult,
  HomeData,
  CategoryVideos,
  AnimeListResponse,
  UserData,
  StorageStats,
  PosterRefreshResult,
  PosterProgressData,
  PostersUpdatedData,
  AppErrorData,
  UpdateAvailableData,
  UpdateProgressData,
  UpdateDownloadedData,
  UpdateErrorData,
  AppConfig,
  ImportResult,
  LocalShow,
  LocalLibraryItem,
} from '@/shared/types'

export interface AppAPI {
  // 窗口控制
  minimizeWindow: () => void
  maximizeWindow: () => Promise<boolean>
  closeWindow: () => void
  isMaximized: () => Promise<boolean>

  // 加密
  encrypt: (text: string) => Promise<string>
  decrypt: (encoded: string) => Promise<string>

  // 应用配置
  getAppConfig: () => Promise<AppConfig>
  openExternal: (url: string) => void
  openDownloadDir: () => Promise<void>

  // 事件监听（返回取消函数）
  onAppError: (cb: (data: AppErrorData) => void) => () => void
  onMainReady: (cb: () => void) => () => void
  onUpdateAvailable: (cb: (info: UpdateAvailableData) => void) => () => void
  onUpdateProgress: (cb: (progress: UpdateProgressData) => void) => () => void
  onUpdateDownloaded: (cb: (info: UpdateDownloadedData) => void) => () => void
  onUpdateError: (cb: (data: UpdateErrorData) => void) => () => void

  // 首页
  getHomeData: () => Promise<HomeData>

  // 分类
  getCategoryVideos: (categoryId: number, page: number) => Promise<CategoryVideos>

  // 搜索
  searchVideo: (showName: string, episodeNum: number) => Promise<SearchResult[]>
  clearSearchCache: () => Promise<boolean>

  // 详情
  getShowDetail: (showName: string) => Promise<ShowDetail | null>

  // 动漫
  getAnimeList: (catId: string, page: number) => Promise<AnimeListResponse>
  getAnimeDetail: (animeId: number) => Promise<ShowDetail | null>
  getAnimePlayUrl: (playUrl: string) => Promise<{ url: string }>
  searchAnime: (keyword: string) => Promise<SearchResult[]>
  getAnimeCatalog: (catId: string) => Promise<Video[]>

  // 目录
  getTypeCatalog: (type: string, sub: string) => Promise<CatalogItem[]>
  getYearCatalog: (year: string, type: string) => Promise<CatalogItem[]>
  searchYearCatalog: (keyword: string) => Promise<CatalogItem[]>
  getFullCatalog: () => Promise<CatalogMap>

  // 海报
  fetchPoster: (showName: string, year: string) => Promise<string | null>
  getCatalogWithPosters: (type: string, sub: string) => Promise<CatalogItem[]>
  refreshAllPosters: () => Promise<PosterRefreshResult>
  forceRefreshAllPosters: () => Promise<PosterRefreshResult>
  onPosterProgress: (cb: (data: PosterProgressData) => void) => () => void
  onPostersUpdated: (cb: (data: PostersUpdatedData) => void) => () => void

  // 下载（本地库）
  getLocalShows: () => Promise<LocalShow[]>
  getLocalLibrary: () => Promise<LocalLibraryItem[]>
  deleteLocalEpisode: (filePath: string) => Promise<boolean>

  // 下载（任务管理 — legacy downloader IPC）
  downloadEpisode: (task: {
    showName: string
    episodeLabel: string
    episodeNum: number
    url: string
    type: 'm3u8' | 'mp4'
  }) => Promise<{ id: string; status: string }>

  getDownloadStatus: () => Promise<{
    active: Array<{ id: string; showName: string; episodeLabel: string; progress: number; detail: string }>
    completed: number
  }>

  onDownloadProgress: (cb: (data: { id: string; progress: number; detail: string }) => void) => () => void
  onDownloadComplete: (cb: (data: { id: string; filePath: string; showName: string; episodeLabel: string }) => void) => () => void
  onDownloadError: (cb: (data: { id: string; error: string }) => void) => () => void

  // 文件存储
  storageLoad: () => Promise<UserData>
  storageSave: (data: UserData) => Promise<boolean>
  storageExport: () => Promise<string | null>
  storageImport: (json: string) => Promise<ImportResult>
  storageStats: () => Promise<StorageStats>
}

// ==================== 全局窗口类型增强 ====================
declare global {
  interface Window {
    app: AppAPI
  }
}
