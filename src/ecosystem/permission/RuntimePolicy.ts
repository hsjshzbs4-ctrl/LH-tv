// src/ecosystem/permission/RuntimePolicy.ts — 运行时权限策略
// PB7-S3: 定义权限策略规则，判断扩展请求是否合规

import {
  type PermissionDefinition,
  PermissionRiskLevel,
} from '../contracts/PermissionDefinition'

/** 策略规则 */
export interface PolicyRule {
  /** 规则 ID */
  id: string
  /** 规则描述 */
  description: string
  /** 适用权限 ID 列表 */
  scope: string[]
  /** 风险阈值 — 等于或高于此级别的需要用户确认 */
  requireUserConsentAbove: PermissionRiskLevel
  /** 是否启用 */
  enabled: boolean
}

/** 策略检查结果 */
export interface PolicyCheckResult {
  passed: boolean
  ruleId?: string
  reason?: string
  requiresUserConsent: boolean
}

/** 默认运行时策略 */
const DEFAULT_POLICY_RULES: PolicyRule[] = [
  {
    id: 'critical-needs-consent',
    description: 'CRITICAL 级别权限必须用户明确同意',
    scope: [], // 所有
    requireUserConsentAbove: PermissionRiskLevel.HIGH,
    enabled: true,
  },
  {
    id: 'high-needs-consent',
    description: 'HIGH 级别权限建议用户确认',
    scope: [],
    requireUserConsentAbove: PermissionRiskLevel.MEDIUM,
    enabled: true,
  },
  {
    id: 'network-isolate',
    description: '网络权限 (network.*) 需要用户确认',
    scope: ['network.fetch', 'network.websocket'],
    requireUserConsentAbove: PermissionRiskLevel.LOW,
    enabled: true,
  },
  {
    id: 'filesystem-block',
    description: '文件系统写入默认禁止',
    scope: ['filesystem.write'],
    requireUserConsentAbove: PermissionRiskLevel.LOW,
    enabled: true,
  },
]

export class RuntimePolicy {
  private rules = new Map<string, PolicyRule>()

  constructor() {
    for (const rule of DEFAULT_POLICY_RULES) {
      this.rules.set(rule.id, rule)
    }
  }

  /** 检查权限是否通过策略 */
  evaluate(permission: PermissionDefinition): PolicyCheckResult {
    // 1. 检查特定 scope 规则
    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue

      const scopeMatches = rule.scope.length === 0 || rule.scope.includes(permission.permissionId)
      if (scopeMatches) {
        const riskMet = this.riskLevelValue(permission.riskLevel) >= this.riskLevelValue(rule.requireUserConsentAbove)
        return {
          passed: true,
          ruleId: rule.id,
          requiresUserConsent: riskMet,
        }
      }
    }

    // 2. 默认: LOW/MEDIUM 不需要确认
    const requiresConsent = permission.riskLevel === PermissionRiskLevel.HIGH
      || permission.riskLevel === PermissionRiskLevel.CRITICAL

    return { passed: true, requiresUserConsent: requiresConsent }
  }

  /** 注册策略规则 */
  registerRule(rule: PolicyRule): void {
    this.rules.set(rule.id, rule)
  }

  /** 启用/禁用规则 */
  setRuleEnabled(ruleId: string, enabled: boolean): void {
    const rule = this.rules.get(ruleId)
    if (rule) {
      rule.enabled = enabled
    }
  }

  /** 列出所有规则 */
  listRules(): PolicyRule[] {
    return Array.from(this.rules.values())
  }

  // ── 内部 ──

  private riskLevelValue(level: PermissionRiskLevel): number {
    const map: Record<PermissionRiskLevel, number> = {
      [PermissionRiskLevel.LOW]: 0,
      [PermissionRiskLevel.MEDIUM]: 1,
      [PermissionRiskLevel.HIGH]: 2,
      [PermissionRiskLevel.CRITICAL]: 3,
    }
    return map[level]
  }
}

export const runtimePolicy = new RuntimePolicy()
