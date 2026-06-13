// src/shared/types/video.types.ts - 影视核心类型

/** 视频类型 */
export type VideoType = 'tv' | 'movie' | 'anime'

/** 基本影视信息 */
export interface Video {
  id: string | number
  name: string
  image?: string
  rating?: number
  year?: number
  genres?: string[]
  remarks?: string
  summary?: string
  siteName?: string
  siteKey?: string
  type?: VideoType
}

/** 剧集 */
export interface Episode {
  label: string
  number: number
  url: string
}

/** 播放源 */
export interface PlaySource {
  name: string
  count: number
  episodes: Episode[]
}

/** 影视详情 */
export interface ShowDetail {
  id: string | number
  name: string
  image?: string
  genres: string[]
  summary: string
  rating?: number
  year?: number
  remarks?: string
  siteName?: string
  siteKey?: string
  playSources: PlaySource[]
}

/** 首页数据 */
export interface HomeData {
  lastUpdated: number
  categories: CategoryInfo[]
  videos: Video[]
  recentUpdates: Video[]
  total: number
}

/** 分类信息 */
export interface CategoryInfo {
  id: number
  name: string
  type?: VideoType
}

/** 分类视频响应 */
export interface CategoryVideos {
  videos: Video[]
  total: number
}

/** 动漫列表响应 */
export interface AnimeListResponse {
  list: Video[]
  totalPages: number
}

/** 目录状态 */
export interface CatalogStatus {
  lastUpdated: number
  totalShows: number
  recentCount: number
  log: string[]
}
