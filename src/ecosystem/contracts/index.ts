// src/ecosystem/contracts/index.ts — Contracts barrel
export {
  ExtensionType,
  ExtensionState,
  validateManifest,
  type ExtensionManifest,
  type ManifestPermission,
  type ManifestCapability,
  type PublisherInfo,
  type ManifestValidationResult,
} from './ExtensionManifest'

export {
  PermissionRiskLevel,
  BUILTIN_PERMISSIONS,
  type PermissionDefinition,
  type PermissionRequest,
  type PermissionCheckResult,
  type PermissionAuditEntry,
} from './PermissionDefinition'

export {
  BUILTIN_CAPABILITIES,
  type RuntimeCapability,
  type CapabilityCheckResult,
} from './RuntimeCapability'
