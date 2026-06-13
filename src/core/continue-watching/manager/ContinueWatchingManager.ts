// src/core/continue-watching/manager/ContinueWatchingManager.ts
// 职责：从 HistoryFacade 聚合「继续观看」列表（纯内存，不持久化）
// 聚合规则：同一 mediaId 保留最近观看集数（lastWatchedAt 最大）

import { historyFacade } from '@/core/history'
import type { ContinueWatchingItem } from '../types/continue.types'

type Subscriber = () => void

export class ContinueWatchingManager {
  private cache: Map<string, ContinueWatchingItem> = new Map()
  private subscribers: Set<Subscriber> = new Set()
  private readonly maxItems = 20
  private unsubHistory: (() => void) | null = null

  // ==================== 初始化 ====================

  async initialize(): Promise<void> {
    await historyFacade.initialize()
    this.refresh()

    // 监听历史变更 → 自动刷新
    this.unsubHistory = historyFacade.subscribe(() => {
      this.refresh()
    })
  }

  // ==================== 刷新 ====================

  refresh(): void {
    this.cache.clear()
    const history = historyFacade.getHistory()

    for (const h of history) {
      // 过滤：未开始 (progress=0) 或已看完 (≥98%)
      if (h.progress <= 0 || h.progress >= 0.98) continue

      const existing = this.cache.get(h.mediaId)
      if (!existing || h.lastWatchedAt > existing.lastWatchedAt) {
        this.cache.set(h.mediaId, {
          mediaId: h.mediaId,
          episodeId: h.episodeId,
          providerId: h.providerId,
          title: h.title,
          cover: h.cover,
          episodeLabel: h.episodeLabel,
          duration: h.duration,
          currentTime: h.currentTime,
          progress: h.progress,
          lastWatchedAt: h.lastWatchedAt,
        })
      }
    }
    this._notify()
  }

  // ==================== 查询 ====================

  /** 获取继续观看列表（lastWatchedAt DESC，最多 20 条） */
  getContinueWatching(): ContinueWatchingItem[] {
    return Array.from(this.cache.values())
      .sort((a, b) => b.lastWatchedAt - a.lastWatchedAt)
      .slice(0, this.maxItems)
  }

  /** 按 mediaId 查找 */
  getByMedia(mediaId: string): ContinueWatchingItem | null {
    return this.cache.get(mediaId) || null
  }

  // ==================== 订阅 ====================

  subscribe(callback: Subscriber): () => void {
    this.subscribers.add(callback)
    return () => { this.subscribers.delete(callback) }
  }

  destroy(): void {
    this.unsubHistory?.()
    this.subscribers.clear()
  }

  // ==================== 内部 ====================

  private _notify(): void {
    this.subscribers.forEach((fn) => { try { fn() } catch { /* ignore */ } })
  }
}
