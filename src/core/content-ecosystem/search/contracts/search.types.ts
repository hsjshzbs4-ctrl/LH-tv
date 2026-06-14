// core/content-ecosystem/search/contracts/search.types.ts — CE7.1 Domain types
// SearchDocument, query/result types, index stats, aggregated search structures

import type { ExternalIds } from '@provider-contracts'

// ─── Search Document Type ───
export enum SearchDocumentType {
  MOVIE = 'movie',
  TV = 'tv',
  ANIME = 'anime',
}

// ─── Search Source ───
export type SearchSource = 'metadata' | 'server' | 'local'

// ─── Search Document ───
export interface SearchDocument {
  /** 唯一标识（source:sourceId:type 组合） */
  id: string

  /** 统一内容标识（用于 CE8 跨来源聚合去重），由 ContentIdentityService 生成 */
  contentId: string

  /** 主标题 */
  title: string

  /** 原始标题 */
  originalTitle?: string

  /** 别名列表 */
  aliases: string[]

  /** 内容类型 */
  type: SearchDocumentType

  /** 发行年份 */
  year?: number

  /** 类型标签 */
  genres: string[]

  /** 自定义标签 */
  tags: string[]

  /** 内容摘要 */
  overview?: string

  /** 外部 ID（TMDB/IMDB/Bangumi/TVMaze） */
  externalIds: ExternalIds

  /** 数据来源类型 */
  source: SearchSource

  /** 数据来源标识（如 'tmdb' / 'local-library' / 'jellyfin-1'） */
  sourceId: string

  /** 流行度 (0-100) */
  popularity: number

  /** 最后更新时间戳 */
  updatedAt: number
}

// ─── Parsed Query ───
export interface ParsedQuery {
  /** 主关键词 */
  keyword: string

  /** 原始 token 列表（用于倒排索引查找） */
  tokens: string[]

  /** 按类型筛选（未来扩展，预留） */
  type?: SearchDocumentType

  /** 按类型标签筛选（未来扩展，预留） */
  genres?: string[]

  /** 按年份筛选（未来扩展，预留） */
  year?: number
}

// ─── Search Options ───
export interface SearchOptions {
  /** 返回结果数上限，默认 20 */
  limit?: number

  /** 分页偏移，默认 0 */
  offset?: number

  /** 最低分数阈值，默认 10 */
  minScore?: number

  /** 按内容类型筛选 */
  type?: SearchDocumentType

  /** 按来源筛选 */
  sources?: SearchSource[]

  /** 按年份筛选 */
  year?: number
}

// ─── Match Type ───
export type MatchType = 'exact' | 'alias' | 'startsWith' | 'contains' | 'genre' | 'none'

// ─── Search Result (single document match) ───
export interface SearchResult {
  /** 匹配的文档 */
  doc: SearchDocument

  /** 综合评分 */
  score: number

  /** 匹配方式 */
  matchType: MatchType
}

// ─── Search Response (paginated) ───
export interface SearchResponse {
  /** 当前页结果 */
  items: SearchResult[]

  /** 满足条件的总数（用于分页 UI） */
  total: number

  /** 是否还有更多结果 */
  hasMore: boolean

  /** 搜索耗时 (ms) */
  searchTimeMs: number
}

// ─── Aggregated Search Result (CE8 cross-source dedup) ───
export interface AggregatedSearchResult {
  /** 统一内容标识 */
  contentId: string

  /** 显示标题 */
  title: string

  /** 内容类型 */
  type: SearchDocumentType

  /** 发行年份 */
  year?: number

  /** 封面图（来自最高分来源） */
  cover?: string

  /** 内容摘要（来自最高分来源） */
  overview?: string

  /** 类型标签（合并去重） */
  genres: string[]

  /** 各来源信息 */
  sources: AggregatedSource[]

  /** 最佳评分 */
  bestScore: number

  /** 是否在媒体服务器上可用 */
  availableOnServers: boolean

  /** 是否本地可用 */
  availableLocally: boolean
}

/** 聚合结果中的单个来源信息 */
export interface AggregatedSource {
  source: SearchSource
  sourceId: string
  title: string
  score: number
}

// ─── Aggregated Search Response ───
export interface AggregatedSearchResponse {
  /** 聚合后的结果 */
  items: AggregatedSearchResult[]

  /** 聚合前原始文档数 */
  rawDocumentCount: number

  /** 聚合后唯一内容数 */
  uniqueContentCount: number

  /** 搜索耗时 (ms) */
  searchTimeMs: number

  /** 是否还有更多结果 */
  hasMore: boolean
}

// ─── Index Stats ───
export interface IndexStats {
  /** 索引文档总数 */
  totalDocuments: number

  /** contentId 去重后的唯一内容数 */
  uniqueContentCount: number

  /** 有相同 contentId 的文档数（跨来源重复） */
  duplicateContentCount: number

  /** 估算内存占用 (bytes) */
  indexSizeBytes: number

  /** 按来源分布 */
  bySource: Record<string, number>

  /** 按类型分布 */
  byType: Record<string, number>

  /** 最后构建时间戳 */
  lastBuiltAt: number

  /** 构建耗时 (ms) */
  buildTimeMs: number
}
