// src/plugin-marketplace/runtime/types.ts — 运行时类型
// P5.1 Plugin Marketplace Core

import type { PluginState } from '../storage/types'

/** 插件生命周期钩子 */
export interface PluginLifecycleHooks {
  onInstall?: () => Promise<void>
  onEnable?: () => Promise<void>
  onDisable?: () => Promise<void>
  onUpdate?: (fromVersion: string, toVersion: string) => Promise<void>
  onUninstall?: () => Promise<void>
}

/** 运行时插件实例 */
export interface RuntimePlugin {
  id: string
  state: PluginState
  hooks: PluginLifecycleHooks
  /** 运行时指标 */
  metrics: PluginMetrics
}

/** 运行时指标 */
export interface PluginMetrics {
  cpuUsage: number
  memoryUsage: number
  errors: number
  lastError?: string
  lastErrorTime?: number
  stateChanges: number
  permissionDenials: number
}

/** 沙箱配置 */
export interface SandboxConfig {
  /** 是否启用 Worker 隔离 */
  isolated: boolean
  /** 最大 CPU 使用率 (0-1) */
  maxCpu: number
  /** 最大内存 (bytes) */
  maxMemory: number
  /** 超时时间 (ms) */
  timeout: number
  /** 最大重启次数 */
  maxRestarts: number
}
