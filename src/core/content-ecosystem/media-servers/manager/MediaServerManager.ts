// media-servers/manager/MediaServerManager.ts — CE6.6
// Multi-server coordination: register, connect, sync, search across all servers

import type { IMediaServer, MediaItem, ServerPlaybackProgress } from '@provider-contracts'
import type { SyncResult } from '../contracts/sync.types'
import { WatchSyncEngine } from '../sync/WatchSyncEngine'
import { LibrarySyncEngine } from '../sync/LibrarySyncEngine'
import { JellyfinServer } from '../jellyfin/JellyfinServer'
import { EmbyServer } from '../emby/EmbyServer'
import { PlexServer } from '../plex/PlexServer'

export class MediaServerManager {
  private servers = new Map<string, IMediaServer>()
  private watchSync = new WatchSyncEngine()
  private librarySync = new LibrarySyncEngine()
  private subscribers = new Set<() => void>()

  // ─── Factory ───
  createServer(type: 'jellyfin' | 'emby' | 'plex', config: { id: string; name: string; url: string }): IMediaServer {
    switch (type) {
      case 'jellyfin': return new JellyfinServer(config)
      case 'emby': return new EmbyServer(config)
      case 'plex': return new PlexServer(config)
    }
  }

  // ─── Registration ───
  registerServer(server: IMediaServer): void {
    this.servers.set(server.id, server)
    this._notify()
  }

  unregisterServer(id: string): boolean {
    const server = this.servers.get(id)
    if (server) server.disconnect()
    const result = this.servers.delete(id)
    if (result) this._notify()
    return result
  }

  getServer(id: string): IMediaServer | undefined { return this.servers.get(id) }
  getServers(): IMediaServer[] { return Array.from(this.servers.values()) }
  getConnectedServers(): IMediaServer[] { return this.getServers().filter(s => s.isConnected()) }

  // ─── Search ───
  async searchAll(keyword: string): Promise<MediaItem[]> {
    const results = await Promise.allSettled(
      this.getConnectedServers().map(s => s.search(keyword))
    )
    return results
      .filter((r): r is PromiseFulfilledResult<MediaItem[]> => r.status === 'fulfilled')
      .flatMap(r => r.value)
  }

  // ─── Sync ───
  async syncWatchProgress(serverId: string, localProgress: ServerPlaybackProgress[]): Promise<SyncResult> {
    const server = this.servers.get(serverId)
    if (!server) throw new Error(`Server ${serverId} not registered`)
    return this.watchSync.sync(server, localProgress)
  }

  async syncLibrary(serverId: string): Promise<{ items: MediaItem[]; result: SyncResult }> {
    const server = this.servers.get(serverId)
    if (!server) throw new Error(`Server ${serverId} not registered`)
    const { items, result } = await this.librarySync.syncServer(server)
    return { items, result }
  }

  // ─── Subscribers ───
  subscribe(cb: () => void): () => void { this.subscribers.add(cb); return () => this.subscribers.delete(cb) }
  private _notify(): void { for (const cb of this.subscribers) cb() }
}
