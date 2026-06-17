// src/ecosystem/runtime/ResourceManager.ts — 资源管理器
// PB7-S3: CPU / Memory / Storage 配额管理

/** 资源配额 */
export interface ResourceQuota {
  /** 最大 CPU 使用率 (0~100, 0 = 不限制) */
  maxCpu: number
  /** 最大内存 (bytes, 0 = 不限制) */
  maxMemory: number
  /** 最大存储 (bytes, 0 = 不限制) */
  maxStorage: number
  /** 最大网络请求数/分钟 (0 = 不限制) */
  maxNetworkRPM: number
}

/** 资源使用快照 */
export interface ResourceUsage {
  extensionId: string
  cpu: number
  memory: number
  storage: number
  networkRPM: number
  timestamp: number
}

/** 默认沙箱配额 (单个扩展) */
export const DEFAULT_SANDBOX_QUOTA: ResourceQuota = {
  maxCpu: 50,
  maxMemory: 128 * 1024 * 1024, // 128 MB
  maxStorage: 10 * 1024 * 1024,  // 10 MB
  maxNetworkRPM: 60,
}

export class ResourceManager {
  private quotas = new Map<string, ResourceQuota>()
  private usage = new Map<string, ResourceUsage>()

  /** 设置扩展资源配额 */
  setQuota(extensionId: string, quota: ResourceQuota): void {
    this.quotas.set(extensionId, quota)
  }

  /** 获取扩展资源配额 */
  getQuota(extensionId: string): ResourceQuota {
    return this.quotas.get(extensionId) ?? { ...DEFAULT_SANDBOX_QUOTA }
  }

  /** 检查 CPU 是否超限 */
  checkCpu(extensionId: string, currentCpu: number): { allowed: boolean; reason?: string } {
    const quota = this.getQuota(extensionId)
    if (quota.maxCpu > 0 && currentCpu > quota.maxCpu) {
      return { allowed: false, reason: `CPU usage ${currentCpu}% exceeds quota ${quota.maxCpu}%` }
    }
    return { allowed: true }
  }

  /** 检查内存是否超限 */
  checkMemory(extensionId: string, currentMemory: number): { allowed: boolean; reason?: string } {
    const quota = this.getQuota(extensionId)
    if (quota.maxMemory > 0 && currentMemory > quota.maxMemory) {
      return { allowed: false, reason: `Memory ${currentMemory} bytes exceeds quota ${quota.maxMemory} bytes` }
    }
    return { allowed: true }
  }

  /** 检查存储是否超限 */
  checkStorage(extensionId: string, currentStorage: number): { allowed: boolean; reason?: string } {
    const quota = this.getQuota(extensionId)
    if (quota.maxStorage > 0 && currentStorage > quota.maxStorage) {
      return { allowed: false, reason: `Storage ${currentStorage} bytes exceeds quota ${quota.maxStorage} bytes` }
    }
    return { allowed: true }
  }

  /** 更新资源使用情况 */
  updateUsage(extensionId: string, usage: Partial<ResourceUsage>): void {
    const current = this.usage.get(extensionId) ?? {
      extensionId,
      cpu: 0,
      memory: 0,
      storage: 0,
      networkRPM: 0,
      timestamp: Date.now(),
    }
    this.usage.set(extensionId, { ...current, ...usage, timestamp: Date.now() })
  }

  /** 获取资源使用快照 */
  getUsage(extensionId: string): ResourceUsage | null {
    return this.usage.get(extensionId) ?? null
  }

  /** 清理扩展所有配额和用量 */
  remove(extensionId: string): void {
    this.quotas.delete(extensionId)
    this.usage.delete(extensionId)
  }
}

export const resourceManager = new ResourceManager()
