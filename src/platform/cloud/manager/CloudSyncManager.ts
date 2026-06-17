// src/platform/cloud/manager/CloudSyncManager.ts — 云端同步核心管理器
// SSOT: 同步引擎的唯一控制点
// PB5 Auth v2: Default OFF, Local Only Mode 为默认行为

import {
  SyncStatus,
  SyncOperation,
  ConflictStrategy,
  type SyncRecord,
  type SyncConflict,
  type ISyncHandler,
  type ICloudProvider,
  type CloudSyncEvent,
} from '../types/cloud.types'
import { CloudSyncEventType } from '../types/cloud.types'
import { SyncQueue } from './SyncQueue'
import { ConflictResolver } from './ConflictResolver'
import { LocalCloudProvider } from '../provider/LocalCloudProvider'
import { featureFlagManager, FeatureState } from '@platform/flags'

type SyncSubscriber = (event: CloudSyncEvent) => void

export class CloudSyncManager {
  /** 同步处理器注册表 (按 SyncableType) */
  private handlers = new Map<string, ISyncHandler>()
  /** 云服务提供者 */
  private cloudProvider: ICloudProvider
  /** 同步队列 */
  private queue = new SyncQueue()
  /** 冲突解决器 */
  private resolver = new ConflictResolver()
  /** 当前同步状态 */
  private status: SyncStatus = SyncStatus.IDLE
  /** 订阅者 */
  private subscribers = new Set<SyncSubscriber>()
  /** 是否已初始化 */
  private initialized = false
  /** 同步定时器 */
  private syncTimer: ReturnType<typeof setInterval> | null = null

  constructor(cloudProvider?: ICloudProvider) {
    this.cloudProvider = cloudProvider ?? new LocalCloudProvider()
  }

  // ── 初始化 ──

  async initialize(): Promise<void> {
    if (this.initialized) return

    // 功能门控
    if (!featureFlagManager.isEnabled('pb5.cloud')) {
      this.initialized = true
      return
    }

    // 加载队列
    await this.queue.load()

    this.initialized = true
  }

  // ── 处理器注册 ──

  /** 注册同步处理器 */
  registerHandler(handler: ISyncHandler): void {
    this.handlers.set(handler.type, handler)
  }

  /** 移除同步处理器 */
  unregisterHandler(type: string): void {
    this.handlers.delete(type)
  }

  // ── 同步操作 ──

  /** 启动定期同步 */
  startAutoSync(intervalMs: number = 5 * 60 * 1000): void {
    if (this.syncTimer) return
    this.syncTimer = setInterval(() => this.syncAll(), intervalMs)
  }

  /** 停止定期同步 */
  stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer)
      this.syncTimer = null
    }
  }

  /** 全量同步 */
  async syncAll(): Promise<void> {
    if (this.status === SyncStatus.SYNCING) return

    // Local Only Mode: no cloud provider configured
    if (!this.cloudProvider.configured) {
      this.setStatus(SyncStatus.OFFLINE)
      return
    }

    this.setStatus(SyncStatus.SYNCING)
    this.emit({ type: CloudSyncEventType.SYNC_STARTED, timestamp: Date.now() })

    try {
      for (const handler of this.handlers.values()) {
        await this.syncType(handler)
      }
      this.setStatus(SyncStatus.IDLE)
      this.emit({ type: CloudSyncEventType.SYNC_COMPLETED, timestamp: Date.now() })
    } catch (err) {
      this.setStatus(SyncStatus.ERROR)
      this.emit({
        type: CloudSyncEventType.SYNC_FAILED,
        timestamp: Date.now(),
        data: { error: String(err) },
      })
    }
  }

  /** 立即同步单个类型 */
  async syncNow(type: string): Promise<void> {
    const handler = this.handlers.get(type)
    if (!handler) throw new Error(`Unknown sync type: ${type}`)
    await this.syncType(handler)
  }

  /** 单个类型同步流程 */
  private async syncType(handler: ISyncHandler): Promise<void> {
    try {
      // 1. 推送本地变更
      const localRecords = await handler.serialize()
      if (localRecords.length > 0) {
        await this.cloudProvider.push(localRecords)
      }

      // 2. 拉取远程变更
      const lastSync = 0 // 由 storage 管理 lastSync timestamp
      const remoteRecords = await this.cloudProvider.pull(handler.type, lastSync)

      // 3. 冲突检测与解决
      for (const remote of remoteRecords) {
        const local = localRecords.find((r) => r.id === remote.id)
        if (local && handler.detectConflicts(local, remote)) {
          const conflict: SyncConflict = {
            local,
            remote,
            type: handler.type,
          }
          const resolved = this.resolver.resolve(conflict, handler.conflictStrategy)
          this.emit({
            type: CloudSyncEventType.CONFLICT_RESOLVED,
            timestamp: Date.now(),
            data: { type: handler.type, resolved: resolved.id },
          })
        }
      }

      // 4. 反序列化远程记录
      if (remoteRecords.length > 0) {
        if (localRecords.length > 0) {
          // 有本地记录: 合并后反序列化
          const merged = this.mergeRecords(localRecords, remoteRecords, handler.conflictStrategy)
          await handler.deserialize(merged)
        } else {
          await handler.deserialize(remoteRecords)
        }
      }
    } catch {
      // 单个类型失败不阻断其他类型
    }
  }

  /** 合并本地和远程记录 */
  private mergeRecords(
    local: SyncRecord[],
    remote: SyncRecord[],
    strategy: ConflictStrategy,
  ): SyncRecord[] {
    const result = [...remote]
    const remoteIds = new Set(remote.map((r) => r.id))

    for (const l of local) {
      if (!remoteIds.has(l.id)) {
        result.push(l)
      } else {
        // 存在冲突，用 LAST_WRITE_WINS 解决
        const r = remote.find((x) => x.id === l.id)!
        const resolved = this.resolver.resolve(
          { local: l, remote: r, type: r.type as never },
          strategy,
        )
        const idx = result.findIndex((x) => x.id === l.id)
        if (idx >= 0) result[idx] = resolved
      }
    }

    return result
  }

  // ── 状态查询 ──

  getSyncStatus(): SyncStatus {
    return this.status
  }

  getQueueSize(): number {
    return this.queue.size
  }

  // ── 内部 ──

  private setStatus(status: SyncStatus): void {
    this.status = status
  }

  private emit(event: CloudSyncEvent): void {
    for (const sub of this.subscribers) {
      try { sub(event) } catch { /* silent */ }
    }
  }

  subscribe(fn: SyncSubscriber): () => void {
    this.subscribers.add(fn)
    return () => this.subscribers.delete(fn)
  }
}

export const cloudSyncManager = new CloudSyncManager()
