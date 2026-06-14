// modules/search-unified/application/events/ApplicationEvents.ts — CE8-B
// Application-layer events. No transport — just type definitions.

import type { SearchResponseDto } from '../dto/SearchResponseDto'
import type { SearchError } from '../errors/SearchErrors'

/** Emitted when a search completes successfully. */
export interface SearchCompleted {
  readonly type: 'SearchCompleted'
  readonly response: SearchResponseDto
  readonly query: string
  readonly timestamp: number
}

/** Emitted when a search fails entirely (all providers failed). */
export interface SearchFailed {
  readonly type: 'SearchFailed'
  readonly query: string
  readonly error: SearchError
  readonly timestamp: number
}

/** Emitted when suggestions are generated. */
export interface SearchSuggestionsGenerated {
  readonly type: 'SearchSuggestionsGenerated'
  readonly query: string
  readonly suggestions: string[]
  readonly timestamp: number
}

export type ApplicationEvent =
  | SearchCompleted
  | SearchFailed
  | SearchSuggestionsGenerated

export const AppEventFactory = {
  searchCompleted(response: SearchResponseDto, query: string): SearchCompleted {
    return { type: 'SearchCompleted', response, query, timestamp: Date.now() }
  },

  searchFailed(query: string, error: SearchError): SearchFailed {
    return { type: 'SearchFailed', query, error, timestamp: Date.now() }
  },

  suggestionsGenerated(query: string, suggestions: string[]): SearchSuggestionsGenerated {
    return { type: 'SearchSuggestionsGenerated', query, suggestions, timestamp: Date.now() }
  },
}
