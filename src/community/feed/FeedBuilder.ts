// src/community/feed/FeedBuilder.ts — Feed 构建器
// PB7-S4: 相关性评分 + 排序，纯算法，无状态

import type { CommunityItem, FeedEntry, FeedQuery } from '../contracts'

export class FeedBuilder {
  /**
   * 构建 Feed — 从条目列表计算相关性并排序
   */
  static buildFeed(items: CommunityItem[], query: FeedQuery): FeedEntry[] {
    const entries = items.map((item) => ({
      item,
      relevanceScore: FeedBuilder.computeRelevance(item),
      recommendationReason: FeedBuilder.generateReason(item),
    }))

    return FeedBuilder.sortEntries(entries, query.sort ?? 'rating', query.order ?? 'desc')
  }

  /**
   * 计算相关性评分 (0~1)
   *
   * 加权公式:
   *   averageRating  * 0.40  (评分最高权重)
   * + ln(commentCount+1) * 0.20  (评论参与度)
   * + ln(downloads+1)   * 0.20  (下载流行度)
   * + recencyBonus      * 0.20  (新鲜度)
   */
  static computeRelevance(item: CommunityItem): number {
    const ratingScore = Math.min(item.averageRating / 5, 1) * 0.4
    const commentScore = Math.min(Math.log(item.commentCount + 1) / Math.log(101), 1) * 0.2
    const downloadScore = Math.min(Math.log(item.downloads + 1) / Math.log(1001), 1) * 0.2

    // 新鲜度: 最近 7 天
    const ageDays = (Date.now() - item.updatedAt) / (1000 * 60 * 60 * 24)
    const recencyBonus = Math.max(0, 1 - ageDays / 7) * 0.2

    return Math.round((ratingScore + commentScore + downloadScore + recencyBonus) * 100) / 100
  }

  /**
   * 生成推荐理由
   */
  static generateReason(item: CommunityItem): string {
    if (item.averageRating >= 4.5) return 'Highly rated by community'
    if (item.downloads >= 100) return 'Popular in community'
    if (item.commentCount >= 20) return 'Actively discussed'
    if (Date.now() - item.createdAt < 7 * 24 * 60 * 60 * 1000) return 'New in community'
    return 'Community pick'
  }

  /**
   * 排序 Feed 条目
   */
  static sortEntries(entries: FeedEntry[], sort: FeedQuery['sort'] = 'rating', order: 'asc' | 'desc' = 'desc'): FeedEntry[] {
    const multiplier = order === 'asc' ? 1 : -1

    switch (sort) {
      case 'rating':
        return [...entries].sort((a, b) => (a.item.averageRating - b.item.averageRating) * multiplier)
      case 'downloads':
        return [...entries].sort((a, b) => (a.item.downloads - b.item.downloads) * multiplier)
      case 'updated':
        return [...entries].sort((a, b) => (a.item.updatedAt - b.item.updatedAt) * multiplier)
      case 'name':
        return [...entries].sort((a, b) => a.item.title.localeCompare(b.item.title) * multiplier)
      default:
        // 默认按相关性评分排序
        return [...entries].sort((a, b) => (a.relevanceScore - b.relevanceScore) * multiplier)
    }
  }
}
