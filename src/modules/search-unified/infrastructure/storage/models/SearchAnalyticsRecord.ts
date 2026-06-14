// modules/search-unified/infrastructure/storage/models/SearchAnalyticsRecord.ts — CE8-C3
// Unified analytics record for all event types: search, click, play, suggestion.

export type AnalyticsEventType = 'search' | 'click' | 'play' | 'suggestion'

export interface SearchAnalyticsRecord {
  readonly id: string
  readonly type: AnalyticsEventType
  readonly timestamp: number
  readonly query?: string
  readonly contentId?: string
  readonly provider?: string
  readonly source?: string
  readonly resultCount?: number
  readonly searchTimeMs?: number
  readonly position?: number
  readonly metadata?: Record<string, unknown>
}

/** Generate a unique record ID. */
export function generateRecordId(type: string, timestamp?: number): string {
  const ts = timestamp ?? Date.now()
  const rand = Math.random().toString(36).substring(2, 8)
  return `${type}:${ts}:${rand}`
}
