// src/governance/registry/EventRegistry.ts — 事件注册 (内部)

import type { GovernanceAuditEntry } from '../contracts'

export class EventRegistry {
  private entries: GovernanceAuditEntry[] = []

  append(entry: GovernanceAuditEntry): void {
    this.entries.push(entry)
    if (this.entries.length > 5000) this.entries = this.entries.slice(-2500)
  }

  list(): GovernanceAuditEntry[] { return [...this.entries] }
  count(): number { return this.entries.length }
  clear(): void { this.entries = [] }
}
