// src/content/categoryService.ts — PB1.5 分类浏览服务
// 将 ContentCategory 映射到 Provider 调用

import { providerFacade } from '@/core/providers'
import type { MediaItem } from '@provider-contracts'
import type { ContentCategory } from './contentTypes'
import { CATEGORY_SUB_MAP, CATEGORY_LABELS } from './contentTypes'

/** 分类 → Provider ID 映射 */
const CATEGORY_PROVIDER_MAP: Record<ContentCategory, string> = {
  movie: 'applecms',
  tv: 'applecms',
  anime: 'anime-crawler',
  variety: 'applecms',
  documentary: 'applecms',
}

export class CategoryService {
  /** 获取某个分类的内容 */
  async getCategory(category: ContentCategory, sub?: string): Promise<MediaItem[]> {
    const providerId = CATEGORY_PROVIDER_MAP[category]
    if (!providerId) return []

    const subCategory = sub || CATEGORY_SUB_MAP[category][0] || 'all'

    try {
      const items = await providerFacade.catalog(providerId, category, subCategory)
      // HOTFIX-001: 客户端二次过滤 — 确保只返回匹配分类的内容
      return items.filter(item => {
        const itemType = item.type || ''
        if (!itemType) return true // 没有 type 信息的保留
        // 统一映射: movie→movie, tv→tv, anime→anime
        const normalizedType = itemType.toLowerCase()
        return normalizedType === category
      })
    } catch {
      return []
    }
  }

  /** 获取分类的子类列表 */
  getSubCategories(category: ContentCategory): string[] {
    return CATEGORY_SUB_MAP[category] || []
  }

  /** 获取分类标签 */
  getCategoryLabel(category: ContentCategory): string {
    return CATEGORY_LABELS[category]
  }

  /** 获取所有分类 */
  getAllCategories(): ContentCategory[] {
    return ['movie', 'tv', 'anime', 'variety', 'documentary']
  }

  /** 从所有 Provider 聚合分类内容 */
  async getCategoryAll(category: ContentCategory, sub?: string): Promise<MediaItem[]> {
    const subCategory = sub || CATEGORY_SUB_MAP[category][0] || 'all'

    try {
      return await providerFacade.catalogAll(category, subCategory)
    } catch {
      return []
    }
  }
}

/** 全局单例 */
export const categoryService = new CategoryService()
