// src/ecosystem/runtime/SandboxManager.ts — 沙箱管理器
// PB7-S3: 隔离运行环境，限制扩展访问能力

import { resourceManager, type ResourceQuota } from './ResourceManager'

/** 沙箱模式 */
export enum SandboxMode {
  /** 严格隔离 — 完全独立运行，无权访问宿主 */
  STRICT = 'strict',
  /** 标准隔离 — 受限访问 Host API */
  STANDARD = 'standard',
  /** 信任模式 — 宽松限制 (仅用于内部扩展) */
  TRUSTED = 'trusted',
}

/** 沙箱配置 */
export interface SandboxConfig {
  mode: SandboxMode
  quota: ResourceQuota
  /** 允许的 Host API 白名单 */
  allowedAPIs: string[]
  /** 最大重启次数 (0 = 不限制) */
  maxRestarts: number
}

/** 沙箱实例信息 */
export interface SandboxInstance {
  extensionId: string
  mode: SandboxMode
  quota: ResourceQuota
  restartCount: number
  startedAt: number
}

/** 默认沙箱配置 */
export const DEFAULT_SANDBOX_CONFIG: SandboxConfig = {
  mode: SandboxMode.STANDARD,
  quota: {
    maxCpu: 50,
    maxMemory: 128 * 1024 * 1024,
    maxStorage: 10 * 1024 * 1024,
    maxNetworkRPM: 60,
  },
  allowedAPIs: ['storage', 'ui', 'commands', 'notifications'],
  maxRestarts: 3,
}

export class SandboxManager {
  private sandboxes = new Map<string, SandboxInstance>()

  /** 创建沙箱 */
  create(extensionId: string, config?: Partial<SandboxConfig>): SandboxInstance {
    const merged: SandboxConfig = {
      ...DEFAULT_SANDBOX_CONFIG,
      ...config,
      quota: { ...DEFAULT_SANDBOX_CONFIG.quota, ...(config?.quota ?? {}) },
    }

    // 应用资源配额
    resourceManager.setQuota(extensionId, merged.quota)

    const instance: SandboxInstance = {
      extensionId,
      mode: merged.mode,
      quota: merged.quota,
      restartCount: 0,
      startedAt: Date.now(),
    }

    this.sandboxes.set(extensionId, instance)
    return instance
  }

  /** 获取沙箱配置 */
  get(extensionId: string): SandboxInstance | null {
    return this.sandboxes.get(extensionId) ?? null
  }

  /** 检查 API 访问权限 */
  checkAPIAccess(extensionId: string, apiName: string): { allowed: boolean; reason?: string } {
    const sandbox = this.sandboxes.get(extensionId)
    if (!sandbox) {
      return { allowed: false, reason: `No sandbox found for extension "${extensionId}"` }
    }

    if (sandbox.mode === SandboxMode.STRICT) {
      return { allowed: false, reason: 'Strict sandbox mode: no Host API access allowed' }
    }

    if (sandbox.mode === SandboxMode.TRUSTED) {
      return { allowed: true }
    }

    // STANDARD 模式: 检查白名单
    const config = DEFAULT_SANDBOX_CONFIG
    if (!config.allowedAPIs.includes(apiName)) {
      return {
        allowed: false,
        reason: `API "${apiName}" not in sandbox allowlist: [${config.allowedAPIs.join(', ')}]`,
      }
    }

    return { allowed: true }
  }

  /** 记录重启 */
  recordRestart(extensionId: string): { allowed: boolean; reason?: string } {
    const sandbox = this.sandboxes.get(extensionId)
    if (!sandbox) return { allowed: false, reason: 'Sandbox not found' }

    sandbox.restartCount++
    if (DEFAULT_SANDBOX_CONFIG.maxRestarts > 0 && sandbox.restartCount > DEFAULT_SANDBOX_CONFIG.maxRestarts) {
      return {
        allowed: false,
        reason: `Max restarts (${DEFAULT_SANDBOX_CONFIG.maxRestarts}) exceeded`,
      }
    }
    return { allowed: true }
  }

  /** 销毁沙箱 */
  destroy(extensionId: string): void {
    this.sandboxes.delete(extensionId)
    resourceManager.remove(extensionId)
  }

  /** 列出所有活跃沙箱 */
  list(): SandboxInstance[] {
    return Array.from(this.sandboxes.values())
  }
}

export const sandboxManager = new SandboxManager()
