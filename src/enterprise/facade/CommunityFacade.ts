// src/enterprise/facade/CommunityFacade.ts — Community 访问门面 (唯一合法入口)
// PB7-S5: Enterprise 必须通过此 Facade 访问 Community
// 审查要求: 禁止 Enterprise → CommunityRegistry 直接 import
// 合法链: Enterprise → CommunityFacade → CommunityRegistry

import { featureFlagManager } from '@platform/flags'
import {
  communityRegistry,
  CommunityPolicy,
  type CommunityItem,
  type FeedQuery,
} from '@community/index'
import { marketplaceRegistry, CertificationLevel } from '@ecosystem/index'
import { EnterprisePolicy } from '../governance/EnterprisePolicy'
import { CommunityAction } from '@community/index'

export class CommunityFacade {
  /** 获取社区 Feed */
  getFeed(query: FeedQuery = {}) {
    this.ensureEnabled()
    return communityRegistry.search(query)
  }

  /** 获取条目详情 */
  getItem(id: string): CommunityItem | null {
    return communityRegistry.get(id)
  }

  /**
   * 企业用户发布内容
   * 必须先检查 EnterprisePolicy 权限
   */
  publish(
    userId: string,
    item: Omit<CommunityItem, 'id' | 'createdAt' | 'updatedAt' | 'averageRating' | 'ratingCount' | 'commentCount' | 'downloads'>,
  ) {
    this.ensureEnabled()

    if (!EnterprisePolicy.canPerformAction(userId, CommunityAction.PUBLISH_TEMPLATE)) {
      return { success: false, error: 'User does not have publish permission. Required role: member, manager, or admin.' }
    }

    return communityRegistry.register(item)
  }

  /** 企业用户评分 */
  rate(userId: string, itemId: string, score: number) {
    this.ensureEnabled()

    if (!EnterprisePolicy.canPerformAction(userId, CommunityAction.RATE)) {
      return { success: false, error: 'User does not have rate permission.' }
    }

    return communityRegistry.addRating(itemId, {
      communityItemId: itemId,
      userId,
      score,
    })
  }

  /** 企业用户评论 */
  comment(userId: string, itemId: string, content: string) {
    this.ensureEnabled()

    if (!EnterprisePolicy.canPerformAction(userId, CommunityAction.COMMENT)) {
      return { success: false, error: 'User does not have comment permission.' }
    }

    return communityRegistry.addComment(itemId, {
      communityItemId: itemId,
      userId,
      content,
    })
  }

  /**
   * 企业管理员删除内容 (需要 admin 角色)
   */
  deleteContent(userId: string, itemId: string) {
    this.ensureEnabled()

    if (!EnterprisePolicy.canPerformAction(userId, CommunityAction.DELETE_SHARED_CONTENT)) {
      return { success: false, error: 'Only administrators can delete community content.' }
    }

    return { success: communityRegistry.remove(itemId) }
  }

  /** 获取 Marketplace 信息 (只读, 通过 Facade → MarketplaceRegistry) */
  getMarketplaceExtension(id: string) {
    return marketplaceRegistry.get(id)
  }

  private ensureEnabled(): void {
    if (!featureFlagManager.isEnabled('pb7.enterprise')) {
      throw new Error('Enterprise Integration is not enabled. Enable pb7.enterprise feature flag.')
    }
  }
}

export const communityFacade = new CommunityFacade()
