// src/core/favorites/manager/FavoritesManager.ts - 收藏管理器
// 职责：收藏 CRUD、搜索、订阅通知、持久化
// 禁止：UI、Provider、IPC

import { storageService } from '@/shared/storage/storage.service'
import type { FavoriteMedia } from '../types/favorite.types'

type Subscriber = () => void

export class FavoritesManager {
  /** 内存索引: mediaId → FavoriteMedia */
  private favorites: Map<string, FavoriteMedia> = new Map()

  /** 订阅者 */
  private subscribers: Set<Subscriber> = new Set()

  private loaded = false

  // ==================== 初始化 ====================

  /** 从 StorageService 加载收藏数据 */
  async initialize(): Promise<void> {
    if (this.loaded) return
    try {
      const items = await storageService.getFavorites()
      this.favorites.clear()
      for (const item of items) {
        this.favorites.set(item.mediaId, item)
      }
    } catch {
      // 加载失败保持空 Map
    }
    this.loaded = true
  }

  // ==================== CRUD ====================

  /** 添加收藏（重复收藏忽略） */
  async addFavorite(media: Omit<FavoriteMedia, 'favoritedAt'>): Promise<void> {
    if (!this.loaded) await this.initialize()

    if (this.favorites.has(media.mediaId)) return

    const record: FavoriteMedia = {
      ...media,
      favoritedAt: Date.now(),
    }
    this.favorites.set(media.mediaId, record)
    await this._save()
    this._notify()
  }

  /** 移除收藏 */
  async removeFavorite(mediaId: string): Promise<void> {
    if (!this.loaded) await this.initialize()

    if (!this.favorites.has(mediaId)) return
    this.favorites.delete(mediaId)
    await this._save()
    this._notify()
  }

  /** 切换收藏状态 */
  async toggleFavorite(media: Omit<FavoriteMedia, 'favoritedAt'>): Promise<void> {
    if (this.isFavorite(media.mediaId)) {
      await this.removeFavorite(media.mediaId)
    } else {
      await this.addFavorite(media)
    }
  }

  // ==================== 查询 ====================

  /** 判断是否已收藏 */
  isFavorite(mediaId: string): boolean {
    return this.favorites.has(mediaId)
  }

  /** 获取全部收藏（按 favoritedAt DESC 排序） */
  getFavorites(): FavoriteMedia[] {
    return Array.from(this.favorites.values()).sort(
      (a, b) => b.favoritedAt - a.favoritedAt,
    )
  }

  /** 搜索（标题，不区分大小写） */
  search(keyword: string): FavoriteMedia[] {
    if (!keyword.trim()) return this.getFavorites()
    const kw = keyword.toLowerCase()
    return this.getFavorites().filter((m) =>
      m.title.toLowerCase().includes(kw),
    )
  }

  // ==================== 订阅 ====================

  /** 订阅状态变更，返回取消函数 */
  subscribe(callback: Subscriber): () => void {
    this.subscribers.add(callback)
    return () => {
      this.subscribers.delete(callback)
    }
  }

  // ==================== 内部 ====================

  private async _save(): Promise<void> {
    try {
      await storageService.setFavorites(
        Array.from(this.favorites.values()),
      )
    } catch {
      // 静默失败
    }
  }

  private _notify(): void {
    this.subscribers.forEach((fn) => {
      try { fn() } catch { /* ignore */ }
    })
  }
}
