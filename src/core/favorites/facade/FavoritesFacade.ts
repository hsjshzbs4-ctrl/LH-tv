// src/core/favorites/facade/FavoritesFacade.ts - 收藏 View 入口
// View 禁止直接访问 FavoritesManager

import { FavoritesManager } from '../manager/FavoritesManager'
import type { FavoriteMedia } from '../types/favorite.types'

export class FavoritesFacade {
  private manager = new FavoritesManager()

  /** 初始化 */
  async initialize(): Promise<void> {
    return this.manager.initialize()
  }

  /** 添加收藏 */
  async addFavorite(media: Omit<FavoriteMedia, 'favoritedAt'>): Promise<void> {
    return this.manager.addFavorite(media)
  }

  /** 移除收藏 */
  async removeFavorite(mediaId: string): Promise<void> {
    return this.manager.removeFavorite(mediaId)
  }

  /** 切换收藏 */
  async toggleFavorite(media: Omit<FavoriteMedia, 'favoritedAt'>): Promise<void> {
    return this.manager.toggleFavorite(media)
  }

  /** 判断是否已收藏 */
  isFavorite(mediaId: string): boolean {
    return this.manager.isFavorite(mediaId)
  }

  /** 获取全部收藏 */
  getFavorites(): FavoriteMedia[] {
    return this.manager.getFavorites()
  }

  /** 搜索 */
  search(keyword: string): FavoriteMedia[] {
    return this.manager.search(keyword)
  }

  /** 订阅 */
  subscribe(callback: () => void): () => void {
    return this.manager.subscribe(callback)
  }
}

/** 全局单例 */
export const favoritesFacade = new FavoritesFacade()
