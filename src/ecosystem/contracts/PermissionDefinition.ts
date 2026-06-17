// src/ecosystem/contracts/PermissionDefinition.ts — 权限定义
// PB7-S3: 扩展必须声明所需权限，运行时由 PermissionManager 校验

/** 权限风险级别 */
export enum PermissionRiskLevel {
  /** 低风险 — 只读、无副作用 */
  LOW = 'low',
  /** 中风险 — 可能读取用户数据 */
  MEDIUM = 'medium',
  /** 高风险 — 可能修改用户数据或系统设置 */
  HIGH = 'high',
  /** 严重 — 可能影响系统安全 */
  CRITICAL = 'critical',
}

/** 权限定义 — ExtensionManifest.permissions 中的声明类型 */
export interface PermissionDefinition {
  /** 权限唯一 ID */
  permissionId: string
  /** 权限名称 */
  name: string
  /** 权限描述 */
  description: string
  /** 风险级别 */
  riskLevel: PermissionRiskLevel
}

/** 运行时权限请求 — Extension 请求使用某项能力时提交 */
export interface PermissionRequest {
  /** 扩展 ID */
  extensionId: string
  /** 请求的权限 ID */
  permissionId: string
  /** 请求原因 */
  reason: string
  /** 请求时间 */
  timestamp: number
}

/** 权限校验结果 */
export interface PermissionCheckResult {
  /** 是否允许 */
  allowed: boolean
  /** 拒绝原因 */
  reason?: string
  /** 是否需要用户确认 */
  requiresUserConsent: boolean
}

/** 权限审计条目 */
export interface PermissionAuditEntry {
  /** 扩展 ID */
  extensionId: string
  /** 权限 ID */
  permissionId: string
  /** 操作: grant | deny | revoke | check */
  action: 'grant' | 'deny' | 'revoke' | 'check'
  /** 是否成功 */
  success: boolean
  /** 原因 */
  reason?: string
  /** 时间戳 */
  timestamp: number
}

/** 内置权限定义 (PB7-S3 Foundation) */
export const BUILTIN_PERMISSIONS: PermissionDefinition[] = [
  {
    permissionId: 'storage.read',
    name: 'Storage Read',
    description: 'Read data from extension storage',
    riskLevel: PermissionRiskLevel.LOW,
  },
  {
    permissionId: 'storage.write',
    name: 'Storage Write',
    description: 'Write data to extension storage',
    riskLevel: PermissionRiskLevel.MEDIUM,
  },
  {
    permissionId: 'ui.render',
    name: 'UI Render',
    description: 'Render UI components in the host application',
    riskLevel: PermissionRiskLevel.LOW,
  },
  {
    permissionId: 'ui.overlay',
    name: 'UI Overlay',
    description: 'Display overlay elements on top of the main UI',
    riskLevel: PermissionRiskLevel.MEDIUM,
  },
  {
    permissionId: 'network.fetch',
    name: 'Network Fetch',
    description: 'Make HTTP requests to external services',
    riskLevel: PermissionRiskLevel.HIGH,
  },
  {
    permissionId: 'network.websocket',
    name: 'Network WebSocket',
    description: 'Open persistent WebSocket connections',
    riskLevel: PermissionRiskLevel.HIGH,
  },
  {
    permissionId: 'command.execute',
    name: 'Command Execute',
    description: 'Register and execute custom commands',
    riskLevel: PermissionRiskLevel.MEDIUM,
  },
  {
    permissionId: 'notification.send',
    name: 'Notification Send',
    description: 'Send notifications to the user',
    riskLevel: PermissionRiskLevel.LOW,
  },
  {
    permissionId: 'media.access',
    name: 'Media Access',
    description: 'Access media library and playback information',
    riskLevel: PermissionRiskLevel.HIGH,
  },
  {
    permissionId: 'settings.read',
    name: 'Settings Read',
    description: 'Read application settings',
    riskLevel: PermissionRiskLevel.LOW,
  },
  {
    permissionId: 'settings.write',
    name: 'Settings Write',
    description: 'Modify application settings',
    riskLevel: PermissionRiskLevel.CRITICAL,
  },
  {
    permissionId: 'filesystem.read',
    name: 'Filesystem Read',
    description: 'Read files from the user filesystem',
    riskLevel: PermissionRiskLevel.CRITICAL,
  },
  {
    permissionId: 'filesystem.write',
    name: 'Filesystem Write',
    description: 'Write files to the user filesystem',
    riskLevel: PermissionRiskLevel.CRITICAL,
  },
]
