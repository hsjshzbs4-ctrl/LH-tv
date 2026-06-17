// tests/unit/governance/registry.spec.ts
import { describe, it, expect, vi } from 'vitest'
import { GovernanceRegistry } from '@governance/index'
vi.mock('@platform/flags', () => ({ featureFlagManager: { isEnabled: vi.fn().mockReturnValue(true) } }))

describe('GovernanceRegistry', () => {
  it('is singleton', () => {
    const a = GovernanceRegistry.getInstance()
    const b = GovernanceRegistry.getInstance()
    expect(a).toBe(b)
  })
  it('registers policies', () => {
    const reg = GovernanceRegistry.getInstance()
    expect(reg.registerPolicy({ id: 'p1', name: 'Test', description: '', module: 'test', action: 'read', enabled: true })).toBe(true)
    expect(reg.getPolicyRegistry().count()).toBeGreaterThanOrEqual(1)
  })
  it('exports data', () => {
    const reg = GovernanceRegistry.getInstance()
    const data = reg.export()
    expect(data.policies).toBeDefined()
    expect(data.certifications).toBeDefined()
  })
})
