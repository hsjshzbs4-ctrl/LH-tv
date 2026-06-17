// src/platform/cloud/manager/SyncQueue.ts — 同步队列
// FIFO + 指数退避 (1s-8s, max 5 retries)
// 持久化到 storageService，确保重启后恢复

import type { SyncQueueEntry, SyncRecord } from '../types/cloud.types'
import { SyncOperation } from '../types/cloud.types'
import { storageService } from '@/shared/storage/storage.service'

const QUEUE_KEY = 'pb5_sync_queue'
const MAX_RETRIES = 5
const BASE_DELAY_MS = 1000
const MAX_DELAY_MS = 8000

export class SyncQueue {
  private entries: SyncQueueEntry[] = []

  /** 从持久化加载队列 */
  async load(): Promise<void> {
    try {
      const settings = await storageService.getSettings()
      const raw = settings[QUEUE_KEY]
      if (raw && typeof raw === 'string') {
        this.entries = JSON.parse(raw) as SyncQueueEntry[]
      }
    } catch {
      this.entries = []
    }
  }

  /** 入队 */
  async enqueue(record: SyncRecord, operation: SyncOperation): Promise<string> {
    const entry: SyncQueueEntry = {
      id: `sq_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      record,
      operation,
      retries: 0,
      lastAttempt: 0,
    }
    this.entries.push(entry)
    await this.persist()
    return entry.id
  }

  /** 出队 (获取下一个待处理条目) */
  dequeue(): SyncQueueEntry | null {
    if (this.entries.length === 0) return null
    return this.entries[0]
  }

  /** 标记当前条目完成 */
  async complete(entryId: string): Promise<void> {
    this.entries = this.entries.filter((e) => e.id !== entryId)
    await this.persist()
  }

  /** 标记失败并计算下次重试时间 */
  async markFailed(entryId: string): Promise<{ shouldRetry: boolean; delayMs: number } | null> {
    const entry = this.entries.find((e) => e.id === entryId)
    if (!entry) return null

    entry.retries++
    entry.lastAttempt = Date.now()

    if (entry.retries > MAX_RETRIES) {
      // 超过最大重试次数，移出队列
      this.entries = this.entries.filter((e) => e.id !== entryId)
      await this.persist()
      return { shouldRetry: false, delayMs: 0 }
    }

    // 指数退避: 1s, 2s, 4s, 8s (capped at MAX_DELAY_MS)
    const delayMs = Math.min(BASE_DELAY_MS * Math.pow(2, entry.retries - 1), MAX_DELAY_MS)
    await this.persist()
    return { shouldRetry: true, delayMs }
  }

  /** 队列大小 */
  get size(): number {
    return this.entries.length
  }

  /** 清空队列 */
  async clear(): Promise<void> {
    this.entries = []
    await this.persist()
  }

  private async persist(): Promise<void> {
    await storageService.setSettings({ [QUEUE_KEY]: JSON.stringify(this.entries) })
  }
}
