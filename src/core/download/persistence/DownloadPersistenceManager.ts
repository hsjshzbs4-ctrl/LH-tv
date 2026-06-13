// src/core/download/persistence/DownloadPersistenceManager.ts - 下载任务持久化
// 职责：将 DownloadManager 的任务状态持久化到 StorageService，支持应用重启恢复
// 禁止导入其他下载模块（仅依赖 StorageService + types）

import { storageService } from '@/shared/storage/storage.service'
import type { DownloadTask } from '../types/download.types'

export class DownloadPersistenceManager {
  private saveTimer: ReturnType<typeof setTimeout> | null = null
  private readonly debounceMs = 500

  // ==================== 加载 ====================

  /**
   * 从 StorageService 加载下载历史
   * 返回空数组如果数据不存在（向后兼容）
   */
  async load(): Promise<DownloadTask[]> {
    try {
      const tasks = await storageService.getDownloadHistory()
      if (!Array.isArray(tasks)) return []
      return tasks
    } catch {
      return []
    }
  }

  // ==================== 保存 ====================

  /**
   * 立即保存（跳过防抖）
   */
  async save(tasks: DownloadTask[]): Promise<void> {
    try {
      await storageService.setDownloadHistory(tasks)
    } catch {
      // 静默失败
    }
  }

  /**
   * 防抖保存（最大 2 次/秒）
   */
  scheduleSave(tasks: DownloadTask[]): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer)
    }
    this.saveTimer = setTimeout(() => {
      this.save(tasks)
      this.saveTimer = null
    }, this.debounceMs)
  }

  // ==================== 清理 ====================

  /** 刷新待处理的保存 */
  async flush(): Promise<void> {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer)
      this.saveTimer = null
    }
  }
}
