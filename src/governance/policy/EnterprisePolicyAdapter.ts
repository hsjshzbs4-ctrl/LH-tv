// src/governance/policy/EnterprisePolicyAdapter.ts — 桥接 EnterprisePolicy
// PB7-S6: Governance → EnterprisePolicyAdapter → EnterprisePolicy

import { EnterprisePolicy, rbacManager } from '@enterprise/index'

export class EnterprisePolicyAdapter {
  static isAdmin(userId: string): boolean {
    return EnterprisePolicy.isAdmin(userId)
  }

  static getUserRoles(userId: string) {
    return rbacManager.getUserRoles(userId)
  }
}
