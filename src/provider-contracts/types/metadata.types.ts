// provider-contracts/types/metadata.types.ts — Content Ecosystem shared types
// P6.0 CE1: Domain types for metadata providers, media servers, local media, recommendations

// ─── External IDs ───
export interface ExternalIds {
  tmdb?: number
  imdb?: string
  tvmaze?: number
  bangumi?: number
  anilist?: number
  mal?: number  // MyAnimeList
}

// ─── Person (cast/crew) ───
export interface Person {
  id: string
  name: string
  character?: string       // role name when cast
  job?: string             // "Director", "Writer" when crew
  profile: string          // photo URL
  order?: number
}

// ─── Content Rating ───
export interface ContentRating {
  average: number          // 0-10
  count: number
}

// ─── Season ───
export interface Season {
  id: string
  name: string
  seasonNumber: number
  episodeCount: number
  poster: string
  overview: string
  airDate: string
}

// ─── Watch History Source ───
export enum WatchHistorySource {
  Local = 'local',
  Jellyfin = 'jellyfin',
  Emby = 'emby',
  Plex = 'plex',
  Metadata = 'metadata',
}

// ─── Media Server ───
export interface MediaServerConnection {
  id: string
  serverType: 'jellyfin' | 'emby' | 'plex'
  name: string
  url: string
  authToken: string
  userId: string
  connected: boolean
  lastConnectedAt: number
}

export interface MediaServerLibrary {
  id: string
  serverId: string
  name: string
  type: 'movies' | 'tvshows' | 'music' | 'photos' | 'mixed'
  itemCount: number
}

// ─── Local Media ───
export interface LocalMediaItem {
  id: string
  filePath: string
  fileName: string
  directory: 'Movies' | 'TV' | 'Anime'
  format: 'mp4' | 'mkv' | 'avi' | 'mov' | 'flv' | 'webm'
  fileSize: number
  modifiedAt: number
  // Post-match metadata
  matchedTitle?: string
  matchedYear?: number
  matchedType?: 'movie' | 'tv' | 'anime'
  matchedTmdbId?: string
  matchedBangumiId?: string
  confidence?: number       // 0-1
}

export interface ScanResult {
  directory: string
  totalFiles: number
  newFiles: number
  removedFiles: number
  matchedFiles: number
  unmatchedFiles: number
  elapsedMs: number
}

export interface ParsedFilename {
  title: string
  year?: number
  season?: number
  episode?: number
  resolution?: string
  source?: string
  isAnime: boolean
}

// ─── Recommendation ───
export interface RecommendationInput {
  favoriteIds: string[]
  historyIds: string[]
  excludedIds: string[]
  preferredGenres: string[]
  preferredTypes: ('movie' | 'tv' | 'anime')[]
  limit: number
}

export interface RecommendationResult {
  items: RecommendationItem[]
  reason: string
  confidence: number        // 0-1
}

export interface RecommendationItem {
  mediaId: string
  title: string
  cover: string
  type: 'movie' | 'tv' | 'anime'
  year?: number
  score?: number
  reason: string
  matchScore: number        // 0-1
}

// ─── Rate Limiting ───
export interface RateLimitConfig {
  maxTokens: number
  refillRate: number        // tokens per ms
}

// ─── Metadata Cache TTL ───
export interface MetadataCacheConfig {
  search: number            // 1h
  movieDetail: number       // 24h
  seriesDetail: number      // 24h
  person: number            // 7d
  trending: number          // 6h
  image: number             // 7d
}

// ─── Search Index ───
export interface SearchIndexEntry {
  id: string
  title: string
  aliases: string[]
  type: 'movie' | 'tv' | 'anime'
  year?: number
  genres: string[]
  externalIds: ExternalIds
  source: 'metadata' | 'server' | 'local' | 'legacy'
  sourceId: string          // provider/server id
  popularity: number
}

// ─── Unified Search ───
export interface UnifiedSearchResult {
  id: string
  title: string
  cover: string
  type: 'movie' | 'tv' | 'anime'
  year?: number
  score?: number
  overview?: string
  genres: string[]
  sources: UnifiedSearchSource[]
  externalIds: ExternalIds
  // Availability
  availableOnServers: string[]   // server IDs
  availableLocally: boolean
  confidence: number
}

export interface UnifiedSearchSource {
  sourceType: 'metadata' | 'server' | 'local' | 'legacy'
  sourceId: string
  sourceName: string
  relevanceScore: number
}

export interface UnifiedSearchResponse {
  items: UnifiedSearchResult[]
  totalResults: number
  searchTime: number
  sources: string[]          // which sources contributed
}

// ─── Metadata Enhancement ───
export interface EnhancedMetadata {
  metadata: {
    title: string
    originalTitle?: string
    overview: string
    genres: string[]
    rating: ContentRating
    year?: number
    poster: string
    backdrop: string
    cast: Person[]
    crew: Person[]
  }
  confidence: number          // 0-1
  contributors: string[]      // which providers contributed
}
