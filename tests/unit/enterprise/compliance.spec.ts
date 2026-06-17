// tests/unit/enterprise/compliance.spec.ts — Compliance + EnterprisePolicy 单元测试

import { describe, it, expect, vi } from 'vitest'
import { CompliancePolicy, ComplianceChecker, EnterprisePolicy, rbacManager } from '@enterprise/index'
import { ComplianceRuleType, AuditEvent } from '@enterprise/index'

vi.mock('@platform/flags', () => ({
  featureFlagManager: { isEnabled: vi.fn().mockReturnValue(true) },
}))

describe('CompliancePolicy', () => {
  it('holds built-in rules (SSOT)', () => {
    const policy = new CompliancePolicy()
    const rules = policy.getRules()
    expect(rules.length).toBeGreaterThanOrEqual(5) // retention, encryption, gdpr-export, gdpr-delete, data-export
  })

  it('filters by type', () => {
    const policy = new CompliancePolicy()
    expect(policy.getRulesByType(ComplianceRuleType.GDPR).length).toBe(1)
    expect(policy.getRulesByType(ComplianceRuleType.RETENTION).length).toBe(1)
  })

  it('filters enabled rules', () => {
    const policy = new CompliancePolicy()
    const all = policy.getRules()
    const enabled = policy.getEnabledRules()
    expect(enabled.length).toBeLessThanOrEqual(all.length)
    expect(enabled.length).toBeGreaterThan(0)
  })

  it('adds and toggles rules', () => {
    const policy = new CompliancePolicy()
    const r = policy.addRule({
      id: 'custom-rule', type: ComplianceRuleType.RETENTION, name: 'Custom', description: 'Test', enabled: true,
    })
    expect(r.success).toBe(true)
    expect(policy.getRule('custom-rule')).not.toBeNull()
    expect(policy.setEnabled('custom-rule', false)).toBe(true)
    expect(policy.getRule('custom-rule')?.enabled).toBe(false)
  })
})

describe('ComplianceChecker', () => {
  it('runs all enabled checks', () => {
    const checker = new ComplianceChecker()
    const results = checker.runAll()
    expect(results.length).toBeGreaterThan(0)
    expect(results.every((r) => r.passed)).toBe(true)
  })

  it('generates report', () => {
    const checker = new ComplianceChecker()
    const report = checker.generateReport()
    expect(report.total).toBeGreaterThan(0)
    expect(report.passed).toBe(report.total)
  })

  it('runs checks by type', () => {
    const checker = new ComplianceChecker()
    const results = checker.runByType(ComplianceRuleType.GDPR)
    expect(results.length).toBe(1)
  })
})

describe('EnterprisePolicy', () => {
  it('admin can perform all actions', () => {
    rbacManager.assignRole('admin-user', 'admin')
    expect(EnterprisePolicy.isAdmin('admin-user')).toBe(true)
    expect(EnterprisePolicy.getAllowedActions('admin-user').length).toBeGreaterThan(0)
  })

  it('viewer has limited actions', () => {
    rbacManager.assignRole('viewer-user', 'viewer')
    const actions = EnterprisePolicy.getAllowedActions('viewer-user')
    expect(actions.length).toBeGreaterThan(0) // share, rate, comment
    expect(EnterprisePolicy.isAdmin('viewer-user')).toBe(false)
  })
})
