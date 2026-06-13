// media-servers/base/BaseMediaServer.ts — CE6.2
// Abstract base for Jellyfin, Emby, Plex servers

import type { IMediaServer, MediaItem, MediaDetail, ServerCredentials, ServerPlaybackProgress, MediaServerLibrary } from '@provider-contracts'
import type { ServerConfig, ServerType, ServerWatchProgress } from '../contracts/media-server.types'
import type { AuthResult, AuthState } from '../contracts/auth.types'
import { HttpClient } from './HttpClient'

export abstract class BaseMediaServer implements IMediaServer {
  abstract readonly id: string
  abstract readonly name: string
  abstract readonly serverType: ServerType
  enabled = true

  protected config: ServerConfig
  protected http: HttpClient | null = null
  protected auth: AuthState = { authenticated: false, lastAuthenticatedAt: 0 }

  constructor(config: ServerConfig) {
    this.config = config
    if (config.authToken) {
      this.http = new HttpClient({
        baseUrl: config.url,
        authToken: config.authToken,
        authHeader: this._getAuthHeader(),
      })
    }
  }

  // ─── Connection ───
  abstract connect(url: string, credentials: ServerCredentials): Promise<boolean>
  disconnect(): void {
    this.auth = { authenticated: false, lastAuthenticatedAt: Date.now() }
    this.config.connected = false
  }
  isConnected(): boolean { return this.config.connected && this.auth.authenticated }

  // ─── Libraries ───
  abstract getLibraries(): Promise<MediaServerLibrary[]>
  abstract getLibraryContents(libraryId: string, options?: { startIndex?: number; limit?: number }): Promise<MediaItem[]>

  // ─── Search ───
  abstract search(keyword: string): Promise<MediaItem[]>

  // ─── Detail ───
  abstract getDetail(id: string): Promise<MediaDetail>

  // ─── Playback ───
  abstract getPlaybackUrl(id: string): Promise<string>

  // ─── Watch Progress ───
  abstract getWatchProgress(): Promise<ServerPlaybackProgress[]>
  abstract updateWatchProgress(itemId: string, currentTime: number, duration: number, completed: boolean): Promise<void>

  // ─── Health ───
  async healthCheck(): Promise<boolean> {
    try {
      await this.getLibraries()
      return true
    } catch { return false }
  }

  // ─── Protected Helpers ───
  protected abstract _getAuthHeader(): string
  protected abstract _authenticate(credentials: ServerCredentials): Promise<AuthResult>

  protected _ensureHttp(): HttpClient {
    if (!this.http) throw new Error(`${this.serverType} server not connected`)
    return this.http
  }

  protected _setConnected(token: string, userId?: string): void {
    this.config.authToken = token
    this.config.userId = userId
    this.config.connected = true
    this.config.lastConnectedAt = Date.now()
    this.auth = { authenticated: true, token, userId, lastAuthenticatedAt: Date.now() }
    this.http = new HttpClient({
      baseUrl: this.config.url,
      authToken: token,
      authHeader: this._getAuthHeader(),
    })
  }

  // ─── Progress Conversion ───
  protected _toServerProgress(raw: ServerWatchProgress): ServerPlaybackProgress {
    return {
      itemId: raw.itemId,
      mediaId: raw.itemId,
      title: '',
      currentTime: raw.position * 10000, // ticks → ms
      duration: raw.duration * 10000,
      progress: raw.completed ? 1 : raw.duration > 0 ? raw.position / raw.duration : 0,
      completed: raw.completed,
      lastUpdatedAt: raw.lastPlayedAt || Date.now(),
    }
  }
}
