// src/ecosystem/index.ts — Ecosystem Runtime (PB7-S3) 统一入口
// PB7 ECOSYSTEM ERA Foundation

// ── Contracts (SSOT Types) ──
export {
  ExtensionType,
  ExtensionState,
  validateManifest,
  PermissionRiskLevel,
  BUILTIN_PERMISSIONS,
  BUILTIN_CAPABILITIES,
  type ExtensionManifest,
  type ManifestPermission,
  type ManifestCapability,
  type PublisherInfo,
  type ManifestValidationResult,
  type PermissionDefinition,
  type PermissionRequest,
  type PermissionCheckResult,
  type PermissionAuditEntry,
  type RuntimeCapability,
  type CapabilityCheckResult,
} from './contracts'

// ── Runtime ──
export {
  ExtensionRuntime,
  extensionRuntime,
  SandboxManager,
  sandboxManager,
  SandboxMode,
  DEFAULT_SANDBOX_CONFIG,
  LifecycleManager,
  lifecycleManager,
  ResourceManager,
  resourceManager,
  DEFAULT_SANDBOX_QUOTA,
  type SandboxConfig,
  type SandboxInstance,
  type ExtensionInstance,
  type LifecycleHooks,
  type LifecycleEvent,
  type StateChangeListener,
  type ResourceQuota,
  type ResourceUsage,
} from './runtime'

// ── Permission ──
export {
  PermissionManager,
  permissionManager,
  RuntimePolicy,
  runtimePolicy,
  CapabilityChecker,
  capabilityChecker,
  type PolicyRule,
  type PolicyCheckResult,
} from './permission'

// ── Registry (Marketplace SSOT) ──
export {
  MarketplaceRegistry,
  marketplaceRegistry,
  type MarketplaceEntry,
  type RegistryQuery,
} from './registry'

// ── Host API ──
export {
  HostAPI,
  hostAPI,
  type HostAPIRequest,
  type HostAPIResponse,
} from './host'

// ── Governance ──
export {
  ExtensionCertificationPolicy,
  CertificationLevel,
  SecurityClassification,
  type CertificationResult,
} from './governance'
