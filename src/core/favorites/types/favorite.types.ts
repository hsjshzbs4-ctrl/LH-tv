// src/core/favorites/types/favorite.types.ts - 收藏类型

/** 收藏媒体 */
export interface FavoriteMedia {
  /** 收藏记录 ID */
  id: string

  /** 媒体 ID（来自 ShowDetail.id） */
  mediaId: string

  /** 提供源标识 */
  providerId: string

  /** 影视标题 */
  title: string

  /** 封面图 URL */
  cover: string

  /** 描述 */
  description?: string

  /** 分类 */
  category?: string

  /** 收藏时间 */
  favoritedAt: number
}
