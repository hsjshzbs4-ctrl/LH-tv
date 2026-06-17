// src/governance/contracts/CertificationLevel.ts — 统一认证级别 (SSOT)
// PB7-S6: 扩展 Ecosystem CertificationLevel, 新增 REVOKED + ENTERPRISE
// Runtime 禁止执行 REVOKED 认证包

/** 统一认证级别 — Governance SSOT */
export enum CertificationLevel {
  UNCERTIFIED = 'uncertified',
  COMMUNITY = 'community',
  DEVELOPER = 'developer',
  OFFICIAL = 'official',
  ENTERPRISE = 'enterprise',
  REVOKED = 'revoked',
}

/** 检查认证是否有效 (非 REVOKED) */
export function isCertificationValid(level: CertificationLevel): boolean {
  return level !== CertificationLevel.REVOKED
}

/** 检查认证是否达到指定级别 */
export function meetsCertificationLevel(current: CertificationLevel, required: CertificationLevel): boolean {
  const order: CertificationLevel[] = [
    CertificationLevel.UNCERTIFIED,
    CertificationLevel.COMMUNITY,
    CertificationLevel.DEVELOPER,
    CertificationLevel.OFFICIAL,
    CertificationLevel.ENTERPRISE,
  ]
  const currentIdx = order.indexOf(current)
  const requiredIdx = order.indexOf(required)
  if (currentIdx === -1 || requiredIdx === -1) return false
  return currentIdx >= requiredIdx
}
