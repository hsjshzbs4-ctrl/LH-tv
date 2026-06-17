// src/enterprise/audit/AuditQuery.ts — 审计查询服务
// PB7-S5: 从 AuditStore 读取, 不直接访问存储
// 审查要求: AuditLogger → AuditStore → AuditQuery 分层

import { auditStore } from './AuditStore'
import { AuditEvent } from '../contracts'
import type { AuditEntry, AuditQuery as AuditQueryFilter } from '../contracts'

export class AuditQuery {
  /**
   * 查询审计日志
   */
  query(filter: AuditQueryFilter = {}): AuditEntry[] {
    return auditStore.query(filter)
  }

  /** 按用户查询 */
  byUser(userId: string, limit = 100): AuditEntry[] {
    return auditStore.query({ userId, limit })
  }

  /** 按事件类型查询 */
  byEvent(event: AuditEvent, limit = 100): AuditEntry[] {
    return auditStore.query({ event, limit })
  }

  /** 按时间范围查询 */
  byTimeRange(from: number, to: number, limit = 100): AuditEntry[] {
    return auditStore.query({ from, to, limit })
  }

  /** 按租户查询 */
  byTenant(tenantId: string, limit = 100): AuditEntry[] {
    return auditStore.query({ tenantId, limit })
  }

  /** 导出审计日志 */
  export(): AuditEntry[] {
    return auditStore.export()
  }
}

export const auditQuery = new AuditQuery()
