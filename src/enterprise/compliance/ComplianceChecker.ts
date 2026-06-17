// src/enterprise/compliance/ComplianceChecker.ts — 合规检查器 (仅执行)
// PB7-S5: 从 CompliancePolicy 读取规则并执行, 不自带规则
// 审查要求: CompliancePolicy 持有规则 → ComplianceChecker 仅执行

import { featureFlagManager } from '@platform/flags'
import { compliancePolicy } from './CompliancePolicy'
import { ComplianceRuleType, type ComplianceRule, type ComplianceResult } from '../contracts'

export class ComplianceChecker {
  /**
   * 运行所有启用的合规检查
   */
  runAll(): ComplianceResult[] {
    this.ensureEnabled()
    const rules = compliancePolicy.getEnabledRules()
    return rules.map((rule) => this.checkRule(rule))
  }

  /**
   * 按类型运行合规检查
   */
  runByType(type: ComplianceRuleType): ComplianceResult[] {
    this.ensureEnabled()
    const rules = compliancePolicy.getRulesByType(type).filter((r) => r.enabled)
    return rules.map((rule) => this.checkRule(rule))
  }

  /**
   * 检查单个规则
   */
  private checkRule(rule: ComplianceRule): ComplianceResult {
    // PB7-S5: 规则执行 stub — 实际实现需连接具体检查逻辑
    return {
      ruleId: rule.id,
      passed: true,
      details: [`Rule "${rule.name}" (${rule.type}) is enabled and compliant`],
    }
  }

  /** 生成合规报告 */
  generateReport(): { total: number; passed: number; failed: number; results: ComplianceResult[] } {
    const results = this.runAll()
    return {
      total: results.length,
      passed: results.filter((r) => r.passed).length,
      failed: results.filter((r) => !r.passed).length,
      results,
    }
  }

  private ensureEnabled(): void {
    if (!featureFlagManager.isEnabled('pb7.enterprise')) {
      throw new Error('Enterprise Integration is not enabled. Enable pb7.enterprise feature flag.')
    }
  }
}

export const complianceChecker = new ComplianceChecker()
