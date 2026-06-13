// provider-contracts/interfaces/IMediaServer.ts — Content Ecosystem CE1
// Media server integration interface (Jellyfin, Emby, Plex)

import type { MediaItem, MediaDetail } from '../types/media.types'
import type { MediaServerLibrary } from '../types/metadata.types'

export interface IMediaServer {
  // ─── Identity ───
  readonly id: string
  readonly name: string
  readonly serverType: 'jellyfin' | 'emby' | 'plex'
  enabled: boolean

  // ─── Connection ───
  connect(url: string, credentials: ServerCredentials): Promise<boolean>
  disconnect(): void
  isConnected(): boolean

  // ─── Libraries ───
  getLibraries(): Promise<MediaServerLibrary[]>
  getLibraryContents(libraryId: string, options?: LibraryQueryOptions): Promise<MediaItem[]>

  // ─── Search ───
  search(keyword: string): Promise<MediaItem[]>

  // ─── Detail ───
  getDetail(id: string): Promise<MediaDetail>

  // ─── Playback ───
  getPlaybackUrl(id: string): Promise<string>

  // ─── Watch Progress Sync (bidirectional) ───
  getWatchProgress(): Promise<ServerPlaybackProgress[]>
  updateWatchProgress(
    itemId: string,
    currentTime: number,
    duration: number,
    completed: boolean
  ): Promise<void>

  // ─── Health ───
  healthCheck(): Promise<boolean>
}

export interface ServerCredentials {
  username?: string
  password?: string
  token?: string
}

export interface LibraryQueryOptions {
  startIndex?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface ServerPlaybackProgress {
  itemId: string
  mediaId: string
  title: string
  currentTime: number
  duration: number
  progress: number           // 0-1
  completed: boolean
  lastUpdatedAt: number
}
