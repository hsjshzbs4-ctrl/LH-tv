// modules/search-unified/infrastructure/storage/models/SuggestionUsageEntry.ts — CE8-C3
// Suggestion effectiveness tracking.

export interface SuggestionUsageEntry {
  readonly suggestion: string
  shown: number
  selected: number
  lastShownAt: number
  lastSelectedAt: number

  /** Click-through rate: selected / shown */
  readonly ctr?: number
}
