// src/platform/flags/storage/FlagStorage.ts — FeatureFlag 持久化
// 通过现有 storageService 持久化 flag 覆盖和实验分配

import { storageService } from '@/shared/storage/storage.service'
import type { FlagOverride, ExperimentAssignment } from '../types/flag.types'

const STORAGE_KEY = 'pb5_feature_flags'

interface PersistedFlagData {
  overrides: FlagOverride[]
  assignments: ExperimentAssignment[]
  updatedAt: number
}

export class FlagStorage {
  private cache: PersistedFlagData | null = null

  /** 从 storageService 加载持久化数据 */
  async load(): Promise<PersistedFlagData> {
    if (this.cache) return this.cache

    try {
      const settings = await storageService.getSettings()
      const raw = settings[STORAGE_KEY]
      if (raw && typeof raw === 'string') {
        this.cache = JSON.parse(raw) as PersistedFlagData
      }
    } catch {
      // 首次加载，无数据
    }

    this.cache = this.cache ?? { overrides: [], assignments: [], updatedAt: Date.now() }
    return this.cache
  }

  /** 保存 flag 覆盖到持久化 */
  async saveOverrides(overrides: FlagOverride[]): Promise<void> {
    const data = await this.load()
    data.overrides = overrides
    data.updatedAt = Date.now()
    await this.persist(data)
  }

  /** 保存实验分配 */
  async saveAssignments(assignments: ExperimentAssignment[]): Promise<void> {
    const data = await this.load()
    data.assignments = assignments
    data.updatedAt = Date.now()
    await this.persist(data)
  }

  /** 清空内存缓存 (用于测试隔离，不持久化) */
  invalidateCache(): void {
    this.cache = null
  }

  /** 清空所有 PB5 flag 数据 (用于完全重置) */
  async clear(): Promise<void> {
    this.cache = { overrides: [], assignments: [], updatedAt: Date.now() }
    await this.persist(this.cache)
  }

  /** 写入底层存储 */
  private async persist(data: PersistedFlagData): Promise<void> {
    this.cache = data
    await storageService.setSettings({ [STORAGE_KEY]: JSON.stringify(data) })
  }
}

/** 默认导出单例 */
export const flagStorage = new FlagStorage()
