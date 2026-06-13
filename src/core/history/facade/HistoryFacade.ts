// src/core/history/facade/HistoryFacade.ts - 观看历史 View 入口

import { HistoryManager } from '../manager/HistoryManager'
import type { WatchHistoryItem } from '../types/history.types'

export class HistoryFacade {
  private manager = new HistoryManager()

  async initialize(): Promise<void> { return this.manager.initialize() }
  async recordHistory(item: WatchHistoryItem): Promise<void> { return this.manager.recordHistory(item) }
  async updateProgress(episodeId: string, currentTime: number, duration: number): Promise<void> { return this.manager.updateProgress(episodeId, currentTime, duration) }
  async removeHistory(episodeId: string): Promise<void> { return this.manager.removeHistory(episodeId) }
  async clearHistory(): Promise<void> { return this.manager.clearHistory() }
  getHistory(): WatchHistoryItem[] { return this.manager.getHistory() }
  getByEpisode(episodeId: string): WatchHistoryItem | null { return this.manager.getByEpisode(episodeId) }
  search(keyword: string): WatchHistoryItem[] { return this.manager.search(keyword) }
  subscribe(callback: () => void): () => void { return this.manager.subscribe(callback) }
}

export const historyFacade = new HistoryFacade()
