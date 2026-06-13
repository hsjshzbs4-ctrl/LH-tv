// src/provider-contracts/types/media.types.ts — 统一媒体数据模型
// P5.0: 从 providers/types 提取到共享 contracts 层，供全系统使用

/** 统一媒体条目 */
export interface MediaItem {
  id: string
  title: string
  cover: string
  providerId: string
  providerName: string
  type: MediaType
  year?: number
  score?: number
  remark?: string
}

export type MediaType = 'movie' | 'tv' | 'anime'

/** 统一媒体详情 */
export interface MediaDetail {
  id: string
  title: string
  cover: string
  description: string
  providerId: string
  episodes: MediaEpisode[]
}

/** 统一剧集 */
export interface MediaEpisode {
  id: string
  title: string
  episodeNumber?: number
}

/** 聚合搜索结果 */
export interface AggregatedSearchResult {
  items: MediaItem[]
  providers: string[]
  totalFromCache: number
  totalFromNetwork: number
}
