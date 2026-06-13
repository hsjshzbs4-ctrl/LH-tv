// media-servers/sync/WatchSyncEngine.ts — CE6.4
// Bidirectional watch progress sync: LH-TV ↔ media servers

import type { IMediaServer, ServerPlaybackProgress } from '@provider-contracts'
import type { SyncResult, SyncConflict } from '../contracts/sync.types'

export class WatchSyncEngine {
  async sync(
    server: IMediaServer,
    localProgress: ServerPlaybackProgress[]
  ): Promise<SyncResult> {
    const startedAt = Date.now()
    let itemsProcessed = 0
    let itemsUpdated = 0
    let itemsFailed = 0

    try {
      // 1. Pull progress from server
      const serverProgress = await server.getWatchProgress()

      // 2. Merge: local→server (push)
      for (const local of localProgress) {
        try {
          await server.updateWatchProgress(
            local.itemId, local.currentTime, local.duration, local.completed
          )
          itemsUpdated++
        } catch {
          itemsFailed++
        }
        itemsProcessed++
      }

      // 3. Merge: server→local (pull) — return for caller to handle
      for (const remote of serverProgress) {
        const local = localProgress.find(l => l.mediaId === remote.mediaId)
        if (!local || remote.progress > local.progress) {
          // Server has newer progress — caller should update local
          itemsProcessed++
        }
      }
    } catch (e: any) {
      return {
        serverId: server.id, direction: 'bidirectional',
        itemsProcessed, itemsUpdated, itemsFailed,
        startedAt, completedAt: Date.now(), error: e.message,
      }
    }

    return {
      serverId: server.id, direction: 'bidirectional',
      itemsProcessed, itemsUpdated, itemsFailed,
      startedAt, completedAt: Date.now(),
    }
  }

  // ─── Conflict Resolution ───
  resolveConflict(serverTime: number, localTime: number): 'keep-server' | 'keep-local' {
    return serverTime > localTime ? 'keep-server' : 'keep-local'
  }

  resolveConflicts(conflicts: SyncConflict[]): SyncConflict[] {
    return conflicts.map(c => ({
      ...c,
      resolution: this.resolveConflict(c.serverProgress, c.localProgress),
    }))
  }
}
