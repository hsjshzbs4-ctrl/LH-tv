// tests/unit/governance/certification.spec.ts — Certification + TrustChain 测试
import { describe, it, expect, vi } from 'vitest'
import { CertificationManager, TrustChain, SignatureVerifier, CertificationLevel, GovernanceRegistry } from '@governance/index'
vi.mock('@platform/flags', () => ({ featureFlagManager: { isEnabled: vi.fn().mockReturnValue(true) } }))

describe('CertificationManager', () => {
  it('issues and verifies certification', () => {
    const rec = CertificationManager.issue('pkg1', 'pub1', CertificationLevel.DEVELOPER, 'abc123', '2.0.0')
    expect(rec.level).toBe(CertificationLevel.DEVELOPER)
    const v = CertificationManager.verify('pkg1')
    expect(v.valid).toBe(true)
  })
  it('revoke makes certification invalid', () => {
    CertificationManager.issue('pkg2', 'pub2', CertificationLevel.COMMUNITY, 'hash', '1.0')
    expect(CertificationManager.revoke('pkg2')).toBe(true)
    const v = CertificationManager.verify('pkg2')
    expect(v.valid).toBe(false)
  })
})

describe('TrustChain', () => {
  it('passes for valid chain', () => {
    CertificationManager.issue('pkg-tc', 'pub1', CertificationLevel.OFFICIAL, 'hash-tc', '2.0.0')
    const r = TrustChain.verify({ packageId: 'pkg-tc', publisherId: 'pub1', signature: 'x'.repeat(32), manifestHash: 'hash-tc', runtimeVersion: '2.0.0' })
    expect(r.passed).toBe(true)
  })
  it('fails on runtime version mismatch', () => {
    CertificationManager.issue('pkg-rv', 'pub1', CertificationLevel.DEVELOPER, 'hash-rv', '1.0.0')
    const r = TrustChain.verify({ packageId: 'pkg-rv', publisherId: 'pub1', signature: 'x'.repeat(32), manifestHash: 'hash-rv', runtimeVersion: '2.0.0' })
    expect(r.passed).toBe(false)
  })
})
