// src/content/searchService.ts — PB1.5 搜索服务
// 包装 providerFacade + 客户端搜索优化

import { providerFacade } from '@/core/providers'
import type { AggregatedSearchResult, MediaItem } from '@provider-contracts'
import type { SearchFilter } from './contentTypes'

export class SearchService {
  /**
   * 关键词搜索：多 Provider 聚合 + 去重 + 排序
   * 聚合/去重/排序已在 ProviderFacade.search() 中完成
   */
  async search(keyword: string, filter?: SearchFilter): Promise<AggregatedSearchResult> {
    const result = await providerFacade.search(keyword)

    // 客户端后过滤
    if (filter) {
      let filtered = result.items

      if (filter.category) {
        filtered = filtered.filter(item =>
          item.type === filter.category ||
          (filter.category === 'variety' && item.type === 'tv') ||
          (filter.category === 'documentary' && item.type === 'movie')
        )
      }

      if (filter.year) {
        filtered = filtered.filter(item => !item.year || item.year === filter.year)
      }

      if (filter.providerId) {
        filtered = filtered.filter(item => item.providerId === filter.providerId)
      }

      return {
        ...result,
        items: filtered,
        totalFromCache: filtered.length,
      }
    }

    return result
  }

  /** 便捷方法：仅返回媒体列表 */
  async searchAll(keyword: string, filter?: SearchFilter): Promise<MediaItem[]> {
    const result = await this.search(keyword, filter)
    return result.items
  }
}

/** 全局单例 */
export const searchService = new SearchService()
