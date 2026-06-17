// src/enterprise/governance/EnterprisePolicy.ts — 企业治理策略
// PB7-S5: RBAC 角色 → Community 操作映射
// 审查要求: 禁止直接 CommunityRegistry, 必须通过 CommunityFacade

import { featureFlagManager } from '@platform/flags'
import { rbacManager } from '../auth'
import { CommunityAction, CommunityPermissionLevel } from '@community/index'
import type { Role } from '../contracts'

/** RBAC → Community 操作映射 */
const ROLE_COMMUNITY_MAP: Record<string, CommunityAction[]> = {
  admin: [
    CommunityAction.PUBLISH_TEMPLATE,
    CommunityAction.PUBLISH_AGENT,
    CommunityAction.MODIFY_SHARED_CONFIG,
    CommunityAction.DELETE_SHARED_CONTENT,
    CommunityAction.SHARE,
    CommunityAction.RATE,
    CommunityAction.COMMENT,
  ],
  manager: [
    CommunityAction.PUBLISH_TEMPLATE,
    CommunityAction.PUBLISH_AGENT,
    CommunityAction.MODIFY_SHARED_CONFIG,
    CommunityAction.SHARE,
    CommunityAction.RATE,
    CommunityAction.COMMENT,
  ],
  member: [
    CommunityAction.PUBLISH_TEMPLATE,
    CommunityAction.PUBLISH_AGENT,
    CommunityAction.SHARE,
    CommunityAction.RATE,
    CommunityAction.COMMENT,
  ],
  viewer: [
    CommunityAction.SHARE,
    CommunityAction.RATE,
    CommunityAction.COMMENT,
  ],
}

export class EnterprisePolicy {
  /**
   * 获取用户在 Community 中可执行的操作
   */
  static getAllowedActions(userId: string): CommunityAction[] {
    const roles = rbacManager.getUserRoles(userId)
    const actions = new Set<CommunityAction>()

    for (const role of roles) {
      const roleActions = ROLE_COMMUNITY_MAP[role.id]
      if (roleActions) {
        for (const action of roleActions) {
          actions.add(action)
        }
      }
    }

    return Array.from(actions)
  }

  /**
   * 检查用户是否可以执行某个 Community 操作
   */
  static canPerformAction(userId: string, action: CommunityAction): boolean {
    const allowed = EnterprisePolicy.getAllowedActions(userId)
    return allowed.includes(action)
  }

  /**
   * 检查用户是否有管理权限
   */
  static isAdmin(userId: string): boolean {
    this.ensureEnabled()
    return rbacManager.hasPermission(userId, 'org.write')
  }

  private static ensureEnabled(): void {
    if (!featureFlagManager.isEnabled('pb7.enterprise')) {
      throw new Error('Enterprise Integration is not enabled. Enable pb7.enterprise feature flag.')
    }
  }
}
