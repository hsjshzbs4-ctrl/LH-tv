// src/ecosystem/permission/PermissionManager.ts — 唯一权限入口
// PB7-S3: 权限注册、检查、审计的统一入口
// 强制调用链: Extension → Runtime → PermissionManager → HostAPI

import {
  type PermissionDefinition,
  type PermissionRequest,
  type PermissionCheckResult,
  type PermissionAuditEntry,
  BUILTIN_PERMISSIONS,
  PermissionRiskLevel,
} from '../contracts/PermissionDefinition'

export class PermissionManager {
  private permissions = new Map<string, PermissionDefinition>()
  private grants = new Map<string, Set<string>>() // extensionId → Set<permissionId>
  private auditLog: PermissionAuditEntry[] = []

  constructor() {
    // 注册内置权限
    for (const perm of BUILTIN_PERMISSIONS) {
      this.permissions.set(perm.permissionId, perm)
    }
  }

  /** 注册新权限定义 */
  registerPermission(permission: PermissionDefinition): void {
    if (this.permissions.has(permission.permissionId)) {
      throw new Error(`Permission "${permission.permissionId}" already registered`)
    }
    this.permissions.set(permission.permissionId, permission)
  }

  /** 获取权限定义 */
  getPermission(permissionId: string): PermissionDefinition | null {
    return this.permissions.get(permissionId) ?? null
  }

  /** 列出所有已注册权限 */
  listPermissions(): PermissionDefinition[] {
    return Array.from(this.permissions.values())
  }

  /** 为扩展授予权限 */
  grant(request: PermissionRequest): { success: boolean; reason?: string } {
    const perm = this.permissions.get(request.permissionId)
    if (!perm) {
      this.audit('grant', request.extensionId, request.permissionId, false, 'Unknown permission')
      return { success: false, reason: `Unknown permission: ${request.permissionId}` }
    }

    let grants = this.grants.get(request.extensionId)
    if (!grants) {
      grants = new Set()
      this.grants.set(request.extensionId, grants)
    }

    grants.add(request.permissionId)
    this.audit('grant', request.extensionId, request.permissionId, true)
    return { success: true }
  }

  /** 撤销扩展的权限 */
  revoke(extensionId: string, permissionId: string): void {
    this.grants.get(extensionId)?.delete(permissionId)
    this.audit('revoke', extensionId, permissionId, true)
  }

  /** 撤销扩展的所有权限 */
  revokeAll(extensionId: string): void {
    this.grants.delete(extensionId)
    this.audit('revoke', extensionId, '*', true, 'All permissions revoked')
  }

  /** 检查扩展是否有某项权限 */
  check(extensionId: string, permissionId: string): PermissionCheckResult {
    const perm = this.permissions.get(permissionId)
    if (!perm) {
      this.audit('check', extensionId, permissionId, false, 'Unknown permission')
      return { allowed: false, reason: `Unknown permission: ${permissionId}`, requiresUserConsent: false }
    }

    const granted = this.grants.get(extensionId)?.has(permissionId) ?? false

    if (!granted) {
      this.audit('check', extensionId, permissionId, false, 'Not granted')
      return { allowed: false, reason: `Permission "${permissionId}" not granted to "${extensionId}"`, requiresUserConsent: false }
    }

    const requiresConsent = perm.riskLevel === PermissionRiskLevel.HIGH
      || perm.riskLevel === PermissionRiskLevel.CRITICAL

    this.audit('check', extensionId, permissionId, true)
    return { allowed: true, requiresUserConsent: requiresConsent }
  }

  /** 批量检查权限 */
  checkAll(extensionId: string, permissionIds: string[]): PermissionCheckResult[] {
    return permissionIds.map((id) => this.check(extensionId, id))
  }

  /** 获取扩展已授权的权限列表 */
  getGrants(extensionId: string): string[] {
    return Array.from(this.grants.get(extensionId) ?? [])
  }

  /** 审计日志 */
  getAuditLog(): PermissionAuditEntry[] {
    return [...this.auditLog]
  }

  /** 按扩展过滤审计日志 */
  getAuditLogFor(extensionId: string): PermissionAuditEntry[] {
    return this.auditLog.filter((e) => e.extensionId === extensionId)
  }

  /** 清空审计日志 */
  clearAuditLog(): void {
    this.auditLog = []
  }

  // ── 内部 ──

  private audit(
    action: PermissionAuditEntry['action'],
    extensionId: string,
    permissionId: string,
    success: boolean,
    reason?: string,
  ): void {
    this.auditLog.push({
      extensionId,
      permissionId,
      action,
      success,
      reason,
      timestamp: Date.now(),
    })

    // 保留最近 1000 条
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-500)
    }
  }
}

export const permissionManager = new PermissionManager()
