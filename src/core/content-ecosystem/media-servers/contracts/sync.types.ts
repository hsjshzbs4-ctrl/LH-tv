// media-servers/contracts/sync.types.ts — CE6.1
// Sync types: watch progress, library sync, scheduling

export type SyncDirection = 'pull' | 'push' | 'bidirectional'
export type SyncInterval = 'startup' | 'manual' | '5min' | '15min' | '1h'

export interface SyncConfig {
  enabled: boolean
  direction: SyncDirection
  interval: SyncInterval
  autoSync: boolean
}

export interface SyncResult {
  serverId: string
  direction: SyncDirection
  itemsProcessed: number
  itemsUpdated: number
  itemsFailed: number
  startedAt: number
  completedAt: number
  error?: string
}

export interface WatchSyncItem {
  itemId: string
  serverId: string
  position: number
  duration: number
  progress: number      // 0-1
  completed: boolean
  lastPlayedAt: number
  serverUpdatedAt: number
  localUpdatedAt: number
}

export interface SyncConflict {
  itemId: string
  serverProgress: number
  localProgress: number
  resolution: 'keep-server' | 'keep-local' | 'merge-highest'
}

export interface LibrarySyncDelta {
  serverId: string
  added: number
  removed: number
  updated: number
  items: string[]       // item IDs that changed
}
