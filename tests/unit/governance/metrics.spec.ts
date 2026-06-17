// tests/unit/governance/metrics.spec.ts
import { describe, it, expect, vi } from 'vitest'
import { MetricsCollector, MetricsRegistry } from '@governance/index'
vi.mock('@platform/flags', () => ({ featureFlagManager: { isEnabled: vi.fn().mockReturnValue(true) } }))

describe('MetricsCollector', () => {
  it('snapshot returns metrics', () => {
    const snap = MetricsCollector.snapshot()
    expect(snap.installs).toBeDefined()
    expect(snap.timestamp).toBeGreaterThan(0)
  })
  it('snapshotTenant isolates', () => {
    const s1 = MetricsCollector.snapshotTenant('tenant-a')
    expect(s1.tenantId).toBe('tenant-a')
  })
})
