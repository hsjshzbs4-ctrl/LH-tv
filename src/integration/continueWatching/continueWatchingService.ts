// src/integration/continueWatching/continueWatchingService.ts — PB2-S2 Continue Watching 集成

import { continueWatchingFacade } from '@/core/continue-watching'
import { historyFacade } from '@/core/history'
import { integrationEvents, IntegrationEvent } from '../events/integrationEvents'
import { createResumeCard } from './resumeCard'
import type { ResumeCard } from './resumeCard'
import type { WatchHistoryItem } from '@/core/history/types/history.types'

export class ContinueWatchingService {
  /** 获取继续观看列表 */
  getRecentEpisodes(limit: number = 20) {
    return continueWatchingFacade.getContinueWatching().slice(0, limit)
  }

  /** 获取单个媒体的 Resume Card */
  getResumeCard(mediaId: string, episodeId?: string): ResumeCard | null {
    const items = continueWatchingFacade.getContinueWatching()
    let item: WatchHistoryItem | undefined

    if (episodeId) {
      item = historyFacade.getByEpisode(episodeId) || undefined
    }
    if (!item) {
      item = items.find(i => i.mediaId === mediaId) as WatchHistoryItem | undefined
    }

    return createResumeCard(item || null)
  }

  /** 同步历史 → 继续观看 */
  syncWithHistory(): void {
    continueWatchingFacade.refresh()
    integrationEvents.emit(IntegrationEvent.WATCH_HISTORY_UPDATED, {
      count: continueWatchingFacade.getContinueWatching().length,
    })
  }

  /** 订阅继续观看变更 */
  subscribe(callback: () => void): () => void {
    return continueWatchingFacade.subscribe(callback)
  }
}

export const continueWatchingService = new ContinueWatchingService()
