// src/platform/plugins/sandbox/PluginSandbox.ts — 插件沙箱
// PB5: 声明式接口，真实隔离在 PB6 实现

import type { SandboxConfig } from '../types/plugin.types'

const DEFAULT_CONFIG: SandboxConfig = {
  isolated: false,
  maxMemory: 128 * 1024 * 1024, // 128 MB
  timeout: 10000,
  allowedAPIs: [],
}

export class PluginSandbox {
  private config: SandboxConfig
  private isolatedPlugins = new Set<string>()

  constructor(config?: Partial<SandboxConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /** 隔离插件 (标记为 isolated) */
  isolate(pluginId: string): void {
    if (!this.config.isolated) return
    this.isolatedPlugins.add(pluginId)
  }

  /** 释放隔离 */
  release(pluginId: string): void {
    this.isolatedPlugins.delete(pluginId)
  }

  /** 检查是否隔离 */
  isIsolated(pluginId: string): boolean {
    return this.isolatedPlugins.has(pluginId)
  }

  /** 验证插件能否在当前沙箱中运行 */
  validate(pluginId: string): { valid: boolean; reason?: string } {
    if (this.isolatedPlugins.has(pluginId) && !this.config.isolated) {
      return { valid: false, reason: 'Plugin requires isolation but sandbox is disabled' }
    }
    return { valid: true }
  }

  /** 获取沙箱配置 */
  getConfig(): SandboxConfig {
    return { ...this.config }
  }
}

export const pluginSandbox = new PluginSandbox()
