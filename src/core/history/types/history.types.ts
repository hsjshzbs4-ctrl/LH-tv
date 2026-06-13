// src/core/history/types/history.types.ts - 观看历史类型

export interface WatchHistoryItem {
  /** 历史记录 ID */
  id: string

  /** 媒体 ID */
  mediaId: string

  /** 剧集 ID */
  episodeId: string

  /** 提供源标识 */
  providerId: string

  /** 影视标题 */
  title: string

  /** 封面图 URL */
  cover: string

  /** 剧集标签 */
  episodeLabel: string

  /** 视频总时长（秒） */
  duration: number

  /** 当前播放位置（秒） */
  currentTime: number

  /** 播放进度 0-1 */
  progress: number

  /** 最后观看时间 */
  lastWatchedAt: number
}
