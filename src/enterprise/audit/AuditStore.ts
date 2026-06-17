// src/enterprise/audit/AuditStore.ts — 审计存储层 (唯一 SSOT)
// PB7-S5: AuditLogger 写 → AuditStore → AuditQuery 读
// 审查要求: 禁止 AuditLogger 直接写 Map, 统一存储层, export(), clearTenant()

import type { AuditEntry, AuditQuery } from '../contracts'
import { AuditEvent } from '../contracts'

export class AuditStore {
  private entries: AuditEntry[] = []

  /** 写入审计条目 */
  append(entry: AuditEntry): void {
    this.entries.push(entry)
    // 保留最近 10000 条
    if (this.entries.length > 10000) {
      this.entries = this.entries.slice(-5000)
    }
  }

  /** 查询审计条目 */
  query(query: AuditQuery = {}): AuditEntry[] {
    let results = [...this.entries]

    if (query.userId) {
      results = results.filter((e) => e.userId === query.userId)
    }
    if (query.event) {
      results = results.filter((e) => e.event === query.event)
    }
    if (query.tenantId) {
      results = results.filter((e) => e.tenantId === query.tenantId)
    }
    if (query.workspaceId) {
      results = results.filter((e) => e.workspaceId === query.workspaceId)
    }
    if (query.from !== undefined) {
      results = results.filter((e) => e.timestamp >= query.from!)
    }
    if (query.to !== undefined) {
      results = results.filter((e) => e.timestamp <= query.to!)
    }

    // 按时间倒序
    results.sort((a, b) => b.timestamp - a.timestamp)

    const offset = query.offset ?? 0
    const limit = query.limit ?? 100
    return results.slice(offset, offset + limit)
  }

  /** 统计 */
  count(query: AuditQuery = {}): number {
    return this.query(query).length
  }

  /** 导出完整审计日志 */
  export(): AuditEntry[] {
    return [...this.entries]
  }

  /** 按租户清除审计日志 (GDPR) */
  clearTenant(tenantId: string): number {
    const before = this.entries.length
    this.entries = this.entries.filter((e) => e.tenantId !== tenantId)
    return before - this.entries.length
  }

  /** 清空所有日志 (仅测试环境) */
  clear(): void {
    this.entries = []
  }
}

export const auditStore = new AuditStore()
