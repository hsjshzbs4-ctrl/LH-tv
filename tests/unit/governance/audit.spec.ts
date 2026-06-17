// tests/unit/governance/audit.spec.ts
import { describe, it, expect, vi } from 'vitest'
import { GovernanceAudit, GovernanceReportGenerator, GovernanceRegistry } from '@governance/index'
vi.mock('@platform/flags', () => ({ featureFlagManager: { isEnabled: vi.fn().mockReturnValue(true) } }))

describe('GovernanceAudit', () => {
  it('runs and collects', () => {
    const result = GovernanceAudit.run()
    expect(result.events).toBeDefined()
    expect(result.policies).toBeDefined()
  })
})

describe('GovernanceReport', () => {
  it('generates and exports', () => {
    const report = GovernanceReportGenerator.generate()
    expect(report.timestamp).toBeGreaterThan(0)
    const json = report.exportJSON()
    expect(json).toContain('timestamp')
    const md = report.exportMarkdown()
    expect(md).toContain('Governance Report')
  })
  it('compare provides diffs', () => {
    const r1 = GovernanceReportGenerator.generate()
    GovernanceRegistry.getInstance().registerPolicy({ id: 'diff-p1', name: 'Diff', description: '', module: 't', action: 'r', enabled: true })
    const r2 = GovernanceReportGenerator.generate()
    const diff = GovernanceReportGenerator.compare(r1, r2)
    expect(diff.policyDelta.length).toBeGreaterThan(0)
  })
})
