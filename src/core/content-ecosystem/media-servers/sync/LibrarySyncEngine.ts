// media-servers/sync/LibrarySyncEngine.ts — CE6.3
// Sync server library contents into local repository

import type { IMediaServer, MediaItem } from '@provider-contracts'
import type { SyncResult, LibrarySyncDelta } from '../contracts/sync.types'

export class LibrarySyncEngine {
  async syncServer(
    server: IMediaServer,
  ): Promise<{ items: MediaItem[]; delta: LibrarySyncDelta; result: SyncResult }> {
    const startedAt = Date.now()
    const items: MediaItem[] = []
    const delta: LibrarySyncDelta = { serverId: server.id, added: 0, removed: 0, updated: 0, items: [] }

    try {
      const libraries = await server.getLibraries()
      const mediaLibs = libraries.filter(l => l.type === 'movies' || l.type === 'tvshows' || l.type === 'mixed')

      for (const lib of mediaLibs) {
        let page = 0
        const pageSize = 100
        let hasMore = true

        while (hasMore) {
          const contents = await server.getLibraryContents(lib.id, {
            startIndex: page * pageSize,
            limit: pageSize,
          })
          items.push(...contents)
          page++
          hasMore = contents.length === pageSize
        }
      }

      delta.added = items.length
      delta.items = items.map(i => i.id)

      return {
        items,
        delta,
        result: {
          serverId: server.id, direction: 'pull',
          itemsProcessed: items.length, itemsUpdated: items.length, itemsFailed: 0,
          startedAt, completedAt: Date.now(),
        },
      }
    } catch (e: any) {
      return {
        items: [],
        delta,
        result: {
          serverId: server.id, direction: 'pull',
          itemsProcessed: 0, itemsUpdated: 0, itemsFailed: 1,
          startedAt, completedAt: Date.now(), error: e.message,
        },
      }
    }
  }
}
