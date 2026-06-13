// media-servers/plex/PlexServer.ts — CE6.5
// Plex media server integration — X-Plex-Token, /library/sections, XML API

import { BaseMediaServer } from '../base/BaseMediaServer'
import { HttpClient } from '../base/HttpClient'
import type {
  MediaItem, MediaDetail,
  ServerCredentials, ServerPlaybackProgress, MediaServerLibrary,
} from '@provider-contracts'
import type { ServerType } from '../contracts/media-server.types'
import type { AuthResult } from '../contracts/auth.types'

export class PlexServer extends BaseMediaServer {
  readonly id: string
  readonly name: string
  readonly serverType: ServerType = 'plex'

  constructor(config: { id: string; name: string; url: string }) {
    super({ id: config.id, name: config.name, url: config.url, serverType: 'plex', connected: false })
    this.id = config.id
    this.name = config.name
  }

  // ─── Authentication ───
  async connect(url: string, credentials: ServerCredentials): Promise<boolean> {
    this.config.url = url
    const result = await this._authenticate(credentials)
    if (result.success && result.token) {
      this._setConnected(result.token, result.userId)
      return true
    }
    return false
  }

  protected _getAuthHeader(): string { return 'X-Plex-Token' }

  protected async _authenticate(creds: ServerCredentials): Promise<AuthResult> {
    try {
      if (creds.token) {
        // Test existing token
        const http = new HttpClient({ baseUrl: this.config.url, authToken: creds.token, authHeader: 'X-Plex-Token' })
        const data = await http.get<{ MyPlex?: { authToken?: string; username?: string } }>('/')
        return {
          success: true,
          token: creds.token,
          userId: data.MyPlex?.username || 'plex-user',
          serverName: 'Plex Server',
        }
      }

      // Plex uses PIN-based or direct token auth
      // For simplicity, assume token is provided via credentials
      if (creds.username && creds.password) {
        const http = new HttpClient({ baseUrl: 'https://plex.tv' })
        const result = await http.post<{ user?: { authToken: string; id: string } }>(
          '/users/sign_in.json',
          { login: creds.username, password: creds.password },
        )
        if (result.user?.authToken) {
          return { success: true, token: result.user.authToken, userId: result.user.id, serverName: 'Plex' }
        }
      }

      return { success: false, error: 'Plex requires a token or username/password' }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  }

  // ─── Libraries ───
  async getLibraries(): Promise<MediaServerLibrary[]> {
    const http = this._ensureHttp()
    const data = await http.get<{ MediaContainer?: { Directory?: any[] } }>('/library/sections')
    return (data.MediaContainer?.Directory || []).map((d: any) => ({
      id: d.key, serverId: this.id, name: d.title,
      type: this._mapPlexType(d.type),
      itemCount: d.refreshed ? -1 : 0, // Plex doesn't always expose count
    }))
  }

  async getLibraryContents(libraryId: string, options?: { startIndex?: number; limit?: number }): Promise<MediaItem[]> {
    const http = this._ensureHttp()
    const start = options?.startIndex || 0
    const limit = options?.limit || 50
    const data = await http.get<{ MediaContainer?: { Metadata?: any[] } }>(
      `/library/sections/${libraryId}/all`,
      { 'X-Plex-Container-Start': String(start), 'X-Plex-Container-Size': String(limit) },
    )
    return (data.MediaContainer?.Metadata || []).map((m: any) => this._mapItem(m))
  }

  // ─── Search ───
  async search(keyword: string): Promise<MediaItem[]> {
    const http = this._ensureHttp()
    const data = await http.get<{ MediaContainer?: { Metadata?: any[] } }>(
      '/search',
      { query: keyword },
    )
    return (data.MediaContainer?.Metadata || []).map((m: any) => this._mapItem(m))
  }

  // ─── Detail ───
  async getDetail(id: string): Promise<MediaDetail> {
    const http = this._ensureHttp()
    const data = await http.get<{ MediaContainer?: { Metadata?: any[] } }>(`/library/metadata/${id}`)
    const item = data.MediaContainer?.Metadata?.[0]
    if (!item) throw new Error('Item not found')
    return {
      id: item.ratingKey || id,
      title: item.title || '',
      cover: item.thumb ? `${this.config.url}${item.thumb}` : '',
      description: item.summary || '',
      providerId: this.id,
      episodes: [],
    }
  }

  // ─── Playback ───
  async getPlaybackUrl(id: string): Promise<string> {
    const base = this.config.url.replace(/\/$/, '')
    const token = this.config.authToken || ''
    return `${base}/library/metadata/${id}?X-Plex-Token=${token}`
  }

  // ─── Watch Progress (Plex marks watched via /:/unscrobble) ───
  async getWatchProgress(): Promise<ServerPlaybackProgress[]> {
    try {
      const http = this._ensureHttp()
      const data = await http.get<{ MediaContainer?: { Metadata?: any[] } }>('/library/onDeck')
      return (data.MediaContainer?.Metadata || []).map((raw: any) => ({
        itemId: raw.ratingKey || raw.key,
        mediaId: raw.ratingKey || raw.key,
        title: raw.title || '',
        currentTime: (raw.viewOffset || 0) / 1000,
        duration: (raw.duration || 0) / 1000,
        progress: raw.viewOffset && raw.duration ? raw.viewOffset / raw.duration : 0,
        completed: false,
        lastUpdatedAt: raw.lastViewedAt ? new Date(raw.lastViewedAt).getTime() : Date.now(),
      }))
    } catch { return [] }
  }

  async updateWatchProgress(itemId: string, currentTime: number, duration: number, completed: boolean): Promise<void> {
    const http = this._ensureHttp()
    const offset = Math.round(currentTime * 1000)
    await http.get('/:/timeline', {
      ratingKey: itemId,
      time: String(offset),
      duration: String(Math.round(duration * 1000)),
      state: completed ? 'stopped' : 'playing',
    })
  }

  // ─── Mapper ───
  private _mapItem(raw: any): MediaItem {
    return {
      id: raw.ratingKey || raw.key || '',
      title: raw.title || '',
      cover: raw.thumb ? `${this.config.url}${raw.thumb}` : '',
      providerId: this.id,
      providerName: this.name,
      type: this._mapPlexType(raw.type) === 'movies' ? 'movie' : 'tv',
      year: raw.year,
      score: raw.rating,
      remark: raw.summary?.substring(0, 100),
    }
  }

  private _mapPlexType(type: string): 'movies' | 'tvshows' | 'music' | 'photos' | 'mixed' {
    if (type === 'movie') return 'movies'
    if (type === 'show') return 'tvshows'
    if (type === 'artist' || type === 'album') return 'music'
    if (type === 'photo') return 'photos'
    return 'mixed'
  }
}
