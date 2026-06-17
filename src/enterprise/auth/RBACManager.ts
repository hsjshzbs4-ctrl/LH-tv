// src/enterprise/auth/RBACManager.ts — 统一权限中心 (唯一 SSOT)
// PB7-S5: 统一管理 Role/Permission/Group, 禁止重复实现
// 审查要求: Role 引用 PermissionDefinition.id, 禁止 string[]

import { featureFlagManager } from '@platform/flags'
import { BUILTIN_ROLES, getRoleById, roleHasPermission } from './RoleDefinition'
import type { Role } from '../contracts'

export class RBACManager {
  private roles = new Map<string, Role>()
  private userRoles = new Map<string, string[]>() // userId → roleIds

  constructor() {
    for (const role of BUILTIN_ROLES) {
      this.roles.set(role.id, role)
    }
  }

  /** 为用户分配角色 */
  assignRole(userId: string, roleId: string): { success: boolean; error?: string } {
    this.ensureEnabled()
    if (!this.roles.has(roleId)) {
      return { success: false, error: `Role "${roleId}" not found` }
    }
    let roles = this.userRoles.get(userId)
    if (!roles) {
      roles = []
      this.userRoles.set(userId, roles)
    }
    if (!roles.includes(roleId)) {
      roles.push(roleId)
    }
    return { success: true }
  }

  /** 撤销用户角色 */
  revokeRole(userId: string, roleId: string): boolean {
    this.ensureEnabled()
    const roles = this.userRoles.get(userId)
    if (!roles) return false
    const idx = roles.indexOf(roleId)
    if (idx === -1) return false
    roles.splice(idx, 1)
    return true
  }

  /** 获取用户角色 */
  getUserRoles(userId: string): Role[] {
    const roleIds = this.userRoles.get(userId) ?? []
    return roleIds.map((id) => this.roles.get(id)!).filter(Boolean)
  }

  /** 检查用户是否有指定权限 */
  hasPermission(userId: string, permissionId: string): boolean {
    const roles = this.getUserRoles(userId)
    return roles.some((role) => roleHasPermission(role, permissionId))
  }

  /** 批量检查权限 */
  hasAllPermissions(userId: string, permissionIds: string[]): boolean {
    return permissionIds.every((pid) => this.hasPermission(userId, pid))
  }

  /** 获取所有角色 */
  listRoles(): Role[] {
    return Array.from(this.roles.values())
  }

  /** 获取所有用户角色分配 */
  listUserRoles(): Map<string, string[]> {
    return new Map(this.userRoles)
  }

  /** 导出权限配置 */
  export(): { roles: Role[]; userRoles: [string, string[]][] } {
    return {
      roles: this.listRoles(),
      userRoles: Array.from(this.userRoles.entries()),
    }
  }

  /** 清理租户用户角色 */
  clearTenant(tenantId: string): number {
    this.ensureEnabled()
    let removed = 0
    for (const [userId] of this.userRoles) {
      if (userId.startsWith(`${tenantId}:`)) {
        this.userRoles.delete(userId)
        removed++
      }
    }
    return removed
  }

  private ensureEnabled(): void {
    if (!featureFlagManager.isEnabled('pb7.enterprise')) {
      throw new Error('Enterprise Integration is not enabled. Enable pb7.enterprise feature flag.')
    }
  }
}

export const rbacManager = new RBACManager()
