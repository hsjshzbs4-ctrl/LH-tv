// src/ecosystem/governance/ExtensionCertificationPolicy.ts — 扩展认证策略
// PB7-S3: 验证扩展完整性、发布者身份、安全合规

import { type ExtensionManifest } from '../contracts/ExtensionManifest'

/** 认证级别 */
export enum CertificationLevel {
  /** 未认证 — 用户自行承担风险 */
  UNCERTIFIED = 'uncertified',
  /** 社区认证 — 社区信任 */
  COMMUNITY = 'community',
  /** 开发者认证 — 发布者身份已验证 */
  DEVELOPER = 'developer',
  /** 官方认证 — LH-TV 团队审核通过 */
  OFFICIAL = 'official',
}

/** 认证结果 */
export interface CertificationResult {
  passed: boolean
  level: CertificationLevel
  issues: string[]
}

/** 安全分类 */
export enum SecurityClassification {
  /** 安全 — 无风险 */
  SAFE = 'safe',
  /** 需审查 — 有注意项 */
  REVIEW_NEEDED = 'review_needed',
  /** 危险 — 可能有害 */
  DANGEROUS = 'dangerous',
}

/** 危险权限列表 */
const DANGEROUS_PERMISSIONS: readonly string[] = ['filesystem.write', 'settings.write', 'network.websocket']
/** 需要审查的权限 */
const REVIEW_PERMISSIONS: readonly string[] = ['network.fetch', 'media.access', 'filesystem.read']
/** 最小签名长度 */
const MIN_SIGNATURE_LENGTH = 32

export class ExtensionCertificationPolicy {
  /**
   * 评估扩展认证级别
   */
  static evaluate(manifest: ExtensionManifest): CertificationResult {
    const issues: string[] = []

    // 1. 签名验证
    const hasSignature = manifest.signature && manifest.signature.length >= MIN_SIGNATURE_LENGTH
    if (!hasSignature) {
      issues.push('Extension is unsigned or signature is too short')
    }

    // 2. 发布者验证
    if (!manifest.publisher?.id || !manifest.publisher?.name) {
      issues.push('Publisher information is incomplete')
    }

    // 3. 权限检查
    const declaredPermissionIds = manifest.permissions?.map((p) => p.id) ?? []
    const hasDangerousPerms = declaredPermissionIds.some(
      (pid) => (DANGEROUS_PERMISSIONS as readonly string[]).includes(pid),
    )
    const hasReviewPerms = declaredPermissionIds.some(
      (pid) => (REVIEW_PERMISSIONS as readonly string[]).includes(pid),
    )

    if (hasDangerousPerms) {
      issues.push('Extension requests dangerous permissions')
    } else if (hasReviewPerms) {
      issues.push('Extension requests permissions that need review')
    }

    // 4. 版本检查
    if (!manifest.version || !/^\d+\.\d+\.\d+/.test(manifest.version)) {
      issues.push('Version does not follow semantic versioning')
    }

    // 5. 运行时版本
    if (!manifest.runtimeVersion) {
      issues.push('Runtime version not specified')
    }

    // 判定级别
    if (issues.length === 0) {
      return { passed: true, level: CertificationLevel.DEVELOPER, issues: [] }
    }

    if (hasDangerousPerms) {
      return { passed: false, level: CertificationLevel.UNCERTIFIED, issues }
    }

    if (!hasSignature) {
      return { passed: false, level: CertificationLevel.UNCERTIFIED, issues }
    }

    return { passed: issues.length <= 1, level: CertificationLevel.COMMUNITY, issues }
  }

  /**
   * 安全分类
   */
  static classifySecurity(manifest: ExtensionManifest): SecurityClassification {
    const declaredPermissionIds = manifest.permissions?.map((p) => p.id) ?? []

    if (declaredPermissionIds.some((pid) => (DANGEROUS_PERMISSIONS as readonly string[]).includes(pid))) {
      return SecurityClassification.DANGEROUS
    }

    if (declaredPermissionIds.some((pid) => (REVIEW_PERMISSIONS as readonly string[]).includes(pid))) {
      return SecurityClassification.REVIEW_NEEDED
    }

    return SecurityClassification.SAFE
  }
}
