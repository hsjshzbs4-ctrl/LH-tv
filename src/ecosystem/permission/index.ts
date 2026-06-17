// src/ecosystem/permission/index.ts — Permission barrel
export {
  PermissionManager,
  permissionManager,
} from './PermissionManager'

export {
  RuntimePolicy,
  runtimePolicy,
  type PolicyRule,
  type PolicyCheckResult,
} from './RuntimePolicy'

export {
  CapabilityChecker,
  capabilityChecker,
} from './CapabilityChecker'
