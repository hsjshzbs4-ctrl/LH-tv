// src/player/continueWatchingUX.ts — PB3-S1 Continue Watching UX
// 包装 ResumeManager（FROZEN），新增最近观看 UX 状态

import type { MediaEpisode } from '@provider-contracts'
import type { ResumeManager } from './resumeManager'

export interface RecentWatchItem {
  mediaId: string
  episodeId: string
  title: string
  episodeTitle: string
  progress: number       // 0-1
  progressPercent: number // 0-100
  lastPosition: number
  lastWatchedAt: number   // timestamp
}

export class ContinueWatchingUX {
  private resumeManager: ResumeManager
  private _recentItems: RecentWatchItem[] = []

  get recentItems(): Readonly<RecentWatchItem[]> { return this._recentItems }

  constructor(resumeManager: ResumeManager) {
    this.resumeManager = resumeManager
    this._loadFromStorage()
  }

  /** 添加/更新最近观看记录 */
  trackWatching(
    mediaId: string,
    episodeId: string,
    title: string,
    episode: MediaEpisode,
    currentTime: number,
    duration: number,
  ): void {
    const progress = duration > 0 ? currentTime / duration : 0
    const existing = this._recentItems.findIndex(i => i.episodeId === episodeId)

    const item: RecentWatchItem = {
      mediaId,
      episodeId,
      title,
      episodeTitle: episode.title || `第${episode.episodeNumber}集`,
      progress: Math.min(progress, 1),
      progressPercent: Math.round(progress * 100),
      lastPosition: currentTime,
      lastWatchedAt: Date.now(),
    }

    if (existing >= 0) {
      this._recentItems[existing] = item
    } else {
      this._recentItems.unshift(item)
    }

    // 最多保留 50 条
    if (this._recentItems.length > 50) {
      this._recentItems = this._recentItems.slice(0, 50)
    }

    this._saveToStorage()
  }

  /** 获取可继续观看的列表（进度 > 5% 且 < 95%） */
  getResumable(): RecentWatchItem[] {
    return this._recentItems.filter(
      i => i.progress > 0.05 && i.progress < 0.95,
    )
  }

  private _loadFromStorage(): void {
    try {
      const raw = localStorage.getItem('pb3.continueWatching')
      if (raw) this._recentItems = JSON.parse(raw)
    } catch { /* 静默 */ }
  }

  private _saveToStorage(): void {
    try {
      localStorage.setItem('pb3.continueWatching', JSON.stringify(this._recentItems))
    } catch { /* 静默 */ }
  }
}
