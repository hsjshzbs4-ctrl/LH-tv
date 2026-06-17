// tests/unit/governance/signature.spec.ts
import { describe, it, expect, vi } from 'vitest'
import { SignatureVerifier, GovernanceRegistry, CertificationLevel } from '@governance/index'
vi.mock('@platform/flags', () => ({ featureFlagManager: { isEnabled: vi.fn().mockReturnValue(true) } }))

describe('SignatureVerifier', () => {
  it('validates publisher signature', () => {
    expect(SignatureVerifier.verifyPublisher('pub1', 'x'.repeat(32))).toBe(true)
    expect(SignatureVerifier.verifyPublisher('pub1', 'short')).toBe(false)
  })
  it('verifies package with certification', () => {
    GovernanceRegistry.getInstance().registerCertification({
      id: 'cert_sig-pkg', packageId: 'sig-pkg', publisherId: 'pub1', level: CertificationLevel.DEVELOPER, manifestHash: 'hash1', runtimeVersion: '1.0', issuedAt: Date.now(),
    })
    const r = SignatureVerifier.verifyPackage('sig-pkg', 'hash1', 'pub1', 'x'.repeat(32))
    expect(r.valid).toBe(true)
  })
})
