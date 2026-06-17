// src/community/feed/FeedService.ts — Feed 编排服务
// PB7-S4: CommunityRegistry → FeedBuilder → Feed
// 所有入口 feature flag 门控

import { featureFlagManager } from '@platform/flags'
import { communityRegistry } from '../registry'
import { FeedBuilder } from './FeedBuilder'
import type { FeedEntry, FeedQuery, CommunityItemType } from '../contracts'

export class FeedService {
  /**
   * 获取 Feed
   */
  getFeed(query: FeedQuery = {}): FeedEntry[] {
    this.ensureEnabled()
    const items = communityRegistry.search(query)
    return FeedBuilder.buildFeed(items, query)
  }

  /**
   * 热门 Feed — 按 (评分 × 下载量) 加权
   */
  getTrending(limit = 20): FeedEntry[] {
    this.ensureEnabled()
    const items = communityRegistry.listAll()

    const entries = items
      .map((item) => ({
        item,
        relevanceScore: item.averageRating * Math.log(item.downloads + 2),
        recommendationReason: '',
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit)

    return entries.map((e) => ({
      ...e,
      recommendationReason: FeedBuilder.generateReason(e.item),
    }))
  }

  /**
   * 最新 Feed
   */
  getNewest(limit = 20): FeedEntry[] {
    this.ensureEnabled()
    const items = communityRegistry.listAll()
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit)

    return FeedBuilder.buildFeed(items, { sort: 'updated', order: 'desc', limit })
  }

  /**
   * 按类别获取 Feed
   */
  getByCategory(type: CommunityItemType, limit = 20): FeedEntry[] {
    this.ensureEnabled()
    const items = communityRegistry.search({ type, sort: 'rating', order: 'desc', limit })
    return FeedBuilder.buildFeed(items, { sort: 'rating', order: 'desc', limit })
  }

  private ensureEnabled(): void {
    if (!featureFlagManager.isEnabled('pb7.community')) {
      throw new Error('Community Platform is not enabled. Enable pb7.community feature flag.')
    }
  }
}

export const feedService = new FeedService()
