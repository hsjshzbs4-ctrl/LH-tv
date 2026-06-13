// media-servers/jellyfin/JellyfinServer.ts — CE6.3
// Jellyfin media server integration — /Users/AuthenticateByName, /Items, /Videos/{id}/stream

import { BaseMediaServer } from '../base/BaseMediaServer'
import { HttpClient } from '../base/HttpClient'
import type {
  MediaItem, MediaDetail, MediaEpisode,
  ServerCredentials, ServerPlaybackProgress, MediaServerLibrary,
} from '@provider-contracts'
import type { ServerType, ServerItem } from '../contracts/media-server.types'
import type { AuthResult } from '../contracts/auth.types'

export class JellyfinServer extends BaseMediaServer {
  readonly id: string
  readonly name: string
  readonly serverType: ServerType = 'jellyfin'

  constructor(config: { id: string; name: string; url: string }) {
    super({ id: config.id, name: config.name, url: config.url, serverType: 'jellyfin', connected: false })
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

  protected _getAuthHeader(): string { return 'X-Emby-Token' }

  protected async _authenticate(creds: ServerCredentials): Promise<AuthResult> {
    try {
      if (creds.token) {
        // Test existing token
        const testHttp = new HttpClient({
          baseUrl: this.config.url, authToken: creds.token, authHeader: 'X-Emby-Token',
        })
        const me = await testHttp.get<{ Id: string; Name: string }>('/Users/Me')
        return { success: true, token: creds.token, userId: me.Id, serverName: me.Name }
      }

      // Username/password auth
      const http = new HttpClient({ baseUrl: this.config.url, authHeader: 'X-Emby-Token' })
      const authHeader = `MediaBrowser Client="LH-TV", Device="Desktop", DeviceId="${this.id}", Version="2.0"`
      const result = await http.post<{ AccessToken: string; User: { Id: string; Name: string }; ServerName: string }>(
        '/Users/AuthenticateByName',
        { Username: creds.username || '', Pw: creds.password || '' },
      )
      return {
        success: true,
        token: result.AccessToken,
        userId: result.User?.Id,
        serverName: result.ServerName,
      }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  }

  // ─── Libraries ───
  async getLibraries(): Promise<MediaServerLibrary[]> {
    const http = this._ensureHttp()
    const data = await http.get<{ Items: any[] }>('/Users/Me/Views')
    return (data.Items || []).map((v: any) => ({
      id: v.Id, serverId: this.id,
      name: v.Name, type: v.CollectionType || 'mixed',
      itemCount: v.ChildCount || 0,
    }))
  }

  async getLibraryContents(libraryId: string, options?: { startIndex?: number; limit?: number }): Promise<MediaItem[]> {
    const http = this._ensureHttp()
    const params: Record<string, string> = {
      ParentId: libraryId,
      SortBy: 'SortName',
      SortOrder: 'Ascending',
      IncludeItemTypes: 'Movie,Series',
      Recursive: 'true',
      StartIndex: String(options?.startIndex || 0),
      Limit: String(options?.limit || 50),
    }
    const data = await http.get<{ Items: ServerItem[] }>('/Items', params)
    return (data.Items || []).map(i => this._mapItem(i))
  }

  // ─── Search ───
  async search(keyword: string): Promise<MediaItem[]> {
    const http = this._ensureHttp()
    const data = await http.get<{ Items: ServerItem[] }>('/Items', {
      SearchTerm: keyword,
      IncludeItemTypes: 'Movie,Series',
      Recursive: 'true',
      Limit: '20',
    })
    return (data.Items || []).map(i => this._mapItem(i))
  }

  // ─── Detail ───
  async getDetail(id: string): Promise<MediaDetail> {
    const http = this._ensureHttp()
    const item = await http.get<ServerItem>(`/Users/Me/Items/${id}`)
    const episodes = item.type === 'Series'
      ? await this._getEpisodes(id)
      : []
    return {
      id: (item as any).Id || item.id, title: (item as any).Name || item.name || '', cover: item.imageUrl || '',
      description: (item as any).Overview || item.overview || '', providerId: this.id,
      episodes,
    }
  }

  private async _getEpisodes(seriesId: string): Promise<MediaEpisode[]> {
    const http = this._ensureHttp()
    const data = await http.get<{ Items: ServerItem[] }>(`/Shows/${seriesId}/Episodes`, {
      UserId: this.config.userId || '', Limit: '100',
    })
    return (data.Items || []).map(e => ({
      id: (e as any).Id || e.id, title: (e as any).Name || e.name || `E${e.indexNumber}`, episodeNumber: e.indexNumber,
    }))
  }

  // ─── Playback ───
  async getPlaybackUrl(id: string): Promise<string> {
    const token = this.config.authToken || ''
    const base = this.config.url.replace(/\/$/, '')
    return `${base}/Videos/${id}/stream?static=true&ApiKey=${token}`
  }

  // ─── Watch Progress ───
  async getWatchProgress(): Promise<ServerPlaybackProgress[]> {
    const http = this._ensureHttp()
    const data = await http.get<{ Items: any[] }>(`/Users/Me/PlayingItems`, { Limit: '100' })
    // Jellyfin also has /Users/Me/Items?IsPlayed=true for completed
    const played = await http.get<{ Items: any[] }>(`/Users/Me/Items`, { IsPlayed: 'true', Limit: '200' })
    const all = [...(data.Items || []), ...(played.Items || [])]
    return all.map((raw: any) => ({
      itemId: raw.id, mediaId: raw.id, title: raw.Name || '',
      currentTime: (raw.PlaybackPositionTicks || 0) / 10000,
      duration: (raw.RunTimeTicks || 0) / 10000,
      progress: raw.PlayedPercentage || 0,
      completed: raw.Played || false,
      lastUpdatedAt: Date.now(),
    }))
  }

  async updateWatchProgress(itemId: string, currentTime: number, duration: number, completed: boolean): Promise<void> {
    const http = this._ensureHttp()
    const ticks = Math.round(currentTime * 10000)
    await http.post(`/Users/Me/PlayingItems/${itemId}/Progress`, {
      PlaybackPositionTicks: ticks,
      IsPaused: false,
      IsMuted: false,
    })
    if (completed) {
      await http.post(`/Users/Me/PlayedItems/${itemId}`, {})
    }
  }

  // ─── Mapper ───
  private _mapItem(raw: ServerItem): MediaItem {
    return {
      id: raw.id,
      title: raw.name || raw.seriesName || '',
      cover: raw.imageUrl || '',
      providerId: this.id,
      providerName: this.name,
      type: raw.type === 'Movie' ? 'movie' : 'tv',
      year: raw.year,
      score: raw.communityRating,
      remark: raw.overview?.substring(0, 100),
    }
  }
}
