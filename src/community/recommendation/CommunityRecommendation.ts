// src/community/recommendation/CommunityRecommendation.ts — 社区推荐引擎
// PB7-S4: 个性化推荐 + 相似推荐
// 通过 FeedService (Facade) 而非直接访问 CommunityRegistry

import { featureFlagManager } from '@platform/flags'
import { feedService } from '../feed'
import { communityRegistry } from '../registry'
import type { CommunityItem, FeedEntry } from '../contracts'

export class CommunityRecommendation {
  /**
   * 个性化推荐
   * 基于用户历史评分的条目类型和标签偏好
   */
  recommend(userId: string, limit = 20): FeedEntry[] {
    this.ensureEnabled()

    // 获取用户评分过的条目
    const allItems = communityRegistry.listAll()
    const userRated = allItems.filter((item) => {
      const ratings = communityRegistry.getRatings(item.id)
      return ratings.some((r) => r.userId === userId)
    })

    if (userRated.length === 0) {
      // 无历史 → 返回热门
      return feedService.getTrending(limit)
    }

    // 计算用户偏好: 偏好类型和标签
    const preferredTypes = new Set(userRated.map((i) => i.type))
    const preferredTags = new Set(userRated.flatMap((i) => i.tags))

    // 对未评分的条目计算推荐分数
    const ratedIds = new Set(userRated.map((i) => i.id))
    const candidates = allItems.filter((i) => !ratedIds.has(i.id))

    const scored = candidates.map((item) => ({
      item,
      score: this.computeRecommendationScore(item, preferredTypes, preferredTags),
    }))

    scored.sort((a, b) => b.score - a.score)
    const topItems = scored.slice(0, limit).map((s) => s.item)

    // 通过 FeedBuilder 获取完整 FeedEntry
    const feed = feedService.getFeed({ limit })
    const feedMap = new Map(feed.map((e) => [e.item.id, e]))

    return topItems.map((item) => {
      const existing = feedMap.get(item.id)
      return existing ?? {
        item,
        relevanceScore: 0,
        recommendationReason: 'Recommended for you',
      }
    })
  }

  /**
   * 相似推荐 — 基于标签 Jaccard 相似度
   */
  recommendSimilar(itemId: string, limit = 10): FeedEntry[] {
    this.ensureEnabled()

    const source = communityRegistry.get(itemId)
    if (!source) return []

    const candidates = communityRegistry.listAll().filter((i) => i.id !== itemId)

    const scored = candidates.map((item) => ({
      item,
      score: CommunityRecommendation.computeSimilarity(source, item),
    }))

    scored.sort((a, b) => b.score - a.score)

    return scored.slice(0, limit).map((s) => ({
      item: s.item,
      relevanceScore: s.score,
      recommendationReason: s.score > 0.5
        ? 'Very similar'
        : s.score > 0.2
          ? 'Somewhat similar'
          : 'You might also like',
    }))
  }

  /**
   * Jaccard 相似度 + 同类型加权
   */
  static computeSimilarity(a: CommunityItem, b: CommunityItem): number {
    const tagsA = new Set(a.tags)
    const tagsB = new Set(b.tags)

    if (tagsA.size === 0 && tagsB.size === 0) {
      return a.type === b.type ? 0.5 : 0
    }

    const intersection = new Set([...tagsA].filter((t) => tagsB.has(t)))
    const union = new Set([...tagsA, ...tagsB])

    const jaccard = union.size === 0 ? 0 : intersection.size / union.size

    // 同类型 +0.2 加权
    const typeBonus = a.type === b.type ? 0.2 : 0

    return Math.round(Math.min(jaccard + typeBonus, 1) * 100) / 100
  }

  /** 计算推荐分数 */
  private computeRecommendationScore(
    item: CommunityItem,
    preferredTypes: Set<string>,
    preferredTags: Set<string>,
  ): number {
    let score = 0

    // 类型匹配 +0.3
    if (preferredTypes.has(item.type)) score += 0.3

    // 标签重叠
    const matchingTags = item.tags.filter((t) => preferredTags.has(t))
    if (item.tags.length > 0) {
      score += (matchingTags.length / item.tags.length) * 0.4
    }

    // 质量加权 +0.3
    score += Math.min(item.averageRating / 5, 1) * 0.3

    return score
  }

  private ensureEnabled(): void {
    if (!featureFlagManager.isEnabled('pb7.community')) {
      throw new Error('Community Platform is not enabled. Enable pb7.community feature flag.')
    }
  }
}

export const communityRecommendation = new CommunityRecommendation()
