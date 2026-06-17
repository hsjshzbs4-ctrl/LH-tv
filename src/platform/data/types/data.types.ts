// src/platform/data/types/data.types.ts — S5-6 Data Platform 核心类型

/** 统一事件信封 — 所有数据源的标准格式 */
export interface UnifiedEvent {
  /** 事件唯一 ID */
  id: string
  /** 事件类别 */
  category: EventCategory
  /** 事件名称 */
  name: string
  /** 事件发生时间 */
  timestamp: number
  /** 来源子系统 */
  source: EventSource
  /** 事件载荷 */
  payload: Record<string, unknown>
}

/** 事件类别 */
export enum EventCategory {
  PLAYBACK = 'playback',
  RECOVERY = 'recovery',
  PERFORMANCE = 'performance',
  ENGAGEMENT = 'engagement',
  RECOMMENDATION = 'recommendation',
  SYSTEM = 'system',
}

/** 事件来源 */
export enum EventSource {
  PLAYER = 'player',
  TELEMETRY = 'telemetry',
  RECOMMENDATION = 'recommendation',
  SESSION = 'session',
  CRASH = 'crash',
  SEARCH = 'search',
}

/** 摄入源接口 — 每个外部数据源实现此接口 */
export interface IIngestionSource {
  readonly name: string
  readonly source: EventSource

  /** 启动摄入 */
  start(): Promise<void>
  /** 停止摄入 */
  stop(): Promise<void>
  /** 注册事件处理器 */
  onEvent(handler: (event: UnifiedEvent) => void): () => void
}

/** 每日指标快照 */
export interface DailyMetrics {
  date: string
  totalEvents: number
  activeUsers: number
  totalWatchTimeMs: number
  playbackStarts: number
  playbackErrors: number
  crashCount: number
  recoveryCount: number
  avgSessionDurationMs: number
  categoryBreakdown: Record<string, number>
}

/** 实时指标 */
export interface RealtimeMetrics {
  timestamp: number
  eventsPerMinute: number
  activeUsersLast5Min: number
  errorsLast5Min: number
  ingestBacklog: number
}

/** 数据管线配置 */
export interface DataPipelineConfig {
  /** 最大缓冲区大小 */
  maxBufferSize: number
  /** 自动刷新间隔 (ms) */
  flushIntervalMs: number
  /** 是否自动启动 */
  autoStart: boolean
}

export const DEFAULT_PIPELINE_CONFIG: DataPipelineConfig = {
  maxBufferSize: 500,
  flushIntervalMs: 30000,
  autoStart: false,
}
