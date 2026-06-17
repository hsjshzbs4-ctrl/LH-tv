// src/governance/policy/PermissionPolicyAdapter.ts — 桥接 PermissionManager
// PB7-S6: Governance → PermissionPolicyAdapter → PermissionManager (via ecosystem barrel)

import { permissionManager } from '@ecosystem/index'

export class PermissionPolicyAdapter {
  static check(extensionId: string, permissionId: string) {
    return permissionManager.check(extensionId, permissionId)
  }

  static getGrants(extensionId: string) {
    return permissionManager.getGrants(extensionId)
  }
}
