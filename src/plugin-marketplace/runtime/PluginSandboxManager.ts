// src/plugin-marketplace/runtime/PluginSandboxManager.ts — 插件沙箱管理器
// P5.1 Plugin Marketplace Core
import { pluginLifecycleManager } from './PluginLifecycleManager'
import type { SandboxConfig, RuntimePlugin } from './types'
import { PluginState } from '../storage/types'

export class PluginSandboxManager {
  private config: SandboxConfig
  private isolates = new Map<string, RuntimePlugin>()

  constructor(config?: Partial<SandboxConfig>) {
    this.config = {
      isolated: true,
      maxCpu: 0.5,
      maxMemory: 128 * 1024 * 1024,
      timeout: 10000,
      maxRestarts: 3,
      ...config,
    }
  }

  /** 创建隔离执行环境 */
  isolate(pluginId: string): void {
    const instance = pluginLifecycleManager.getOrCreate(pluginId)
    this.isolates.set(pluginId, instance)
  }

  /** 释放隔离环境 */
  release(pluginId: string): void {
    this.isolates.delete(pluginId)
  }

  /** 是否已隔离 */
  isIsolated(pluginId: string): boolean {
    return this.isolates.has(pluginId)
  }

  /** 检查资源限制 */
  checkResourceLimits(pluginId: string): { ok: boolean; reason?: string } {
    const metrics = pluginLifecycleManager.getMetrics(pluginId)
    if (metrics.cpuUsage > this.config.maxCpu) {
      return { ok: false, reason: `CPU limit exceeded: ${metrics.cpuUsage} > ${this.config.maxCpu}` }
    }
    if (metrics.memoryUsage > this.config.maxMemory) {
      return { ok: false, reason: `Memory limit exceeded` }
    }
    return { ok: true }
  }

  /** 获取沙箱配置 */
  getConfig(): Readonly<SandboxConfig> {
    return this.config
  }
}

export const pluginSandboxManager = new PluginSandboxManager()
