// src/community/governance/CommunityPolicy.ts — 社区治理策略
// PB7-S4: 基于 CertificationLevel 的权限矩阵，映射 Ecosystem Governance SSOT
// 静态类，遵循 ExtensionCertificationPolicy 模式

import { CertificationLevel } from '@ecosystem/index'

/** 社区操作 */
export enum CommunityAction {
  /** 分享内容 */
  SHARE = 'share',
  /** 评分 */
  RATE = 'rate',
  /** 评论 */
  COMMENT = 'comment',
  /** 发布模板 */
  PUBLISH_TEMPLATE = 'publish_template',
  /** 发布 Agent */
  PUBLISH_AGENT = 'publish_agent',
  /** 修改共享配置 */
  MODIFY_SHARED_CONFIG = 'modify_shared_config',
  /** 删除共享内容 */
  DELETE_SHARED_CONTENT = 'delete_shared_content',
}

/** 社区权限级别 */
export enum CommunityPermissionLevel {
  /** 安全 — 无需确认 */
  SAFE = 'safe',
  /** 需用户确认 */
  CONFIRM = 'confirm',
  /** 禁止 */
  FORBIDDEN = 'forbidden',
}

/**
 * 权限矩阵: CertificationLevel → Action → CommunityPermissionLevel
 *
 * | Action            | UNCERTIFIED | COMMUNITY | DEVELOPER | OFFICIAL |
 * |-------------------|-------------|-----------|-----------|----------|
 * | Share/Rate/Comment| SAFE        | SAFE      | SAFE      | SAFE     |
 * | Publish Template  | FORBIDDEN   | CONFIRM   | CONFIRM   | SAFE     |
 * | Publish Agent     | FORBIDDEN   | CONFIRM   | CONFIRM   | SAFE     |
 * | Modify Config     | FORBIDDEN   | CONFIRM   | CONFIRM   | SAFE     |
 * | Delete Content    | FORBIDDEN   | FORBIDDEN | FORBIDDEN | SAFE     |
 */
const PERMISSION_MATRIX: Record<CertificationLevel, Record<CommunityAction, CommunityPermissionLevel>> = {
  [CertificationLevel.UNCERTIFIED]: {
    [CommunityAction.SHARE]: CommunityPermissionLevel.SAFE,
    [CommunityAction.RATE]: CommunityPermissionLevel.SAFE,
    [CommunityAction.COMMENT]: CommunityPermissionLevel.SAFE,
    [CommunityAction.PUBLISH_TEMPLATE]: CommunityPermissionLevel.FORBIDDEN,
    [CommunityAction.PUBLISH_AGENT]: CommunityPermissionLevel.FORBIDDEN,
    [CommunityAction.MODIFY_SHARED_CONFIG]: CommunityPermissionLevel.FORBIDDEN,
    [CommunityAction.DELETE_SHARED_CONTENT]: CommunityPermissionLevel.FORBIDDEN,
  },
  [CertificationLevel.COMMUNITY]: {
    [CommunityAction.SHARE]: CommunityPermissionLevel.SAFE,
    [CommunityAction.RATE]: CommunityPermissionLevel.SAFE,
    [CommunityAction.COMMENT]: CommunityPermissionLevel.SAFE,
    [CommunityAction.PUBLISH_TEMPLATE]: CommunityPermissionLevel.CONFIRM,
    [CommunityAction.PUBLISH_AGENT]: CommunityPermissionLevel.CONFIRM,
    [CommunityAction.MODIFY_SHARED_CONFIG]: CommunityPermissionLevel.CONFIRM,
    [CommunityAction.DELETE_SHARED_CONTENT]: CommunityPermissionLevel.FORBIDDEN,
  },
  [CertificationLevel.DEVELOPER]: {
    [CommunityAction.SHARE]: CommunityPermissionLevel.SAFE,
    [CommunityAction.RATE]: CommunityPermissionLevel.SAFE,
    [CommunityAction.COMMENT]: CommunityPermissionLevel.SAFE,
    [CommunityAction.PUBLISH_TEMPLATE]: CommunityPermissionLevel.CONFIRM,
    [CommunityAction.PUBLISH_AGENT]: CommunityPermissionLevel.CONFIRM,
    [CommunityAction.MODIFY_SHARED_CONFIG]: CommunityPermissionLevel.CONFIRM,
    [CommunityAction.DELETE_SHARED_CONTENT]: CommunityPermissionLevel.FORBIDDEN,
  },
  [CertificationLevel.OFFICIAL]: {
    [CommunityAction.SHARE]: CommunityPermissionLevel.SAFE,
    [CommunityAction.RATE]: CommunityPermissionLevel.SAFE,
    [CommunityAction.COMMENT]: CommunityPermissionLevel.SAFE,
    [CommunityAction.PUBLISH_TEMPLATE]: CommunityPermissionLevel.SAFE,
    [CommunityAction.PUBLISH_AGENT]: CommunityPermissionLevel.SAFE,
    [CommunityAction.MODIFY_SHARED_CONFIG]: CommunityPermissionLevel.SAFE,
    [CommunityAction.DELETE_SHARED_CONTENT]: CommunityPermissionLevel.SAFE,
  },
}

export class CommunityPolicy {
  /**
   * 获取指定认证级别对某操作的权限级别
   */
  static getPermissionLevel(
    certificationLevel: CertificationLevel,
    action: CommunityAction,
  ): CommunityPermissionLevel {
    return PERMISSION_MATRIX[certificationLevel]?.[action] ?? CommunityPermissionLevel.FORBIDDEN
  }

  /** 是否允许发布 (模板或 Agent) */
  static canPublish(certificationLevel: CertificationLevel): boolean {
    const level = PERMISSION_MATRIX[certificationLevel]?.[CommunityAction.PUBLISH_TEMPLATE]
    return level !== CommunityPermissionLevel.FORBIDDEN
  }

  /** 是否允许删除共享内容 (仅 OFFICIAL) */
  static canDelete(certificationLevel: CertificationLevel): boolean {
    const level = PERMISSION_MATRIX[certificationLevel]?.[CommunityAction.DELETE_SHARED_CONTENT]
    return level !== CommunityPermissionLevel.FORBIDDEN
  }

  /** 是否允许修改共享配置 */
  static canModifySharedConfig(certificationLevel: CertificationLevel): boolean {
    const level = PERMISSION_MATRIX[certificationLevel]?.[CommunityAction.MODIFY_SHARED_CONFIG]
    return level !== CommunityPermissionLevel.FORBIDDEN
  }

  /** 是否允许评分 (所有级别) */
  static canRate(_certificationLevel: CertificationLevel): boolean {
    return true
  }

  /** 是否允许评论 (所有级别) */
  static canComment(_certificationLevel: CertificationLevel): boolean {
    return true
  }

  /** 是否允许分享 (所有级别) */
  static canShare(_certificationLevel: CertificationLevel): boolean {
    return true
  }

  /** 是否需要用户确认 */
  static requiresConfirmation(action: CommunityAction): boolean {
    // SAFE 动作永远不需要确认
    const safeActions: CommunityAction[] = [
      CommunityAction.SHARE,
      CommunityAction.RATE,
      CommunityAction.COMMENT,
    ]
    if (safeActions.includes(action)) return false

    // 其余动作对于 UNCERTIFIED 是 FORBIDDEN，对其他级别在 CONFIRM 以上
    return true
  }

  /**
   * 验证操作是否允许
   * @returns { allowed: boolean; level: CommunityPermissionLevel; reason?: string }
   */
  static validate(
    certificationLevel: CertificationLevel,
    action: CommunityAction,
  ): { allowed: boolean; level: CommunityPermissionLevel; reason?: string } {
    const level = CommunityPolicy.getPermissionLevel(certificationLevel, action)

    if (level === CommunityPermissionLevel.FORBIDDEN) {
      return {
        allowed: false,
        level,
        reason: `Action "${action}" is FORBIDDEN for certification level "${certificationLevel}"`,
      }
    }

    return { allowed: true, level }
  }
}
