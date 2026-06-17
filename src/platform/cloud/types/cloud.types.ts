// src/platform/cloud/types/cloud.types.ts — S5-2 Cloud Sync 核心类型
// PB5 Auth v2: Default OFF, Local Only Mode

/** 可同步数据类型 */
export enum SyncableType {
  HISTORY = 'history',
  RESUME = 'resume',
  FAVORITES = 'favorites',
  SUBTITLES = 'subtitles',
  QUALITY = 'quality',
}

/** 同步记录 */
export interface SyncRecord<T = unknown> {
  id: string
  type: SyncableType
  data: T
  updatedAt: number
  deviceId: string
  version: number
}

/** 同步操作 */
export enum SyncOperation {
  PUSH = 'push',
  PULL = 'pull',
  MERGE = 'merge',
}

/** 同步状态 */
export enum SyncStatus {
  IDLE = 'idle',
  SYNCING = 'syncing',
  ERROR = 'error',
  CONFLICT = 'conflict',
  OFFLINE = 'offline',
}

/** 同步冲突 */
export interface SyncConflict<T = unknown> {
  local: SyncRecord<T>
  remote: SyncRecord<T>
  type: SyncableType
}

/** 冲突解决策略 */
export enum ConflictStrategy {
  LAST_WRITE_WINS = 'last_write_wins',
  MERGE = 'merge',
  KEEP_LOCAL = 'keep_local',
  KEEP_REMOTE = 'keep_remote',
}

/** 同步处理器接口 */
export interface ISyncHandler<T = unknown> {
  readonly type: SyncableType
  readonly conflictStrategy: ConflictStrategy

  /** 序列化本地数据为同步记录 */
  serialize(): Promise<SyncRecord<T>[]>
  /** 反序列化远程记录为本地数据 */
  deserialize(records: SyncRecord<T>[]): Promise<void>
  /** 检测冲突 */
  detectConflicts(local: SyncRecord<T>, remote: SyncRecord<T>): boolean
  /** 合并冲突 */
  merge(local: SyncRecord<T>, remote: SyncRecord<T>): SyncRecord<T>
}

/** 云服务提供者接口 */
export interface ICloudProvider {
  readonly name: string
  readonly configured: boolean

  /** 推送到云端 */
  push<T>(records: SyncRecord<T>[]): Promise<boolean>
  /** 从云端拉取 */
  pull<T>(type: SyncableType, since: number): Promise<SyncRecord<T>[]>
  /** 检查连接 */
  isConnected(): Promise<boolean>
}

/** 同步队列条目 */
export interface SyncQueueEntry {
  id: string
  record: SyncRecord
  operation: SyncOperation
  retries: number
  lastAttempt: number
}

/** 同步事件 */
export interface CloudSyncEvent {
  type: CloudSyncEventTypeValue
  timestamp: number
  data?: Record<string, unknown>
}

export const CloudSyncEventType = {
  SYNC_STARTED: 'sync:started',
  SYNC_COMPLETED: 'sync:completed',
  SYNC_FAILED: 'sync:failed',
  CONFLICT_DETECTED: 'sync:conflict-detected',
  CONFLICT_RESOLVED: 'sync:conflict-resolved',
} as const

export type CloudSyncEventTypeValue =
  (typeof CloudSyncEventType)[keyof typeof CloudSyncEventType]
