// modules/search-unified/domain/events/DomainEvents.ts — CE8-A
// Domain event types for the unified search pipeline.
// Events capture state transitions: search → merge → resolve → rank.

import type { SearchQuery } from '../value-objects/SearchQuery'
import type { SearchDocument } from '../contracts/ISearchProvider'
import type { UnifiedSearchResult } from '../entities/UnifiedSearchResult'
import type { AvailabilityInfo } from '../entities/AvailabilityInfo'

/** Emitted when a search is executed against providers. */
export interface SearchExecuted {
  readonly type: 'SearchExecuted'
  readonly query: SearchQuery
  readonly documentCount: number
  readonly sourceCount: number
  readonly timestamp: number
}

/** Emitted after documents are merged into unified results. */
export interface SearchResultMerged {
  readonly type: 'SearchResultMerged'
  readonly rawDocumentCount: number
  readonly unifiedResultCount: number
  readonly deduplicatedCount: number
  readonly timestamp: number
}

/** Emitted when availability is resolved for a batch of results. */
export interface AvailabilityResolved {
  readonly type: 'AvailabilityResolved'
  readonly resultsProcessed: number
  readonly playableCount: number
  readonly unavailableCount: number
  readonly timestamp: number
}

/** Emitted after final ranking is applied. */
export interface ResultRanked {
  readonly type: 'ResultRanked'
  readonly rankedCount: number
  readonly topScore: number
  readonly averageScore: number
  readonly timestamp: number
}

export type DomainEvent =
  | SearchExecuted
  | SearchResultMerged
  | AvailabilityResolved
  | ResultRanked

/** Factory helpers for creating events. */
export const EventFactory = {
  searchExecuted(query: SearchQuery, documentCount: number, sourceCount: number): SearchExecuted {
    return { type: 'SearchExecuted', query, documentCount, sourceCount, timestamp: Date.now() }
  },

  searchResultMerged(raw: number, unified: number, deduped: number): SearchResultMerged {
    return { type: 'SearchResultMerged', rawDocumentCount: raw, unifiedResultCount: unified, deduplicatedCount: deduped, timestamp: Date.now() }
  },

  availabilityResolved(processed: number, playable: number, unavailable: number): AvailabilityResolved {
    return { type: 'AvailabilityResolved', resultsProcessed: processed, playableCount: playable, unavailableCount: unavailable, timestamp: Date.now() }
  },

  resultRanked(rankedCount: number, topScore: number, averageScore: number): ResultRanked {
    return { type: 'ResultRanked', rankedCount, topScore, averageScore, timestamp: Date.now() }
  },
}
