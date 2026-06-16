// src/content/mediaLibrary.ts — PB1.5 统一媒体库访问层
// 包装 providerFacade，提供 search/getHome/getTrending/getLatest/getDetail

import { providerFacade } from '@/core/providers'
import type { MediaItem, MediaDetail, AggregatedSearchResult } from '@provider-contracts'
import type { HomeSection, ContentCategory, DetailResult } from './contentTypes'
import { CATEGORY_LABELS } from './contentTypes'

/** Provider ID 映射：将分类映射到默认 Provider */
const CATEGORY_PROVIDER_MAP: Partial<Record<ContentCategory, string>> = {
  movie: 'applecms',
  tv: 'applecms',
  anime: 'anime-crawler',
  variety: 'applecms',
  documentary: 'applecms',
}

export class MediaLibraryService {
  /** 关键词搜索（多 Provider 聚合，自动去重排序） */
  async search(keyword: string): Promise<AggregatedSearchResult> {
    return providerFacade.search(keyword)
  }

  /** 获取首页内容区块 */
  async getHome(): Promise<HomeSection[]> {
    const categories: ContentCategory[] = ['movie', 'tv', 'anime']
    const sections = await Promise.allSettled(
      categories.map(async (category): Promise<HomeSection> => {
        const sub = category === 'anime' ? 'all' : 'cn'
        const items = await this.getTrending(category, sub, 20)
        return {
          category,
          label: CATEGORY_LABELS[category],
          items,
        }
      })
    )

    return sections
      .filter((r): r is PromiseFulfilledResult<HomeSection> => r.status === 'fulfilled')
      .map(r => r.value)
  }

  /** 获取热门内容 */
  async getTrending(category: ContentCategory, sub: string = 'cn', limit: number = 20): Promise<MediaItem[]> {
    const providerId = CATEGORY_PROVIDER_MAP[category]
    if (!providerId) return []

    try {
      const items = await providerFacade.catalog(providerId, category, sub)
      return items
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, limit)
    } catch {
      return []
    }
  }

  /** 获取最新内容 */
  async getLatest(category: ContentCategory, sub: string = 'cn', limit: number = 20): Promise<MediaItem[]> {
    const providerId = CATEGORY_PROVIDER_MAP[category]
    if (!providerId) return []

    try {
      const items = await providerFacade.catalog(providerId, category, sub)
      return items
        .sort((a, b) => (b.year || 0) - (a.year || 0))
        .slice(0, limit)
    } catch {
      return []
    }
  }

  /** 获取媒体详情 */
  async getDetail(providerId: string, mediaId: string): Promise<DetailResult> {
    const detail: MediaDetail = await providerFacade.detail(providerId, mediaId)
    return {
      ...detail,
    }
  }

  /** 从指定 Provider 获取分类目录 */
  async getCatalog(providerId: string, type: string, sub: string): Promise<MediaItem[]> {
    return providerFacade.catalog(providerId, type, sub)
  }

  /** 从所有 Provider 聚合分类目录 */
  async getCatalogAll(type: string, sub: string): Promise<MediaItem[]> {
    return providerFacade.catalogAll(type, sub)
  }
}

/** 全局单例 */
export const mediaLibraryService = new MediaLibraryService()
