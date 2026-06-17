// src/platform/cloud/index.ts — S5-2 Cloud Sync Framework 统一导出

// Types
export {
  SyncableType,
  SyncOperation,
  SyncStatus,
  ConflictStrategy,
  type SyncRecord,
  type SyncConflict,
  type ISyncHandler,
  type ICloudProvider,
  type SyncQueueEntry,
  type CloudSyncEvent,
  type CloudSyncEventTypeValue,
  CloudSyncEventType,
} from './types/cloud.types'

// Manager
export { CloudSyncManager, cloudSyncManager } from './manager/CloudSyncManager'
export { SyncQueue } from './manager/SyncQueue'
export { ConflictResolver } from './manager/ConflictResolver'

// Provider
export { LocalCloudProvider } from './provider/LocalCloudProvider'
export type { ICloudProvider as CloudProviderInterface } from './provider/CloudProvider'

// Storage
export { SyncStorage, syncStorage } from './storage/SyncStorage'
