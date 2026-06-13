// src/core/offline/types/offline.types.ts - 离线媒体类型

/** 离线媒体记录 */
export interface OfflineMedia {
  /** 离线记录 ID */
  id: string

  /** 影视 ID（来自 ShowDetail.id） */
  mediaId: string

  /** 剧集 ID */
  episodeId: string

  /** 提供源标识 */
  providerId: string

  /** 影视标题 */
  title: string

  /** 封面图 URL */
  cover: string

  /** 剧集标签（如 "第12集"） */
  episodeLabel: string

  /** 本地文件路径 */
  localFilePath: string

  /** 文件大小（字节） */
  fileSize: number

  /** 下载完成时间戳 */
  downloadedAt: number

  /** 本地文件是否存在（启动时校验） */
  exists: boolean
}
