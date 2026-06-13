// src/core/history/manager/HistoryManager.ts - 观看历史管理器
// 职责：历史 CRUD、进度更新、搜索、订阅通知、持久化
// 禁止：UI、Provider、IPC

import { storageService } from '@/shared/storage/storage.service'
import type { WatchHistoryItem } from '../types/history.types'

type Subscriber = () => void

export class HistoryManager {
  /** episodeId → WatchHistoryItem */
  private history: Map<string, WatchHistoryItem> = new Map()
  private subscribers: Set<Subscriber> = new Set()
  private loaded = false

  // ==================== 初始化 ====================

  async initialize(): Promise<void> {
    if (this.loaded) return
    try {
      const items = await storageService.getHistory()
      this.history.clear()
      for (const item of items) {
        this.history.set(item.episodeId, item)
      }
    } catch { /* ignore */ }
    this.loaded = true
  }

  // ==================== CRUD ====================

  /** 记录/更新播放历史 */
  async recordHistory(item: WatchHistoryItem): Promise<void> {
    if (!this.loaded) await this.initialize()
    this.history.set(item.episodeId, { ...item, lastWatchedAt: Date.now() })
    await this._save()
    this._notify()
  }

  /** 更新播放进度 */
  async updateProgress(episodeId: string, currentTime: number, duration: number): Promise<void> {
    if (!this.loaded) await this.initialize()
    const item = this.history.get(episodeId)
    if (!item) return

    const progress = duration > 0 ? currentTime / duration : 0
    item.currentTime = currentTime
    item.duration = duration
    item.progress = Math.max(0, Math.min(1, progress))
    item.lastWatchedAt = Date.now()

    // 播放完成 (≥98%) → 自动移除
    if (item.progress >= 0.98) {
      this.history.delete(episodeId)
    }

    await this._save()
    this._notify()
  }

  /** 删除单条历史 */
  async removeHistory(episodeId: string): Promise<void> {
    if (!this.loaded) await this.initialize()
    this.history.delete(episodeId)
    await this._save()
    this._notify()
  }

  /** 清空全部历史 */
  async clearHistory(): Promise<void> {
    this.history.clear()
    await this._save()
    this._notify()
  }

  // ==================== 查询 ====================

  /** 获取全部历史（lastWatchedAt DESC） */
  getHistory(): WatchHistoryItem[] {
    return Array.from(this.history.values()).sort(
      (a, b) => b.lastWatchedAt - a.lastWatchedAt,
    )
  }

  /** 按 episodeId 查找 */
  getByEpisode(episodeId: string): WatchHistoryItem | null {
    return this.history.get(episodeId) || null
  }

  /** 搜索（标题，不区分大小写） */
  search(keyword: string): WatchHistoryItem[] {
    if (!keyword.trim()) return this.getHistory()
    const kw = keyword.toLowerCase()
    return this.getHistory().filter((h) =>
      h.title.toLowerCase().includes(kw),
    )
  }

  // ==================== 订阅 ====================

  subscribe(callback: Subscriber): () => void {
    this.subscribers.add(callback)
    return () => { this.subscribers.delete(callback) }
  }

  // ==================== 内部 ====================

  private async _save(): Promise<void> {
    try {
      await storageService.setHistory(Array.from(this.history.values()))
    } catch { /* ignore */ }
  }

  private _notify(): void {
    this.subscribers.forEach((fn) => { try { fn() } catch { /* ignore */ } })
  }
}
