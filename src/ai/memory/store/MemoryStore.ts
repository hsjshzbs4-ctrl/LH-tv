// src/ai/memory/store/MemoryStore.ts — 统一 Memory Store
// PB6 Governance: 受 MemoryRetentionPolicy 约束
// 禁止存储 full prompt/response → 只存 summary/preference/snapshot

import { storageService } from '@/shared/storage/storage.service'
import {
  memoryRetentionPolicy,
  MemoryEntryType,
  type MemoryEntry,
  MEMORY_STORE_LIMITS,
} from '../../governance/MemoryRetentionPolicy'

const MEMORY_STORAGE_KEY = 'pb6_ai_memory'

export class MemoryStore {
  private entries = new Map<string, MemoryEntry>()
  private totalSize = 0
  private initialized = false

  /** 从持久化加载 */
  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      const settings = await storageService.getSettings()
      const raw = settings[MEMORY_STORAGE_KEY]
      if (raw && typeof raw === 'string') {
        const persisted = JSON.parse(raw) as MemoryEntry[]
        for (const entry of persisted) {
          if (!memoryRetentionPolicy.isExpired(entry)) {
            this.entries.set(entry.id, entry)
            this.totalSize += new Blob([entry.content]).size
          }
        }
      }
    } catch {
      // 无数据
    }

    this.initialized = true
  }

  /** 存储记忆条目 (必须通过 RetentionPolicy 验证) */
  async store(
    type: MemoryEntryType,
    content: string,
    metadata?: Record<string, unknown>,
  ): Promise<string> {
    // Governance 检查
    if (!memoryRetentionPolicy.isAllowed(type)) {
      throw new Error(`Memory type "${type}" is forbidden by MemoryRetentionPolicy`)
    }

    const maxSize = memoryRetentionPolicy.getMaxSize(type)
    const contentSize = new Blob([content]).size
    if (maxSize > 0 && contentSize > maxSize) {
      throw new Error(`Content too large (${contentSize} bytes, max ${maxSize} for ${type})`)
    }

    // 存储限额检查
    if (this.totalSize + contentSize > MEMORY_STORE_LIMITS.MAX_TOTAL_SIZE_BYTES) {
      await this.pruneExpired() // 尝试清理
      if (this.totalSize + contentSize > MEMORY_STORE_LIMITS.MAX_TOTAL_SIZE_BYTES) {
        throw new Error('MemoryStore total size limit reached (10MB)')
      }
    }

    const ttl = memoryRetentionPolicy.getTTL(type)
    const entry: MemoryEntry = {
      id: `mem_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      type,
      content,
      createdAt: Date.now(),
      expiresAt: ttl > 0 ? Date.now() + ttl : 0,
      metadata,
    }

    this.entries.set(entry.id, entry)
    this.totalSize += contentSize

    // 条数限制
    this.enforceEntryLimit(type)

    await this.persist()
    return entry.id
  }

  /** 查询记忆 (按类型) */
  query(type?: MemoryEntryType): MemoryEntry[] {
    let result = Array.from(this.entries.values())

    if (type) {
      result = result.filter((e) => e.type === type)
    }

    // 过滤过期
    result = result.filter((e) => !memoryRetentionPolicy.isExpired(e))

    return result.sort((a, b) => b.createdAt - a.createdAt)
  }

  /** 删除记忆 */
  async delete(id: string): Promise<boolean> {
    const entry = this.entries.get(id)
    if (!entry) return false

    this.totalSize -= new Blob([entry.content]).size
    this.entries.delete(id)
    await this.persist()
    return true
  }

  /** 清理过期条目 */
  async pruneExpired(): Promise<number> {
    let count = 0
    for (const [id, entry] of this.entries) {
      if (memoryRetentionPolicy.isExpired(entry)) {
        this.totalSize -= new Blob([entry.content]).size
        this.entries.delete(id)
        count++
      }
    }
    if (count > 0) await this.persist()
    return count
  }

  /** 导出所有记忆 (用户数据可携带) */
  async export(): Promise<MemoryEntry[]> {
    await this.pruneExpired()
    return Array.from(this.entries.values())
  }

  /** 清空所有记忆 */
  async clear(): Promise<void> {
    this.entries.clear()
    this.totalSize = 0
    await this.persist()
  }

  /** 总大小 */
  get size(): number {
    return this.totalSize
  }

  // ── 内部 ──

  private enforceEntryLimit(type: MemoryEntryType): void {
    const ofType = Array.from(this.entries.values())
      .filter((e) => e.type === type)
      .sort((a, b) => a.createdAt - b.createdAt) // oldest first

    while (ofType.length > MEMORY_STORE_LIMITS.MAX_ENTRIES_PER_TYPE) {
      const oldest = ofType.shift()!
      this.totalSize -= new Blob([oldest.content]).size
      this.entries.delete(oldest.id)
    }
  }

  private async persist(): Promise<void> {
    const arr = Array.from(this.entries.values())
    await storageService.setSettings({ [MEMORY_STORAGE_KEY]: JSON.stringify(arr) })
  }
}

export const memoryStore = new MemoryStore()
