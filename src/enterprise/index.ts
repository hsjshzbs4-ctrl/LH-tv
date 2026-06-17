// src/enterprise/index.ts — Enterprise Integration (PB7-S5) 统一入口
// PB7 ENTERPRISE ERA Foundation

// ── Contracts (SSOT Types) ──
export {
  PermissionRisk,
  AuditEvent,
  ComplianceRuleType,
  IdentityProviderType,
  validateRole,
  validateWorkspace,
  BUILTIN_PERMISSIONS,
  BUILTIN_ROLES,
  type PermissionDefinition,
  type Role,
  type Tenant,
  type Department,
  type Workspace,
  type Member,
  type AuditEntry,
  type ComplianceRule,
  type ComplianceResult,
  type IdentityProviderEntry,
} from './contracts'

// ── Identity ──
export {
  IdentityRegistry,
  identityRegistry,
  IdentityProvider,
  SSOManager,
  ssoManager,
  LDAPProvider,
  SCIMProvider,
  type AuthenticationResult,
  type UserInfo,
} from './identity'

// ── Organization ──
export {
  OrganizationRegistry,
  organizationRegistry,
  OrganizationService,
  organizationService,
  WorkspaceService,
  workspaceService,
} from './organization'

// ── RBAC ──
export {
  RBACManager,
  rbacManager,
  getPermissionById,
  getRoleById,
  roleHasPermission,
} from './auth'

// ── Audit ──
export {
  AuditStore,
  auditStore,
  AuditLogger,
  auditLogger,
} from './audit'

export { AuditQuery, auditQuery } from './audit'

// ── Compliance ──
export {
  CompliancePolicy,
  compliancePolicy,
  ComplianceChecker,
  complianceChecker,
} from './compliance'

// ── Governance ──
export {
  EnterprisePolicy,
  RegistrySnapshotService,
  GovernanceEventBus,
  governanceEventBus,
  GovernanceEventType,
  type SystemSnapshot,
  type GovernanceEvent,
  type EventListener,
} from './governance'

// ── Facade ──
export {
  CommunityFacade,
  communityFacade,
} from './facade'
