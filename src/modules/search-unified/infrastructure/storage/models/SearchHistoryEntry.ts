// modules/search-unified/infrastructure/storage/models/SearchHistoryEntry.ts — CE8-C3
// Search history entry with dedup and frequency tracking.

export interface SearchHistoryEntry {
  readonly id: string
  readonly query: string
  readonly normalizedQuery: string
  frequency: number
  lastSearchedAt: number
  firstSearchedAt: number
  resultCount: number
}

export const MAX_HISTORY_ENTRIES = 5000
