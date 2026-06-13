// src/shared/types/user.types.ts - 用户数据相关类型

/** 收藏项 */
export interface FavoriteItem {
  id: string | number
  name: string
  image: string
  genres: string[]
  rating?: number
  addedAt: number
}

/** 观看历史项 */
export interface HistoryItem {
  showId: string | number
  showName: string
  showImage: string
  episodeId: string | number
  episodeName: string
  episodeNumber: number
  season: number
  watchedAt: number
}

/** 播放进度 */
export interface PlaybackPosition {
  showName: string
  episodeNumber: number
  position: number   // 秒
  updatedAt: number
}

/** 完整用户数据 */
export interface UserData {
  favorites: Array<{
    id: string
    mediaId: string
    providerId: string
    title: string
    cover: string
    description?: string
    category?: string
    favoritedAt: number
  }>
  history: Array<{
    id: string
    mediaId: string
    episodeId: string
    providerId: string
    title: string
    cover: string
    episodeLabel: string
    duration: number
    currentTime: number
    progress: number
    lastWatchedAt: number
  }>
  playbackPositions: Record<string, PlaybackPosition>
  searchHistory: Array<{ keyword: string; searchedAt: number }>
  settings?: Record<string, unknown>
  offlineLibrary?: Array<{
    id: string
    mediaId: string
    episodeId: string
    providerId: string
    title: string
    cover: string
    episodeLabel: string
    localFilePath: string
    fileSize: number
    downloadedAt: number
    exists: boolean
  }>
  downloadHistory?: Array<{
    id: string
    legacyId?: string
    mediaId: string
    providerId: string
    providerName: string
    episodeId: string
    episodeLabel: string
    episodeNum: number
    title: string
    cover: string
    sourceUrl: string
    status: string
    progress: number
    speed: number
    downloadedBytes: number
    totalBytes: number
    localFilePath?: string
    error?: string
    supportsResume: boolean
    resumeCount: number
    lastResumeAt?: number
    createdAt: number
    updatedAt: number
  }>
  version: number
  savedAt: string
}

/** 存储统计 */
export interface StorageStats {
  favorites: number
  history: number
  positions: number
  fileSize: number
}
