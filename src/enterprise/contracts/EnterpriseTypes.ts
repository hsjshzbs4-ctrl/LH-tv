// src/enterprise/contracts/EnterpriseTypes.ts — 企业类型定义 (唯一 SSOT)
// PB7-S5: Enterprise Integration 所有模块必须读取此定义
// 审查要求: AuditEvent enum, PermissionRisk enum, PermissionDefinition.id 引用

// ── 权限风险级别 (enum, 非 bool) ──

/** 权限风险级别 — 统一 SSOT, 禁止使用 boolean */
export enum PermissionRisk {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// ── 权限定义 (SSOT) ──

/** 权限定义 — Role 必须引用其 ID, 禁止使用 string[] */
export interface PermissionDefinition {
  /** 权限唯一 ID (如 "user.read", "workspace.write") */
  id: string
  /** 权限名称 */
  name: string
  /** 风险级别 */
  risk: PermissionRisk
  /** 权限描述 */
  description: string
}

/** 角色 — 引用 PermissionDefinition.id[] */
export interface Role {
  /** 角色 ID */
  id: string
  /** 角色名称 */
  name: string
  /** 权限 ID 列表 (引用 PermissionDefinition.id, 支持通配符 "org.*") */
  permissions: string[]
}

// ── 组织 (SSOT: OrganizationRegistry) ──

/** 租户 */
export interface Tenant {
  id: string
  name: string
  createdAt: number
  updatedAt: number
}

/** 部门 */
export interface Department {
  id: string
  tenantId: string
  name: string
  parentId?: string
  createdAt: number
  updatedAt: number
}

/** 工作空间 — 强制 Tenant 隔离 */
export interface Workspace {
  id: string
  tenantId: string
  departmentId: string
  name: string
  /** 成员 ID 列表 */
  memberIds: string[]
  createdAt: number
  updatedAt: number
}

/** 成员 */
export interface Member {
  userId: string
  tenantId: string
  departmentId?: string
  workspaceIds: string[]
  roleId: string
  joinedAt: number
}

// ── 审计 (SSOT: AuditStore) ──

/** 审计事件类型 — enum 统一, 禁止字符串 */
export enum AuditEvent {
  LOGIN = 'login',
  LOGOUT = 'logout',
  PERMISSION = 'permission',
  WORKSPACE = 'workspace',
  PUBLISH = 'publish',
  INSTALL = 'install',
  DELETE = 'delete',
  POLICY = 'policy',
}

/** 审计条目 */
export interface AuditEntry {
  id: string
  event: AuditEvent
  userId: string
  tenantId?: string
  workspaceId?: string
  detail: string
  success: boolean
  timestamp: number
}

/** 审计查询 */
export interface AuditQuery {
  userId?: string
  event?: AuditEvent
  tenantId?: string
  workspaceId?: string
  from?: number
  to?: number
  limit?: number
  offset?: number
}

// ── 合规 (SSOT: CompliancePolicy) ──

/** 合规规则类型 */
export enum ComplianceRuleType {
  RETENTION = 'retention',
  ENCRYPTION = 'encryption',
  GDPR = 'gdpr',
  EXPORT = 'export',
  DELETE = 'delete',
}

/** 合规规则 — CompliancePolicy 持有, ComplianceChecker 仅执行 */
export interface ComplianceRule {
  id: string
  type: ComplianceRuleType
  name: string
  description: string
  enabled: boolean
}

/** 合规检查结果 */
export interface ComplianceResult {
  ruleId: string
  passed: boolean
  details: string[]
}

// ── 身份 (SSOT: IdentityRegistry) ──

/** 身份提供者类型 */
export enum IdentityProviderType {
  SSO = 'sso',
  LDAP = 'ldap',
  SCIM = 'scim',
}

/** 身份提供者条目 */
export interface IdentityProviderEntry {
  id: string
  type: IdentityProviderType
  name: string
  enabled: boolean
  config: Record<string, unknown>
  registeredAt: number
}

/** 注册表快照 — 统一备份/恢复 */
export interface RegistrySnapshot<T = unknown> {
  /** 注册表名称 */
  registry: string
  /** 快照版本 */
  version: number
  /** 快照时间戳 */
  timestamp: number
  /** 数据校验和 (SHA-256 hex) */
  checksum: string
  /** 快照数据 */
  data: T
}

/** 校验 Role */
export function validateRole(role: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  if (!role || typeof role !== 'object') return { valid: false, errors: ['Role must be an object'] }
  const r = role as Record<string, unknown>
  if (!r.id || typeof r.id !== 'string') errors.push('Role.id is required (string)')
  if (!r.name || typeof r.name !== 'string') errors.push('Role.name is required (string)')
  if (!Array.isArray(r.permissions)) errors.push('Role.permissions must be string[]')
  return { valid: errors.length === 0, errors }
}

/** 校验 Workspace */
export function validateWorkspace(w: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  if (!w || typeof w !== 'object') return { valid: false, errors: ['Workspace must be an object'] }
  const ws = w as Record<string, unknown>
  if (!ws.tenantId || typeof ws.tenantId !== 'string') errors.push('Workspace.tenantId is required (string)')
  if (!ws.name || typeof ws.name !== 'string') errors.push('Workspace.name is required (string)')
  return { valid: errors.length === 0, errors }
}

/** 内置权限定义 — SSOT */
export const BUILTIN_PERMISSIONS: PermissionDefinition[] = [
  { id: 'user.read',        name: 'Read Users',           risk: PermissionRisk.LOW,      description: 'View user profiles and status' },
  { id: 'user.write',       name: 'Modify Users',          risk: PermissionRisk.HIGH,     description: 'Create, update, or delete users' },
  { id: 'org.read',         name: 'Read Organization',     risk: PermissionRisk.LOW,      description: 'View organization structure' },
  { id: 'org.write',        name: 'Modify Organization',   risk: PermissionRisk.HIGH,     description: 'Modify tenants, departments, workspaces' },
  { id: 'workspace.read',   name: 'Read Workspace',        risk: PermissionRisk.LOW,      description: 'View workspace content' },
  { id: 'workspace.write',  name: 'Modify Workspace',      risk: PermissionRisk.HIGH,     description: 'Modify workspace members and settings' },
  { id: 'audit.read',       name: 'Read Audit Logs',       risk: PermissionRisk.MEDIUM,   description: 'View audit logs' },
  { id: 'compliance.read',  name: 'Read Compliance',       risk: PermissionRisk.LOW,      description: 'View compliance policies' },
  { id: 'compliance.write', name: 'Modify Compliance',     risk: PermissionRisk.CRITICAL, description: 'Modify compliance policies' },
  { id: 'community.delete', name: 'Delete Community Content', risk: PermissionRisk.HIGH,  description: 'Delete community items (OFFICIAL-level required)' },
]

/** 内置角色 — 引用 PermissionDefinition.id */
export const BUILTIN_ROLES: Role[] = [
  {
    id: 'admin',
    name: 'Administrator',
    permissions: ['user.*', 'org.*', 'workspace.*', 'audit.*', 'compliance.*', 'community.delete'],
  },
  {
    id: 'manager',
    name: 'Manager',
    permissions: ['org.read', 'workspace.*', 'audit.read', 'community.publish', 'community.modify'],
  },
  {
    id: 'member',
    name: 'Member',
    permissions: ['org.read', 'workspace.read', 'community.publish', 'community.rate', 'community.comment', 'community.share'],
  },
  {
    id: 'viewer',
    name: 'Viewer',
    permissions: ['org.read', 'workspace.read', 'community.rate', 'community.comment', 'community.share'],
  },
]
