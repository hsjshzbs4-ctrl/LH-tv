// local-media/contracts/library.types.ts — CE5.1 Library configuration types

export interface LibraryConfig {
  directories: LibraryDirectory[]
  autoScan: boolean
  autoScanInterval: number   // ms, default 3600000 (1h)
  watchStates: boolean       // track watch progress
}

export interface LibraryDirectory {
  path: string
  type: 'movies' | 'tv' | 'anime' | 'mixed'
  enabled: boolean
  lastScannedAt?: number
}

export interface LibraryStats {
  totalMovies: number
  totalSeries: number
  totalEpisodes: number
  totalSize: number          // bytes
  lastScannedAt?: number
  unmatchedFiles: number
}

export interface LibraryQuery {
  type?: 'movie' | 'tv' | 'anime'
  genre?: string
  keyword?: string
  sortBy?: 'title' | 'year' | 'rating' | 'addedAt'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
  unwatched?: boolean
}
