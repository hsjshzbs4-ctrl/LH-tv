// src/governance/certification/TrustChain.ts — 信任链
// PB7-S6: Publisher→Signature→ManifestHash→Certification→RuntimeVersion→HostAPI
// 任何失败 → 立即 REJECT

import { SignatureVerifier } from './SignatureVerifier'
import { isCertificationValid } from '../contracts/CertificationLevel'
import { GovernanceRegistry } from '../registry'

export interface TrustChainInput {
  packageId: string
  publisherId: string
  signature: string
  manifestHash: string
  runtimeVersion: string
}

export interface TrustChainResult {
  passed: boolean
  reason?: string
  brokenAt?: string
}

export class TrustChain {
  /** 执行完整信任链验证 */
  static verify(input: TrustChainInput): TrustChainResult {
    // 1. Publisher
    if (!input.publisherId) {
      return { passed: false, reason: 'Missing publisher', brokenAt: 'Publisher' }
    }

    // 2. Signature
    if (!SignatureVerifier.verifyPublisher(input.publisherId, input.signature)) {
      return { passed: false, reason: 'Invalid signature', brokenAt: 'Signature' }
    }

    // 3. ManifestHash
    const record = GovernanceRegistry.getInstance().getCertificationRegistry().get(`cert_${input.packageId}`)
    if (record) {
      if (record.manifestHash !== input.manifestHash) {
        return { passed: false, reason: 'Manifest hash mismatch', brokenAt: 'ManifestHash' }
      }

      // 4. Certification
      if (!isCertificationValid(record.level)) {
        return { passed: false, reason: `Certification ${record.level}`, brokenAt: 'Certification' }
      }

      // 5. RuntimeVersion — 旧认证 Runtime 升级后自动失效
      if (record.runtimeVersion && record.runtimeVersion !== input.runtimeVersion) {
        return { passed: false, reason: `Runtime version mismatch: ${record.runtimeVersion} vs ${input.runtimeVersion}`, brokenAt: 'RuntimeVersion' }
      }
    }

    // 6. HostAPI (最后屏障)
    return { passed: true }
  }
}
