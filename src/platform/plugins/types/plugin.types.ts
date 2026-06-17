// src/platform/plugins/types/plugin.types.ts — S5-4 统一插件类型

/** 插件类型 */
export enum PluginType {
  METADATA_PROVIDER = 'metadata-provider',
  SUBTITLE_PROVIDER = 'subtitle-provider',
  ANALYTICS_PROVIDER = 'analytics-provider',
  RECOMMENDATION_PROVIDER = 'recommendation-provider',
  UI_EXTENSION = 'ui-extension',
}

/** 插件状态 */
export enum PluginState {
  INSTALLED = 'installed',
  ENABLED = 'enabled',
  DISABLED = 'disabled',
  ERROR = 'error',
  UPDATING = 'updating',
}

/** 统一插件清单 */
export interface PluginManifest {
  id: string
  name: string
  version: string
  type: PluginType
  description: string
  author: string
  permissions: string[]
  dependencies: string[]
  state: PluginState
  installedAt: number
  updatedAt: number
  metadata?: Record<string, unknown>
}

/** 插件能力描述 */
export interface PluginCapability {
  type: string
  version: string
  description: string
}

/** 插件注册条目 */
export interface PluginRegistryEntry {
  manifest: PluginManifest
  capabilities: PluginCapability[]
  instance?: unknown // 插件运行时实例 (由 Adapter 管理)
}

/** 沙箱配置 */
export interface SandboxConfig {
  isolated: boolean
  maxMemory: number
  timeout: number
  allowedAPIs: string[]
}
