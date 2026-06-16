// src/integration/recommendation/recommendationBridge.ts — PB2-S2 Recommendation Bridge
// 桥接推荐系统的 UseCases，先查缓存再查询

import { RecommendationCache } from './recommendationCache'
import { integrationEvents, IntegrationEvent } from '../events/integrationEvents'
import type { MediaItem } from '@provider-contracts'

// 推荐结果接口（简化）
interface RecommendedItem {
  mediaId: string
  title: string
  cover: string
  providerId: string
  reason?: string
}

interface RecommendationResult {
  items: RecommendedItem[]
  source: string
}

export class RecommendationBridge {
  private cache = new RecommendationCache()

  /** 获取相关节目 */
  async getRelatedShows(providerId: string, mediaId: string): Promise<RecommendationResult> {
    const cacheKey = this.cache.makeKey(providerId, mediaId, 'related')
    const cached = this.cache.get<RecommendationResult>(cacheKey)
    if (cached) return cached

    // 实际调用推荐系统 UseCase（stub: 返回空，等 PB3 接入）
    const result: RecommendationResult = { items: [], source: 'pb2-s2-stub' }
    this.cache.set(cacheKey, result)
    integrationEvents.emit(IntegrationEvent.RECOMMENDATION_READY, {
      type: 'related', providerId, mediaId, count: result.items.length,
    })
    return result
  }

  /** 获取下一集推荐 */
  async getNextEpisode(providerId: string, mediaId: string, currentEpisodeId: string): Promise<RecommendedItem | null> {
    const cacheKey = this.cache.makeKey(providerId, mediaId, `next:${currentEpisodeId}`)
    const cached = this.cache.get<RecommendedItem>(cacheKey)
    if (cached) return cached

    return null // stub
  }

  /** 获取同类内容 */
  async getSimilarCategory(category: string, excludeMediaId: string): Promise<RecommendationResult> {
    const cacheKey = this.cache.makeKey('global', category, 'similar')
    const cached = this.cache.get<RecommendationResult>(cacheKey)
    if (cached) {
      // 过滤掉当前媒体
      return { ...cached, items: cached.items.filter(i => i.mediaId !== excludeMediaId) }
    }
    return { items: [], source: 'pb2-s2-stub' }
  }

  /** 清除缓存 */
  clearCache(): void { this.cache.clear() }
}

export const recommendationBridge = new RecommendationBridge()
