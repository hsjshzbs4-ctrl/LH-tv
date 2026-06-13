// src/plugin-marketplace/index.ts — Plugin Marketplace Core 统一导出
// P5.1 Plugin Marketplace Core

// Repository
export { PluginRepository, pluginRepository } from './repository/PluginRepository'
export { RepositoryClient } from './repository/RepositoryClient'
export type { MarketplacePlugin, PluginVersion, RepositoryQuery, RepositoryResult } from './repository/types'

// Storage
export { PluginStorage, pluginStorage } from './storage/PluginStorage'
export { PluginState } from './storage/types'
export type { InstalledPluginMeta, UpdateRecord } from './storage/types'

// Permissions
export { PermissionManager, permissionManager } from './permissions/PermissionManager'
export { PluginPermission, PERMISSION_DESCRIPTIONS } from './permissions/types'
export type { PermissionCheckResult } from './permissions/types'

// Signatures
export { PluginVerifier, pluginVerifier } from './signatures/PluginVerifier'
export { SignatureStore, signatureStore } from './signatures/SignatureStore'
export type { PluginSignature, SignatureVerificationResult } from './signatures/types'

// Installer
export { PluginInstaller, pluginInstaller } from './installer/PluginInstaller'
export { PluginUninstaller, pluginUninstaller } from './installer/PluginUninstaller'

// Updates
export { PluginUpdateManager, pluginUpdateManager } from './updates/PluginUpdateManager'
export { UpdateStatus } from './updates/types'
export type { UpdateCheckResult, MigrationTask, MigrationStep } from './updates/types'

// Runtime
export { PluginLifecycleManager, pluginLifecycleManager } from './runtime/PluginLifecycleManager'
export { PluginSandboxManager, pluginSandboxManager } from './runtime/PluginSandboxManager'
export type { PluginLifecycleHooks, RuntimePlugin, PluginMetrics, SandboxConfig } from './runtime/types'
