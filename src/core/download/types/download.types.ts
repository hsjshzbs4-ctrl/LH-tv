// src/core/download/types/download.types.ts - 下载模块类型定义

/** 下载状态 */
export type DownloadStatus =
  | 'pending'
  | 'downloading'
  | 'paused'
  | 'recovering'
  | 'completed'
  | 'failed'

/** 下载任务（Manager 内部模型） */
export interface DownloadTask {
  /** Manager 内部 ID */
  id: string

  /** legacy downloader 分配的任务 ID（启动下载后回填） */
  legacyId?: string

  /** 媒体 ID（来自 ShowDetail.id） */
  mediaId: string

  /** 提供源标识（如 siteKey） */
  providerId: string

  /** 提供源名称（如 siteName） */
  providerName: string

  /** 剧集 ID */
  episodeId: string

  /** 剧集标签（如 "第01集"） */
  episodeLabel: string

  /** 剧集序号 */
  episodeNum: number

  /** 影视标题 */
  title: string

  /** 封面图 URL */
  cover: string

  /** 视频源 URL */
  sourceUrl: string

  /** 下载状态 */
  status: DownloadStatus

  /** 下载进度 0-100 */
  progress: number

  /** 下载速度 (bytes/s)，暂不可用 */
  speed: number

  /** 已下载字节数，暂不可用 */
  downloadedBytes: number

  /** 总字节数，暂不可用 */
  totalBytes: number

  /** 本地文件路径（下载完成后设置） */
  localFilePath?: string

  /** 错误信息 */
  error?: string

  /** 是否支持恢复下载 */
  supportsResume: boolean

  /** 恢复次数 */
  resumeCount: number

  /** 最近恢复时间 */
  lastResumeAt?: number

  /** 创建时间戳 */
  createdAt: number

  /** 最后更新时间戳 */
  updatedAt: number
}

/** 下载进度更新 */
export interface DownloadProgress {
  progress: number
  speed: number
  downloadedBytes: number
  totalBytes: number
}

/** 创建下载任务的参数（View → Facade） */
export interface CreateDownloadTaskParams {
  mediaId: string
  providerId: string
  providerName: string
  episodeId: string
  episodeLabel: string
  episodeNum: number
  title: string
  cover: string
  sourceUrl: string
}

/** legacy downloader 返回的任务启动结果 */
export interface LegacyDownloadResult {
  id: string
  status: string
}

/** legacy downloader 进度事件数据 */
export interface LegacyProgressData {
  id: string
  progress: number
  detail: string
}

/** legacy downloader 完成事件数据 */
export interface LegacyCompleteData {
  id: string
  filePath: string
  showName: string
  episodeLabel: string
}

/** legacy downloader 错误事件数据 */
export interface LegacyErrorData {
  id: string
  error: string
}
