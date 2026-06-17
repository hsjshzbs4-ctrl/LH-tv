// src/ai/memory/lifecycle/MemoryLifecycle.ts — Memory 生命周期管理
// 统一删除策略、导出策略、TTL 管理

import { memoryStore } from '../store/MemoryStore'
import { MemoryEntryType, memoryRetentionPolicy, MEMORY_STORE_LIMITS } from '../../governance/MemoryRetentionPolicy'

export class MemoryLifecycle {
  private pruneTimer: ReturnType<typeof setInterval> | null = null

  /** 启动自动清理 (定期执行) */
  startAutoPrune(): void {
    if (this.pruneTimer) return
    this.pruneTimer = setInterval(
      () => memoryStore.pruneExpired(),
      MEMORY_STORE_LIMITS.PRUNE_INTERVAL_MS,
    )
  }

  /** 停止自动清理 */
  stopAutoPrune(): void {
    if (this.pruneTimer) {
      clearInterval(this.pruneTimer)
      this.pruneTimer = null
    }
  }

  /** 删除用户所有数据 (GDPR/隐私合规) */
  async deleteAllUserData(): Promise<void> {
    await memoryStore.clear()
  }

  /** 导出用户数据 (数据可携带) */
  async exportUserData(): Promise<string> {
    const entries = await memoryStore.export()
    return JSON.stringify(entries, null, 2)
  }

  /** 获取存储统计 */
  async getStats(): Promise<{
    totalEntries: number
    totalSizeBytes: number
    maxSizeBytes: number
    byType: Record<string, number>
  }> {
    const all = memoryStore.query()
    const byType: Record<string, number> = {}
    for (const e of all) {
      byType[e.type] = (byType[e.type] ?? 0) + 1
    }

    return {
      totalEntries: all.length,
      totalSizeBytes: memoryStore.size,
      maxSizeBytes: MEMORY_STORE_LIMITS.MAX_TOTAL_SIZE_BYTES,
      byType,
    }
  }
}

export const memoryLifecycle = new MemoryLifecycle()
