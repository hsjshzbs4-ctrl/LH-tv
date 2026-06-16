// src/content/favoriteService.ts — PB1.5 收藏服务
// 包装 favoritesFacade

import { favoritesFacade } from '@/core/favorites'
import type { FavoriteMedia } from '@/core/favorites/types/favorite.types'
import type { MediaItem } from '@provider-contracts'

/** 将 MediaItem 转为 FavoriteMedia 输入 */
function mediaToFavoriteInput(media: MediaItem): Omit<FavoriteMedia, 'favoritedAt'> {
  return {
    id: media.id,
    mediaId: media.id,
    providerId: media.providerId,
    title: media.title,
    cover: media.cover,
    description: media.remark || '',
    category: media.type,
  }
}

export class FavoriteService {
  /** 添加收藏 */
  async addFavorite(media: MediaItem): Promise<void> {
    const input = mediaToFavoriteInput(media)
    return favoritesFacade.addFavorite(input)
  }

  /** 移除收藏 */
  async removeFavorite(mediaId: string): Promise<void> {
    return favoritesFacade.removeFavorite(mediaId)
  }

  /** 切换收藏状态 */
  async toggleFavorite(media: MediaItem): Promise<void> {
    const input = mediaToFavoriteInput(media)
    return favoritesFacade.toggleFavorite(input)
  }

  /** 判断是否已收藏 */
  isFavorite(mediaId: string): boolean {
    return favoritesFacade.isFavorite(mediaId)
  }

  /** 获取全部收藏列表 */
  getFavorites(): FavoriteMedia[] {
    return favoritesFacade.getFavorites()
  }

  /** 搜索收藏 */
  search(keyword: string): FavoriteMedia[] {
    return favoritesFacade.search(keyword)
  }

  /** 订阅变更 */
  subscribe(callback: () => void): () => void {
    return favoritesFacade.subscribe(callback)
  }
}

/** 全局单例 */
export const favoriteService = new FavoriteService()
