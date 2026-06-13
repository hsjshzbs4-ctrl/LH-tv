// src/core/download/recovery/RecoveryManager.ts - 下载恢复引擎
// 职责：恢复任务检测、状态切换、调用 Legacy Downloader 重新下载
// 禁止：持久化、Storage、UI

import type { DownloadTask, LegacyDownloadResult } from '../types/download.types'

export class RecoveryManager {
  // ==================== 检测 ====================

  /**
   * 判断任务是否可恢复
   * - paused: true（可手动恢复）
   * - failed: true（可重试）
   * - recovering: false（已在恢复中）
   * - downloading: false（已在下载）
   * - completed: false（已完成）
   * - supportsResume === false: false（源不支持）
   */
  canRecover(task: DownloadTask): boolean {
    if (task.status === 'completed' || task.status === 'downloading' || task.status === 'recovering') {
      return false
    }
    if (task.status === 'pending') {
      return false
    }
    if (task.supportsResume === false) {
      return false
    }
    return task.status === 'paused' || task.status === 'failed'
  }

  // ==================== 恢复 ====================

  /**
   * 启动恢复下载
   * 调用 Legacy Downloader 的 downloadEpisode 重新开始下载
   * 返回新的 legacy 任务 ID
   */
  async recoverTask(task: DownloadTask): Promise<LegacyDownloadResult> {
    const legacyTask = {
      showName: task.title,
      episodeLabel: task.episodeLabel,
      episodeNum: task.episodeNum,
      url: task.sourceUrl,
      type: task.sourceUrl.includes('.m3u8') ? ('m3u8' as const) : ('mp4' as const),
    }

    return window.app.downloadEpisode(legacyTask)
  }

  // ==================== 标记 ====================

  /** 恢复成功后更新任务字段 */
  markRecovered(task: DownloadTask): void {
    task.resumeCount = (task.resumeCount || 0) + 1
    task.lastResumeAt = Date.now()
    task.supportsResume = true
    task.error = undefined
  }
}
