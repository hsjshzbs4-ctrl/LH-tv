// src/enterprise/identity/IdentityRegistry.ts — 身份提供者注册中心 (唯一 SSOT)
// PB7-S5: 统一管理所有 Identity Provider, 禁止直接 new LDAPProvider/SCIMProvider
// 审查要求: export() + 单一 SSOT

import { featureFlagManager } from '@platform/flags'
import type { IdentityProviderEntry, IdentityProviderType, RegistrySnapshot } from '../contracts'

export class IdentityRegistry {
  private providers = new Map<string, IdentityProviderEntry>()

  /** 注册身份提供者 */
  register(entry: IdentityProviderEntry): { success: boolean; error?: string } {
    this.ensureEnabled()
    if (this.providers.has(entry.id)) {
      return { success: false, error: `Identity provider "${entry.id}" already registered` }
    }
    this.providers.set(entry.id, entry)
    return { success: true }
  }

  /** 注销身份提供者 */
  unregister(id: string): boolean {
    this.ensureEnabled()
    return this.providers.delete(id)
  }

  /** 获取提供者 */
  get(id: string): IdentityProviderEntry | null {
    return this.providers.get(id) ?? null
  }

  /** 列出所有提供者 */
  list(): IdentityProviderEntry[] {
    return Array.from(this.providers.values())
  }

  /** 按类型过滤 */
  listByType(type: IdentityProviderType): IdentityProviderEntry[] {
    return this.list().filter((p) => p.type === type)
  }

  /** 获取启用的提供者 */
  listEnabled(): IdentityProviderEntry[] {
    return this.list().filter((p) => p.enabled)
  }

  /** 导出所有提供者 (用于备份) */
  export(): IdentityProviderEntry[] {
    return this.list()
  }

  // ── Snapshot / Restore / Checksum (PB7-S5.1) ──

  /** 创建不可变快照 */
  snapshot(): RegistrySnapshot<IdentityProviderEntry[]> {
    const data = this.export()
    const timestamp = Date.now()
    return {
      registry: 'IdentityRegistry',
      version: 1,
      timestamp,
      checksum: this.computeChecksum(JSON.stringify(data)),
      data,
    }
  }

  /** 从快照恢复 */
  restore(snapshot: RegistrySnapshot<IdentityProviderEntry[]>): { success: boolean; error?: string } {
    this.ensureEnabled()
    if (snapshot.registry !== 'IdentityRegistry') {
      return { success: false, error: 'Snapshot registry mismatch' }
    }
    const expectedChecksum = this.computeChecksum(JSON.stringify(snapshot.data))
    if (snapshot.checksum !== expectedChecksum) {
      return { success: false, error: 'Snapshot checksum mismatch — data may be corrupted' }
    }
    this.providers.clear()
    for (const entry of snapshot.data) {
      this.providers.set(entry.id, entry)
    }
    return { success: true }
  }

  /** 计算当前状态校验和 */
  checksum(): string {
    return this.computeChecksum(JSON.stringify(this.export()))
  }

  private computeChecksum(data: string): string {
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i)
      hash = ((hash << 5) - hash + char) | 0
    }
    return (hash >>> 0).toString(16).padStart(8, '0')
  }

  /** 按租户清理提供者 (GDPR/租户删除) */
  clearTenant(_tenantId: string): number {
    this.ensureEnabled()
    // 清除指定租户关联的提供者 (当前 stub: 返回清理计数)
    let count = 0
    for (const [id, provider] of this.providers) {
      if (provider.config?.tenantId === _tenantId) {
        this.providers.delete(id)
        count++
      }
    }
    return count
  }

  private ensureEnabled(): void {
    if (!featureFlagManager.isEnabled('pb7.enterprise')) {
      throw new Error('Enterprise Integration is not enabled. Enable pb7.enterprise feature flag.')
    }
  }
}

export const identityRegistry = new IdentityRegistry()
