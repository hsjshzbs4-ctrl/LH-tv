// src/enterprise/compliance/CompliancePolicy.ts — 合规策略 (唯一规则持有者)
// PB7-S5: 持有 Retention/Encryption/GDPR/Export/Delete 规则
// 审查要求: CompliancePolicy 持有规则, ComplianceChecker 仅执行, 禁止 Checker 自带规则

import { featureFlagManager } from '@platform/flags'
import { ComplianceRuleType, type ComplianceRule } from '../contracts'

/** 内置合规规则 — SSOT */
const BUILTIN_RULES: ComplianceRule[] = [
  {
    id: 'retention-90d',
    type: ComplianceRuleType.RETENTION,
    name: '90-Day Data Retention',
    description: 'Audit logs retained for minimum 90 days',
    enabled: true,
  },
  {
    id: 'encryption-at-rest',
    type: ComplianceRuleType.ENCRYPTION,
    name: 'Encryption at Rest',
    description: 'All stored data must be encrypted at rest',
    enabled: true,
  },
  {
    id: 'gdpr-export',
    type: ComplianceRuleType.GDPR,
    name: 'GDPR Data Export',
    description: 'Users can request export of their personal data within 30 days',
    enabled: true,
  },
  {
    id: 'gdpr-delete',
    type: ComplianceRuleType.DELETE,
    name: 'GDPR Right to Erasure',
    description: 'Users can request deletion of their personal data',
    enabled: true,
  },
  {
    id: 'data-export',
    type: ComplianceRuleType.EXPORT,
    name: 'Enterprise Data Export',
    description: 'Enterprise admins can export all organization data',
    enabled: true,
  },
]

export class CompliancePolicy {
  private rules = new Map<string, ComplianceRule>()

  /** 策略版本 */
  private _version = 1
  /** 版本生效时间 */
  private _effectiveAt: number = Date.now()
  /** 版本废弃时间 (undefined = 当前有效) */
  private _deprecatedAt?: number
  /** 版本历史 */
  private _versionHistory: Array<{ version: number; effectiveAt: number; deprecatedAt?: number }> = []

  /** 获取当前版本 */
  get version(): number { return this._version }
  /** 获取版本生效时间 */
  get effectiveAt(): number { return this._effectiveAt }
  /** 获取版本废弃时间 */
  get deprecatedAt(): number | undefined { return this._deprecatedAt }
  /** 获取版本历史 */
  get versionHistory(): ReadonlyArray<{ version: number; effectiveAt: number; deprecatedAt?: number }> {
    return this._versionHistory
  }

  /** 升级策略版本 (记录当前版本, 递增到新版本) */
  upgrade(): { version: number; effectiveAt: number } {
    this.ensureEnabled()
    // 记录当前版本到历史
    this._versionHistory.push({
      version: this._version,
      effectiveAt: this._effectiveAt,
      deprecatedAt: Date.now(),
    })
    this._version++
    this._effectiveAt = Date.now()
    this._deprecatedAt = undefined
    return { version: this._version, effectiveAt: this._effectiveAt }
  }

  /** 废弃当前版本 */
  deprecate(): void {
    this._deprecatedAt = Date.now()
  }

  constructor() {
    for (const rule of BUILTIN_RULES) {
      this.rules.set(rule.id, rule)
    }
    this._versionHistory.push({ version: 1, effectiveAt: this._effectiveAt })
  }

  /** 获取所有规则 */
  getRules(): ComplianceRule[] {
    return Array.from(this.rules.values())
  }

  /** 获取启用的规则 */
  getEnabledRules(): ComplianceRule[] {
    return this.getRules().filter((r) => r.enabled)
  }

  /** 按类型获取规则 */
  getRulesByType(type: ComplianceRuleType): ComplianceRule[] {
    return this.getRules().filter((r) => r.type === type)
  }

  /** 获取单个规则 */
  getRule(id: string): ComplianceRule | null {
    return this.rules.get(id) ?? null
  }

  /** 新增规则 */
  addRule(rule: ComplianceRule): { success: boolean; error?: string } {
    this.ensureEnabled()
    if (this.rules.has(rule.id)) {
      return { success: false, error: `Rule "${rule.id}" already exists` }
    }
    this.rules.set(rule.id, rule)
    return { success: true }
  }

  /** 启用/禁用规则 */
  setEnabled(ruleId: string, enabled: boolean): boolean {
    this.ensureEnabled()
    const rule = this.rules.get(ruleId)
    if (!rule) return false
    rule.enabled = enabled
    return true
  }

  private ensureEnabled(): void {
    if (!featureFlagManager.isEnabled('pb7.enterprise')) {
      throw new Error('Enterprise Integration is not enabled. Enable pb7.enterprise feature flag.')
    }
  }
}

export const compliancePolicy = new CompliancePolicy()
