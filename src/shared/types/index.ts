// src/shared/types/index.ts - 统一类型导出入口
// 所有类型通过此文件集中导出，外部只需 import from '@/shared/types'

// ---- 通用 ----
export type {
  Nullable,
  DeepReadonly,
  Result,
  Timestamp,
  JsonValue,
  JsonObject,
} from './common.types'

// ---- 影视 ----
export type {
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
} from './video.types'

// ---- 目录 ----
export type {
  CatalogItem,
  CatalogMap,
  YearRange,
} from './catalog.types'

// ---- 用户 ----
export type {
  FavoriteItem,
  HistoryItem,
  PlaybackPosition,
  UserData,
  StorageStats,
} from './user.types'

// ---- 搜索 ----
export type {
  SearchResult,
  SearchHistoryItem,
} from './search.types'

// ---- 播放器 ----
export type {
  PlaybackSpeed,
  PlayerSourceType,
  PlayerSource,
  PlayerConfig,
  PlayerStateSnapshot,
} from './player.types'
export { PlayerStatus } from './player.types'

// ---- 缓存 ----
export type {
  CacheEntry,
  CacheStats,
  TTLConfig,
} from './cache.types'

// ---- IPC ----
export type {
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
} from './ipc.types'
