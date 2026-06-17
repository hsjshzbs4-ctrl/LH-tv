// src/governance/certification/CertificationManager.ts — 认证管理器
// PB7-S6: 统一 issue/revoke/verify/list, 支持 REVOKED

import { GovernanceRegistry } from '../registry'
import { CertificationLevel, isCertificationValid } from '../contracts/CertificationLevel'
import { TrustChain } from './TrustChain'
import type { CertificationRecord } from '../contracts'

export class CertificationManager {
  /** 签发认证 */
  static issue(
    packageId: string,
    publisherId: string,
    level: CertificationLevel,
    manifestHash: string,
    runtimeVersion: string,
  ): CertificationRecord {
    const registry = GovernanceRegistry.getInstance()
    const record: CertificationRecord = {
      id: `cert_${packageId}`,
      packageId,
      publisherId,
      level,
      manifestHash,
      runtimeVersion,
      issuedAt: Date.now(),
    }
    registry.registerCertification(record)
    GovernanceRegistry.getInstance().incrementMetric('policies')
    return record
  }

  /** 撤销认证 */
  static revoke(packageId: string): boolean {
    const record = GovernanceRegistry.getInstance().getCertificationRegistry().get(`cert_${packageId}`)
    if (!record) return false
    record.level = CertificationLevel.REVOKED
    record.revokedAt = Date.now()
    return true
  }

  /** 验证认证 */
  static verify(packageId: string): { valid: boolean; level?: CertificationLevel; reason?: string } {
    const record = GovernanceRegistry.getInstance().getCertificationRegistry().get(`cert_${packageId}`)
    if (!record) {
      return { valid: false, reason: 'No certification record found' }
    }
    if (!isCertificationValid(record.level)) {
      return { valid: false, level: record.level, reason: `Certification is ${record.level}` }
    }
    return { valid: true, level: record.level }
  }

  /** 列出所有认证 */
  static list(): CertificationRecord[] {
    return GovernanceRegistry.getInstance().getCertificationRegistry().list()
  }
}
