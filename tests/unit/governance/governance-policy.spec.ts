// tests/unit/governance/governance-policy.spec.ts
import { describe, it, expect, vi } from 'vitest'
import { GovernancePolicy, GovernanceRegistry } from '@governance/index'
vi.mock('@platform/flags', () => ({ featureFlagManager: { isEnabled: vi.fn().mockReturnValue(true) } }))

describe('GovernancePolicy', () => {
  it('executes pipeline successfully', () => {
    const report = GovernancePolicy.executePipeline({ moduleId: 'test', action: 'read', payload: {} })
    expect(report.passed).toBe(true)
    expect(report.stages.length).toBe(6)
  })
  it('fails on missing moduleId', () => {
    const report = GovernancePolicy.executePipeline({ moduleId: '', action: '', payload: {} })
    expect(report.passed).toBe(false)
  })
})
