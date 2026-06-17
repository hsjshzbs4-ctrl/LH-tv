// src/enterprise/auth/RoleDefinition.ts — 角色定义 (SSOT)
// PB7-S5: 内置角色 + PermissionDefinition SSOT
// 审查要求: Role.permissions = PermissionDefinition.id[], 禁止 string[]

import {
  BUILTIN_PERMISSIONS,
  BUILTIN_ROLES,
  PermissionRisk,
  type PermissionDefinition,
  type Role,
} from '../contracts'

export {
  BUILTIN_PERMISSIONS,
  BUILTIN_ROLES,
  PermissionRisk,
  type PermissionDefinition,
  type Role,
}

/** 按 ID 获取权限定义 */
export function getPermissionById(id: string): PermissionDefinition | null {
  // 支持通配符匹配 (e.g. "org.*" 匹配 "org.read")
  if (id.endsWith('.*')) {
    const prefix = id.slice(0, -2)
    return BUILTIN_PERMISSIONS.find((p) => p.id.startsWith(prefix + '.')) ?? null
  }
  return BUILTIN_PERMISSIONS.find((p) => p.id === id) ?? null
}

/** 检查角色是否有指定权限 (支持通配符) */
export function roleHasPermission(role: Role, permissionId: string): boolean {
  return role.permissions.some((p) => {
    if (p === permissionId) return true
    if (p.endsWith('.*')) {
      const prefix = p.slice(0, -2)
      return permissionId.startsWith(prefix + '.')
    }
    return false
  })
}

/** 获取角色定义 */
export function getRoleById(id: string): Role | null {
  return BUILTIN_ROLES.find((r) => r.id === id) ?? null
}
