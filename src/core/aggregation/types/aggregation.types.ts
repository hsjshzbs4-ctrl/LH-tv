// src/core/aggregation/types/aggregation.types.ts - 聚合引擎类型定义
// P4.1 Multi-Source Aggregation Engine

/** Provider 健康状态 */
export enum ProviderHealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  OFFLINE = 'offline',
  /** P4.4: 超过最大重启次数，永久失效 */
  FAILED = 'failed',
}

/** Provider 评分数据 */
export interface ProviderScore {
  providerId: string
  /** 成功率 0-1 */
  successRate: number
  /** 平均响应时间 ms */
  responseTime: number
  /** Provider 配置优先级 */
  priority: number
}

/** 聚合搜索结果项（单条结果，含来源 Provider 列表） */
export interface AggregatedSearchItem {
  mediaId: string
  title: string
  cover: string
  description?: string
  /** 贡献此结果的 Provider ID 列表 */
  providerIds: string[]
}

/** 聚合搜索响应 */
export interface AggregatedSearchResponse {
  items: AggregatedSearchItem[]
  /** 所有贡献结果的 Provider ID */
  providers: string[]
  /** 结果总数 */
  totalResults: number
}

/** 聚合详情中的单个数据源 */
export interface MediaDetailSource {
  providerId: string
  providerName: string
  episodes: Array<{
    id: string
    title: string
    episodeNumber?: number
  }>
}

/** 聚合媒体详情（多 Provider 源聚合） */
export interface AggregatedMediaDetail {
  mediaId: string
  title: string
  cover: string
  description: string
  /** 多个 Provider 源 */
  sources: MediaDetailSource[]
  /** 所有提供数据的 Provider ID */
  providerIds: string[]
}

/** 健康状态快照 */
export interface ProviderHealthSnapshot {
  providerId: string
  providerName: string
  status: ProviderHealthStatus
  consecutiveFailures: number
  consecutiveSuccesses: number
  lastCheck: number
}
