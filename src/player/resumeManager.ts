// src/player/resumeManager.ts — PB2-S1 Resume Manager
// 管理播放位置的保存/恢复，复用 historyFacade

import { historyFacade } from '@/core/history'

const RESUME_KEY = 'player.resume'

interface ResumeRecord {
  mediaId: string
  episodeId: string
  position: number
  duration: number
  updatedAt: number
}

export class ResumeManager {
  private minPosition: number

  constructor(minPosition: number = 30) {
    this.minPosition = minPosition
  }

  /** 保存位置（持久化到 localStorage + 委托 historyFacade） */
  async savePosition(
    mediaId: string,
    episodeId: string,
    currentTime: number,
    duration: number,
  ): Promise<void> {
    if (currentTime < this.minPosition) return

    const record: ResumeRecord = {
      mediaId,
      episodeId,
      position: currentTime,
      duration,
      updatedAt: Date.now(),
    }

    try {
      localStorage.setItem(RESUME_KEY, JSON.stringify(record))
      await historyFacade.updateProgress(episodeId, currentTime, duration)
    } catch { /* 静默 */ }
  }

  /** 加载保存的位置 */
  async loadPosition(episodeId: string): Promise<number> {
    try {
      const raw = localStorage.getItem(RESUME_KEY)
      if (!raw) return 0
      const record: ResumeRecord = JSON.parse(raw)
      if (record.episodeId !== episodeId) return 0
      return record.position
    } catch {
      return 0
    }
  }

  /** 是否应该恢复播放（进度 > minPosition 秒） */
  shouldResume(position: number): boolean {
    return position > this.minPosition
  }

  /** 清除保存的位置 */
  async clearPosition(): Promise<void> {
    try {
      localStorage.removeItem(RESUME_KEY)
    } catch { /* 静默 */ }
  }
}
