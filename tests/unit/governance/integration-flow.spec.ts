// tests/unit/governance/integration-flow.spec.ts — 全链路集成测试
import { describe, it, expect, vi } from 'vitest'
import {
  GovernanceFacade, GovernanceRegistry, GovernanceEventBus,
  CertificationLevel, Priority, GovernanceEventType,
} from '@governance/index'
vi.mock('@platform/flags', () => ({ featureFlagManager: { isEnabled: vi.fn().mockReturnValue(true) } }))

describe('Governance Integration Flow', () => {
  it('Pipeline → Certify → Audit → Report', () => {
    // 1. Issue certification
    const cert = GovernanceFacade.issueCertification('pkg-int', 'pub-int', CertificationLevel.OFFICIAL, 'hash-int', '3.0.0')
    expect(cert.level).toBe(CertificationLevel.OFFICIAL)

    // 2. Verify trust chain
    const tc = GovernanceFacade.verifyTrustChain({
      packageId: 'pkg-int', publisherId: 'pub-int', signature: 'x'.repeat(32), manifestHash: 'hash-int', runtimeVersion: '3.0.0',
    })
    expect(tc.passed).toBe(true)

    // 3. Execute pipeline
    const report = GovernanceFacade.executePipeline({ moduleId: 'test', action: 'install', userId: 'u1', payload: { pkg: 'pkg-int' } })
    expect(report.passed).toBe(true)

    // 4. Audit
    const audit = GovernanceFacade.runAudit()
    expect(audit.certifications).toBeGreaterThanOrEqual(1)

    // 5. Report with compare
    const r1 = GovernanceFacade.generateReport()
    GovernanceFacade.issueCertification('pkg-compare', 'pub-comp', CertificationLevel.DEVELOPER, 'h2', '1.0')
    const r2 = GovernanceFacade.generateReport()
    const diff = GovernanceFacade.compareReports(r1, r2)
    expect(diff.certificationDelta[0].delta).toBeGreaterThanOrEqual(1)
  })

  it('EventBus priority + FIFO', () => {
    const bus = GovernanceEventBus.getInstance()
    bus.clear()
    const events: string[] = []
    bus.subscribe(GovernanceEventType.INSTALL, () => events.push('crit'), Priority.CRITICAL)
    bus.subscribe(GovernanceEventType.INSTALL, () => events.push('low'), Priority.LOW)
    GovernanceFacade.publish(GovernanceEventType.INSTALL, 'test', {})
    expect(events).toEqual(['crit', 'low'])
  })

  it('Tenant isolation', () => {
    GovernanceFacade.snapshotTenant('acme')
    const snap = GovernanceFacade.exportTenant('acme')
    expect(snap.tenantId).toBe('acme')
    GovernanceFacade.clearTenant('acme')
    expect(() => GovernanceFacade.clearTenant('acme')).not.toThrow()
  })

  it('Batch operations', () => {
    const contexts = [
      { moduleId: 'm1', action: 'a1', payload: {} },
      { moduleId: 'm2', action: 'a2', payload: {} },
    ]
    const reports = GovernanceFacade.batchValidate(contexts)
    expect(reports.length).toBe(2)
    expect(reports.every((r) => r.passed)).toBe(true)
  })
})
