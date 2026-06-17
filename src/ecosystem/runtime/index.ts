// src/ecosystem/runtime/index.ts — Runtime barrel
export {
  ExtensionRuntime,
  extensionRuntime,
} from './ExtensionRuntime'

export {
  SandboxManager,
  sandboxManager,
  SandboxMode,
  DEFAULT_SANDBOX_CONFIG,
  type SandboxConfig,
  type SandboxInstance,
} from './SandboxManager'

export {
  LifecycleManager,
  lifecycleManager,
  type ExtensionInstance,
  type LifecycleHooks,
  type LifecycleEvent,
  type StateChangeListener,
} from './LifecycleManager'

export {
  ResourceManager,
  resourceManager,
  DEFAULT_SANDBOX_QUOTA,
  type ResourceQuota,
  type ResourceUsage,
} from './ResourceManager'
