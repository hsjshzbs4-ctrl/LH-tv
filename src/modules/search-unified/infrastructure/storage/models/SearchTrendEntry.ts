// modules/search-unified/infrastructure/storage/models/SearchTrendEntry.ts — CE8-C3
// Trending search tracking with rolling score.

export interface SearchTrendEntry {
  readonly query: string
  count: number
  lastSeen: number
  /** Simple rolling score: recent searches weighted higher */
  rollingScore: number
}
