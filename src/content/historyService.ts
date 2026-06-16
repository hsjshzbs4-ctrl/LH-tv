// src/content/historyService.ts — PB1.5 观看历史服务
// 包装 historyFacade

import { historyFacade } from '@/core/history'
import type { WatchHistoryItem } from '@/core/history/types/history.types'
import type { MediaItem, MediaEpisode } from '@provider-contracts'

export class HistoryService {
  /** 记录播放历史 */
  async recordHistory(
    media: MediaItem,
    episode: MediaEpisode,
    currentTime: number,
    duration: number,
  ): Promise<void> {
    const progress = duration > 0 ? currentTime / duration : 0
    const item: WatchHistoryItem = {
      id: `${media.id}:${episode.id}`,
      mediaId: media.id,
      episodeId: episode.id,
      providerId: media.providerId,
      title: media.title,
      cover: media.cover,
      episodeLabel: episode.title || `第${episode.episodeNumber || '?'}集`,
      duration,
      currentTime,
      progress: Math.min(progress, 1),
      lastWatchedAt: Date.now(),
    }
    return historyFacade.recordHistory(item)
  }

  /** 更新播放进度 */
  async updateProgress(episodeId: string, currentTime: number, duration: number): Promise<void> {
    return historyFacade.updateProgress(episodeId, currentTime, duration)
  }

  /** 移除单条历史记录 */
  async removeHistory(episodeId: string): Promise<void> {
    return historyFacade.removeHistory(episodeId)
  }

  /** 清空全部历史 */
  async clearHistory(): Promise<void> {
    return historyFacade.clearHistory()
  }

  /** 获取全部观看历史 */
  getHistory(): WatchHistoryItem[] {
    return historyFacade.getHistory()
  }

  /** 获取继续观看列表（去重，每部影视取最近一条） */
  getContinueWatching(): WatchHistoryItem[] {
    const all = historyFacade.getHistory()
    const seen = new Map<string, WatchHistoryItem>()

    // 按最后观看时间降序排列
    const sorted = [...all].sort((a, b) => b.lastWatchedAt - a.lastWatchedAt)

    for (const item of sorted) {
      // 每部影视只保留最近观看的一个剧集
      if (!seen.has(item.mediaId)) {
        seen.set(item.mediaId, item)
      }
    }

    return Array.from(seen.values())
  }

  /** 获取某个剧集的播放位置 */
  getPlaybackPosition(episodeId: string): number {
    const item = historyFacade.getByEpisode(episodeId)
    return item?.currentTime || 0
  }

  /** 搜索历史记录 */
  search(keyword: string): WatchHistoryItem[] {
    return historyFacade.search(keyword)
  }

  /** 订阅变更 */
  subscribe(callback: () => void): () => void {
    return historyFacade.subscribe(callback)
  }
}

/** 全局单例 */
export const historyService = new HistoryService()
