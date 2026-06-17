// src/platform/plugins/index.ts — S5-4 Unified Plugin Platform 统一导出

// Types
export {
  PluginType,
  PluginState,
  type PluginManifest,
  type PluginCapability,
  type PluginRegistryEntry,
  type SandboxConfig,
} from './types/plugin.types'

// Manager
export { PluginManager, pluginManager } from './manager/PluginManager'
export { PluginRegistry, pluginRegistry } from './manager/PluginRegistry'

// Sandbox
export { PluginSandbox, pluginSandbox } from './sandbox/PluginSandbox'

// Adapters
export {
  adaptProviderToPlugin,
  adaptRecommendationProviderToPlugin,
  getProviderCapabilities,
} from './adapters/ProviderPluginAdapter'
