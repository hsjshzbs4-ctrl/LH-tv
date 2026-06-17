// src/governance/audit/MetricsCollector.ts — 指标收集器
// PB7-S6: 支持 Tenant 隔离, snapshot/export/clearTenant

import { GovernanceRegistry } from '../registry'
import type { MetricsSnapshot } from '../contracts'

export class MetricsCollector {
  static snapshot(): MetricsSnapshot {
    return GovernanceRegistry.getInstance().snapshot()
  }

  static snapshotTenant(tenantId: string): MetricsSnapshot {
    return GovernanceRegistry.getInstance().getMetricsRegistry().snapshotTenant(tenantId)
  }

  static exportTenant(tenantId: string): MetricsSnapshot {
    return GovernanceRegistry.getInstance().getMetricsRegistry().exportTenant(tenantId)
  }

  static clearTenant(tenantId: string): void {
    GovernanceRegistry.getInstance().getMetricsRegistry().clearTenant(tenantId)
  }

  static export(): MetricsSnapshot[] {
    return GovernanceRegistry.getInstance().getMetricsRegistry().allSnapshots()
  }
}
