// src/core/playback/types/playback.types.ts - 智能源切换类型定义
// P4.2 Intelligent Source Switching

/** 播放源（封装播放所需的全部信息） */
export interface PlaybackSource {
  /** Provider 标识 */
  providerId: string
  /** Provider 显示名 */
  providerName: string
  /** 剧集标识 */
  episodeId: string
  /** 播放 URL */
  playUrl: string
  /** 优先级（越小越优先） */
  priority: number
}

/** 播放结果 */
export interface PlaybackResult {
  success: boolean
  source?: PlaybackSource
  error?: string
  /** 是否为自动切换 */
  autoSwitched?: boolean
}

/** 源切换事件 */
export enum SourceSwitchEvent {
  /** 正在切换源 */
  SWITCHING = 'switching',
  /** 切换成功 */
  SWITCHED = 'switched',
  /** 单源失败 */
  FAILED = 'failed',
  /** 所有源已耗尽 */
  EXHAUSTED = 'exhausted',
}

/** 源切换事件回调数据 */
export interface SourceSwitchEventData {
  event: SourceSwitchEvent
  fromSource?: string
  toSource?: string
  reason?: string
  remainingRetries?: number
}

/** 成功缓存条目 */
export interface SuccessCacheEntry {
  providerId: string
  timestamp: number
}
