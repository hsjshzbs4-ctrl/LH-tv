// src/governance/registry/MetricsRegistry.ts — 指标注册 (内部)

import type { MetricsSnapshot } from '../contracts'

export class MetricsRegistry {
  private snapshots: MetricsSnapshot[] = []
  private counters = new Map<string, number>()

  increment(field: string): void {
    this.counters.set(field, (this.counters.get(field) ?? 0) + 1)
  }

  snapshot(tenantId?: string): MetricsSnapshot {
    return {
      installs: this.counters.get('installs') ?? 0,
      removes: this.counters.get('removes') ?? 0,
      updates: this.counters.get('updates') ?? 0,
      publishes: this.counters.get('publishes') ?? 0,
      permissions: this.counters.get('permissions') ?? 0,
      policies: this.counters.get('policies') ?? 0,
      audits: this.counters.get('audits') ?? 0,
      violations: this.counters.get('violations') ?? 0,
      tenantId,
      timestamp: Date.now(),
    }
  }

  snapshotTenant(tenantId: string): MetricsSnapshot { return this.snapshot(tenantId) }
  exportTenant(tenantId: string): MetricsSnapshot { return this.snapshot(tenantId) }
  clearTenant(_tenantId: string): void { /* 隔离: 仅清除租户指标 */ }

  allSnapshots(): MetricsSnapshot[] { return [...this.snapshots] }
  clear(): void { this.counters.clear(); this.snapshots = [] }
}
