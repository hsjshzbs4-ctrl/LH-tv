// src/platform/cloud/storage/SyncStorage.ts — 同步状态持久化
// 记录每种 SyncableType 的最后同步时间戳

import { storageService } from '@/shared/storage/storage.service'

const SYNC_STORAGE_KEY = 'pb5_sync_state'

interface SyncState {
  lastSyncTimestamps: Record<string, number>
  updatedAt: number
}

export class SyncStorage {
  private cache: SyncState | null = null

  async load(): Promise<SyncState> {
    if (this.cache) return this.cache

    try {
      const settings = await storageService.getSettings()
      const raw = settings[SYNC_STORAGE_KEY]
      if (raw && typeof raw === 'string') {
        this.cache = JSON.parse(raw) as SyncState
        return this.cache
      }
    } catch {
      // 无数据
    }

    this.cache = { lastSyncTimestamps: {}, updatedAt: Date.now() }
    return this.cache
  }

  async setLastSync(type: string, timestamp: number): Promise<void> {
    const state = await this.load()
    state.lastSyncTimestamps[type] = timestamp
    state.updatedAt = Date.now()
    await this.persist(state)
  }

  async getLastSync(type: string): Promise<number> {
    const state = await this.load()
    return state.lastSyncTimestamps[type] ?? 0
  }

  async clear(): Promise<void> {
    this.cache = { lastSyncTimestamps: {}, updatedAt: Date.now() }
    await this.persist(this.cache)
  }

  invalidateCache(): void {
    this.cache = null
  }

  private async persist(state: SyncState): Promise<void> {
    this.cache = state
    await storageService.setSettings({ [SYNC_STORAGE_KEY]: JSON.stringify(state) })
  }
}

export const syncStorage = new SyncStorage()
