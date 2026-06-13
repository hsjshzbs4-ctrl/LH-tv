// media-servers/contracts/media-server.types.ts — CE6.1
// Media server specific types — extends @provider-contracts

import type { MediaItem } from '@provider-contracts'

export type ServerType = 'jellyfin' | 'emby' | 'plex'

export interface ServerConfig {
  id: string
  serverType: ServerType
  name: string
  url: string
  authToken?: string
  userId?: string
  connected: boolean
  lastConnectedAt?: number
}

export interface ServerLibrary {
  id: string
  serverId: string
  name: string
  type: 'movies' | 'tvshows' | 'music' | 'photos' | 'mixed' | 'anime'
  itemCount: number
}

export interface ServerItem {
  id: string
  name: string
  type: 'Movie' | 'Series' | 'Season' | 'Episode' | 'Audio' | 'Photo'
  year?: number
  overview?: string
  imageUrl?: string
  communityRating?: number
  runTimeTicks?: number
  seriesName?: string
  seasonName?: string
  indexNumber?: number    // episode number
  parentIndexNumber?: number // season number
}

export interface ServerPlaybackUrl {
  url: string
  headers: Record<string, string>
  subtitles: SubtitleTrack[]
}

export interface SubtitleTrack {
  id: string
  language: string
  codec: string
  isDefault: boolean
  url?: string
}

export interface ServerWatchProgress {
  itemId: string
  position: number        // ticks (1/10000ms) or seconds depending on server
  played: boolean
  lastPlayedAt?: number
  completed: boolean
  duration: number
}
