// src/governance/registry/GovernanceRegistry.ts — 唯一 SSOT 根注册中心
// PB7-S6: 持有 5 个子 Registry, 仅通过 get* 方法访问
// 审查要求: Singleton, 禁止外部直接 import 子 Registry

import { featureFlagManager } from '@platform/flags'
import { PolicyRegistry } from './PolicyRegistry'
import { CertificationRegistry } from './CertificationRegistry'
import { EventRegistry } from './EventRegistry'
import { MetricsRegistry } from './MetricsRegistry'
import { AdapterRegistry } from './AdapterRegistry'
import type { PolicyRule, CertificationRecord, MetricsSnapshot } from '../contracts'

export class GovernanceRegistry {
  private static instance: GovernanceRegistry

  private _policy = new PolicyRegistry()
  private _certification = new CertificationRegistry()
  private _event = new EventRegistry()
  private _metrics = new MetricsRegistry()
  private _adapter = new AdapterRegistry()

  /** 获取单例 */
  static getInstance(): GovernanceRegistry {
    if (!GovernanceRegistry.instance) {
      GovernanceRegistry.instance = new GovernanceRegistry()
    }
    return GovernanceRegistry.instance
  }

  // ── 子 Registry 访问器 (禁止外部 import 子 Registry) ──

  getPolicyRegistry(): PolicyRegistry { return this._policy }
  getCertificationRegistry(): CertificationRegistry { return this._certification }
  getEventRegistry(): EventRegistry { return this._event }
  getMetricsRegistry(): MetricsRegistry { return this._metrics }
  getAdapterRegistry(): AdapterRegistry { return this._adapter }

  // ── 便捷方法 ──

  registerPolicy(rule: PolicyRule): boolean { return this._policy.register(rule) }
  registerCertification(record: CertificationRecord): boolean { return this._certification.register(record) }
  recordEvent(entry: Parameters<EventRegistry['append']>[0]): void { this._event.append(entry) }
  incrementMetric(field: string): void { this._metrics.increment(field) }
  snapshot(): MetricsSnapshot { return this._metrics.snapshot() }

  /** 导出完整治理数据 */
  export() {
    return {
      policies: this._policy.list(),
      certifications: this._certification.list(),
      events: this._event.list(),
      metrics: this._metrics.allSnapshots(),
      adapters: this._adapter.list(),
    }
  }

  /** 清理租户数据 */
  clearTenant(tenantId: string): void {
    this._metrics.clearTenant(tenantId)
  }

  private constructor() {
    this.ensureEnabled()
  }

  private ensureEnabled(): void {
    if (!featureFlagManager.isEnabled('pb7.governance')) {
      throw new Error('Governance is not enabled. Enable pb7.governance feature flag.')
    }
  }
}
