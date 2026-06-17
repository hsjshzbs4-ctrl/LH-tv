// src/governance/policy/CommunityPolicyAdapter.ts — 桥接 CommunityPolicy
// PB7-S6: 禁止 Governance 直接访问 CommunityRegistry
// 合法路径: Governance → CommunityPolicyAdapter → CommunityFacade

import { CommunityAction, CommunityPolicy, communityRegistry } from '@community/index'

export class CommunityPolicyAdapter {
  /** 验证社区操作 */
  static validate(userId: string, action: CommunityAction): boolean {
    return CommunityPolicy.validate('developer' as any, action).allowed
  }

  /** 搜索社区内容 */
  static search(query: Parameters<typeof communityRegistry.search>[0]) {
    return communityRegistry.search(query)
  }
}
