// local-media/contracts/local-media.types.ts — CE5.1 Library data models

// ─── Video Extensions ───
export const VIDEO_EXTENSIONS = ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.m4v', '.ts', '.webm'] as const
export type VideoExtension = typeof VIDEO_EXTENSIONS[number]

export const IGNORE_EXTENSIONS = ['.nfo', '.txt', '.jpg', '.png', '.srt', '.ass', '.ssa', '.sub', '.idx'] as const

// ─── Media File ───
export interface MediaFile {
  path: string
  name: string
  extension: VideoExtension | string
  size: number
  mtime: number
  directory: string       // root dir name: 'Movies', 'TV', 'Anime'
  relativePath: string    // path relative to root dir
}

// ─── File Classification ───
export type MediaClassification = 'movie' | 'tv' | 'anime' | 'special' | 'unknown'

export interface ClassifiedFile extends MediaFile {
  classification: MediaClassification
  parsed?: {
    title: string
    year?: number
    season?: number
    episode?: number
    resolution?: string
    source?: string
    isAnime: boolean
  }
}

// ─── Media Fingerprint ───
export interface MediaFingerprint {
  hash: string          // SHA1(path + size)
  path: string
  size: number
  createdAt: number
}

// ─── Library Models ───

export interface LibraryMovie {
  id: string
  metadataId?: string       // TMDB ID
  title: string
  originalTitle?: string
  year?: number
  poster: string
  backdrop: string
  overview: string
  genres: string[]
  rating: number
  runtime: number
  paths: string[]           // file paths for multi-version
  versions: MediaVersion[]
  watched: boolean
  addedAt: number
  updatedAt: number
}

export interface MediaVersion {
  path: string
  resolution: string        // '1080p', '4K', '720p'
  source: string            // 'BluRay', 'WEB-DL', 'REMUX'
  size: number
  fingerprint: string
}

export interface LibrarySeries {
  id: string
  metadataId?: string
  title: string
  originalTitle?: string
  year?: number
  poster: string
  backdrop: string
  overview: string
  genres: string[]
  rating: number
  status: string
  seasons: LibrarySeason[]
  addedAt: number
  updatedAt: number
}

export interface LibrarySeason {
  id: string
  seasonNumber: number
  title: string
  episodeCount: number
  episodes: LibraryEpisode[]
}

export interface LibraryEpisode {
  id: string
  episodeNumber: number
  title: string
  path: string
  size: number
  fingerprint: string
  watched: boolean
  resumePosition: number    // seconds
  duration: number          // seconds
  completed: boolean
}

// ─── Scan Job ───
export type ScanJobState = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

export interface ScanJob {
  id: string
  state: ScanJobState
  directory: string
  startedAt: number
  completedAt?: number
  progress: ScanProgress
  result?: ScanResult
  error?: string
}

export interface ScanProgress {
  total: number
  scanned: number
  matched: number
  currentDirectory: string
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

// ─── Watch State ───
export interface WatchState {
  mediaId: string
  mediaType: 'movie' | 'episode'
  position: number          // seconds
  duration: number
  progress: number          // 0-1
  lastWatched: number
  completed: boolean
}

// ─── Match Result ───
export interface MatchResult {
  metadata: {
    title: string
    originalTitle?: string
    year?: number
    poster: string
    backdrop: string
    overview: string
    genres: string[]
    rating: number
    runtime: number
    externalIds: Record<string, string>
  }
  confidence: number        // 0-1
  provider: string          // 'tmdb', 'bangumi', 'tvmaze'
}
