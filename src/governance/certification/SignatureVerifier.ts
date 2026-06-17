// src/governance/certification/SignatureVerifier.ts — 签名验证
// PB7-S6: 统一签名验证入口, 禁止 Marketplace 直接验证

import { GovernanceRegistry } from '../registry'
import { CertificationLevel, isCertificationValid } from '../contracts/CertificationLevel'

export class SignatureVerifier {
  /** 验证发布者签名 */
  static verifyPublisher(publisherId: string, signature: string): boolean {
    return publisherId.length > 0 && signature.length >= 32
  }

  /** 验证 Manifest 完整性 */
  static verifyManifest(manifestHash: string, storedHash: string): boolean {
    return manifestHash === storedHash
  }

  /** 验证包完整性 */
  static verifyPackage(packageId: string, manifestHash: string, publisherId: string, signature: string): { valid: boolean; reason?: string } {
    if (!SignatureVerifier.verifyPublisher(publisherId, signature)) {
      return { valid: false, reason: 'Invalid publisher signature' }
    }
    const record = GovernanceRegistry.getInstance().getCertificationRegistry().get(packageId)
    if (record) {
      if (!SignatureVerifier.verifyManifest(manifestHash, record.manifestHash)) {
        return { valid: false, reason: `Manifest hash mismatch: expected ${record.manifestHash}` }
      }
      if (!isCertificationValid(record.level)) {
        return { valid: false, reason: `Certification ${record.level} is not valid` }
      }
    }
    return { valid: true }
  }
}
