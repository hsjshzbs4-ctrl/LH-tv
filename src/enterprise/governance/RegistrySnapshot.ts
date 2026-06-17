// src/enterprise/governance/RegistrySnapshot.ts — 跨注册表快照服务
// PB7-S5.1: 统一所有 Registry 的备份/恢复/校验
// 通过 export() API 工作 — 对 Frozen Registry (Marketplace/Community) 只读访问

import { featureFlagManager } from '@platform/flags'
import { identityRegistry } from '../identity'
import { organizationRegistry } from '../organization'
import { communityRegistry } from '@community/index'
import { marketplaceRegistry } from '@ecosystem/index'
import type { RegistrySnapshot } from '../contracts'
import type { IdentityProviderEntry } from '../contracts'

/** 全系统快照 */
export interface SystemSnapshot {
  timestamp: number
  version: number
  checksum: string
  registries: {
    identity: RegistrySnapshot<IdentityProviderEntry[]>
    organization: RegistrySnapshot<ReturnType<typeof organizationRegistry.export>>
    community: RegistrySnapshot<ReturnType<typeof communityRegistry.listAll>>
    marketplace: RegistrySnapshot<ReturnType<typeof marketplaceRegistry.listAll>>
  }
}

export class RegistrySnapshotService {
  /** 创建全系统快照 (包含所有 4 个 Registry) */
  static capture(): SystemSnapshot {
    this.ensureEnabled()

    const idSnap = identityRegistry.snapshot()
    const orgSnap = organizationRegistry.snapshot()
    const commSnap = RegistrySnapshotService.createSnapshot(
      'CommunityRegistry',
      communityRegistry.listAll(),
    )
    const marketSnap = RegistrySnapshotService.createSnapshot(
      'MarketplaceRegistry',
      marketplaceRegistry.listAll(),
    )

    const registries = {
      identity: idSnap,
      organization: orgSnap,
      community: commSnap,
      marketplace: marketSnap,
    }

    const checksum = RegistrySnapshotService.computeGlobalChecksum(registries)

    return {
      timestamp: Date.now(),
      version: 1,
      checksum,
      registries,
    }
  }

  /** 恢复可写 Registry (Identity + Organization) */
  static restoreWritable(snapshot: SystemSnapshot): { success: boolean; errors: string[] } {
    this.ensureEnabled()
    const errors: string[] = []

    const idResult = identityRegistry.restore(snapshot.registries.identity)
    if (!idResult.success) errors.push(`IdentityRegistry: ${idResult.error}`)

    const orgResult = organizationRegistry.restore(snapshot.registries.organization)
    if (!orgResult.success) errors.push(`OrganizationRegistry: ${orgResult.error}`)

    return { success: errors.length === 0, errors }
  }

  /** 验证全系统快照完整性 */
  static verify(snapshot: SystemSnapshot): { valid: boolean; mismatches: string[] } {
    const expectedChecksum = RegistrySnapshotService.computeGlobalChecksum(snapshot.registries)
    const mismatches: string[] = []

    if (snapshot.checksum !== expectedChecksum) {
      mismatches.push('Global checksum mismatch')
    }
    if (snapshot.registries.identity.checksum !== identityRegistry.checksum()) {
      mismatches.push('IdentityRegistry checksum mismatch')
    }
    if (snapshot.registries.organization.checksum !== organizationRegistry.checksum()) {
      mismatches.push('OrganizationRegistry checksum mismatch')
    }

    return { valid: mismatches.length === 0, mismatches }
  }

  /** 为任意 Registry 创建快照 (通过 export/listAll API — 兼容 Frozen Registry) */
  static createSnapshot<T>(registry: string, data: T): RegistrySnapshot<T> {
    return {
      registry,
      version: 1,
      timestamp: Date.now(),
      checksum: RegistrySnapshotService.computeChecksum(JSON.stringify(data)),
      data,
    }
  }

  /** 计算全局校验和 */
  private static computeGlobalChecksum(registries: SystemSnapshot['registries']): string {
    const combined = [
      registries.identity.checksum,
      registries.organization.checksum,
      registries.community.checksum,
      registries.marketplace.checksum,
    ].join(':')
    return RegistrySnapshotService.computeChecksum(combined)
  }

  static computeChecksum(data: string): string {
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i)
      hash = ((hash << 5) - hash + char) | 0
    }
    return (hash >>> 0).toString(16).padStart(8, '0')
  }

  private static ensureEnabled(): void {
    if (!featureFlagManager.isEnabled('pb7.enterprise')) {
      throw new Error('Enterprise Integration is not enabled. Enable pb7.enterprise feature flag.')
    }
  }
}
