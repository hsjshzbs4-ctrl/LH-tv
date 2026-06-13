// media-servers/manager/MediaServerFacade.ts — CE6.6
// View-layer singleton facade for media server operations

import { MediaServerManager } from './MediaServerManager'
import type { IMediaServer, MediaItem, ServerPlaybackProgress, ServerCredentials } from '@provider-contracts'
import type { SyncResult } from '../contracts/sync.types'

export class MediaServerFacade {
  private manager = new MediaServerManager()

  // ─── Server Management ───
  createAndRegister(type: 'jellyfin' | 'emby' | 'plex', config: { id: string; name: string; url: string }): IMediaServer {
    const server = this.manager.createServer(type, config)
    this.manager.registerServer(server)
    return server
  }

  async connectServer(serverId: string, url: string, credentials: ServerCredentials): Promise<boolean> {
    const server = this.manager.getServer(serverId)
    if (!server) throw new Error(`Server ${serverId} not found`)
    return server.connect(url, credentials)
  }

  disconnectServer(serverId: string): void {
    this.manager.unregisterServer(serverId)
  }

  getServers(): IMediaServer[] { return this.manager.getServers() }
  getConnectedServers(): IMediaServer[] { return this.manager.getConnectedServers() }

  // ─── Search ───
  async searchAll(keyword: string): Promise<MediaItem[]> {
    return this.manager.searchAll(keyword)
  }

  // ─── Sync ───
  async syncWatchProgress(serverId: string, localProgress: ServerPlaybackProgress[]): Promise<SyncResult> {
    return this.manager.syncWatchProgress(serverId, localProgress)
  }

  async syncLibrary(serverId: string): Promise<{ items: MediaItem[]; result: SyncResult }> {
    return this.manager.syncLibrary(serverId)
  }

  // ─── Subscribe ───
  subscribe(cb: () => void): () => void { return this.manager.subscribe(cb) }
}

export const mediaServerFacade = new MediaServerFacade()
