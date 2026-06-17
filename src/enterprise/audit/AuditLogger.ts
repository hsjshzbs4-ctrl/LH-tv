// src/enterprise/audit/AuditLogger.ts — 审计日志记录器
// PB7-S5: 写入 AuditStore, 不直接写存储
// 审查要求: 使用 AuditEvent enum, AuditLogger → AuditStore → AuditQuery

import { featureFlagManager } from '@platform/flags'
import { auditStore } from './AuditStore'
import { AuditEvent } from '../contracts'
import type { AuditEntry } from '../contracts'

export class AuditLogger {
  /**
   * 记录审计事件
   * 所有企业操作必须通过此方法记录
   */
  log(
    event: AuditEvent,
    userId: string,
    detail: string,
    options?: { success?: boolean; tenantId?: string; workspaceId?: string },
  ): AuditEntry {
    this.ensureEnabled()

    const entry: AuditEntry = {
      id: `audit_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      event,
      userId,
      tenantId: options?.tenantId,
      workspaceId: options?.workspaceId,
      detail,
      success: options?.success ?? true,
      timestamp: Date.now(),
    }

    auditStore.append(entry)
    return entry
  }

  /** 便捷方法 */
  logLogin(userId: string, success: boolean, detail = 'User login') {
    return this.log(AuditEvent.LOGIN, userId, detail, { success })
  }

  logLogout(userId: string) {
    return this.log(AuditEvent.LOGOUT, userId, 'User logout')
  }

  logPermission(userId: string, detail: string, success: boolean) {
    return this.log(AuditEvent.PERMISSION, userId, detail, { success })
  }

  logWorkspace(userId: string, workspaceId: string, detail: string) {
    return this.log(AuditEvent.WORKSPACE, userId, detail, { workspaceId })
  }

  logPublish(userId: string, detail: string) {
    return this.log(AuditEvent.PUBLISH, userId, detail)
  }

  logInstall(userId: string, detail: string) {
    return this.log(AuditEvent.INSTALL, userId, detail)
  }

  logDelete(userId: string, detail: string) {
    return this.log(AuditEvent.DELETE, userId, detail)
  }

  logPolicy(userId: string, detail: string) {
    return this.log(AuditEvent.POLICY, userId, detail)
  }

  private ensureEnabled(): void {
    if (!featureFlagManager.isEnabled('pb7.enterprise')) {
      throw new Error('Enterprise Integration is not enabled. Enable pb7.enterprise feature flag.')
    }
  }
}

export const auditLogger = new AuditLogger()
