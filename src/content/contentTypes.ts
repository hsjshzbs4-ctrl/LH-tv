// src/content/contentTypes.ts — PB1.5 Content Layer 类型定义
// 重导出 provider-contracts 的规范类型，定义 content 层专用类型

// ── 从 provider-contracts 重导出规范类型 ──
export type {
  MediaItem,
  MediaDetail,
  MediaEpisode,
  MediaType,
  AggregatedSearchResult,
} from '@provider-contracts'

// ── 从 core 模块重导出持久化类型 ──
export type { FavoriteMedia } from '@/core/favorites/types/favorite.types'
export type { WatchHistoryItem } from '@/core/history/types/history.types'

// ── Content 层专用类型 ──

/** 内容分类（扩展 MediaType） */
export type ContentCategory = 'movie' | 'tv' | 'anime' | 'variety' | 'documentary'

/** Provider 信息摘要（UI 展示用） */
export interface ProviderInfo {
  id: string
  name: string
  enabled: boolean
  priority: number
  type: 'metadata' | 'media-server' | 'local'
  healthStatus: 'online' | 'offline' | 'unknown'
  lastHealthCheck: number
  responseTime?: number
}

/** 首页内容区块 */
export interface HomeSection {
  category: ContentCategory
  label: string
  items: import('@provider-contracts').MediaItem[]
}

/** 搜索过滤条件 */
export interface SearchFilter {
  category?: ContentCategory
  year?: number
  providerId?: string
}

/** 详情结果（扩展 MediaDetail） */
export interface DetailResult {
  id: string
  title: string
  cover: string
  description: string
  providerId: string
  episodes: import('@provider-contracts').MediaEpisode[]
  year?: number
  score?: number
  category?: ContentCategory
  recommendations?: import('@provider-contracts').MediaItem[]
  seasons?: number
}

/** Content 层错误 */
export interface ContentError {
  code: string
  message: string
  providerId?: string
}

/** 分类子类映射 */
export const CATEGORY_SUB_MAP: Record<ContentCategory, string[]> = {
  movie: ['cn', 'us', 'kr', 'jp', 'other'],
  tv: ['cn', 'us', 'kr', 'jp', 'other'],
  anime: ['jp', 'cn', 'other'],
  variety: ['cn', 'kr', 'other'],
  documentary: ['cn', 'us', 'other'],
}

/** 子分类显示标签 (API key → 中文名) */
export const SUB_LABELS: Record<string, string> = {
  cn: '中国',
  us: '美国',
  kr: '韩国',
  jp: '日本',
  other: '其他',
  all: '全部',
}

/** 分类显示标签 */
export const CATEGORY_LABELS: Record<ContentCategory, string> = {
  movie: '电影',
  tv: '电视剧',
  anime: '动漫',
  variety: '综艺',
  documentary: '纪录片',
}
