// modules/search-unified/domain/contracts/ISearchProvider.ts — CE8-A
// Contract for search document providers (bridge to CE7 index + external sources).

import type { SearchQuery } from '../value-objects/SearchQuery'

/** Minimal search document contract — CE8-B infrastructure maps CE7 SearchDocument → this. */
export interface SearchDocument {
  readonly id: string
  readonly contentId: string
  readonly title: string
  readonly originalTitle?: string
  readonly type: 'movie' | 'tv' | 'anime'
  readonly year?: number
  readonly genres: string[]
  readonly overview?: string
  readonly externalIds: {
    readonly tmdb?: number
    readonly imdb?: string
    readonly bangumi?: number
    readonly tvmaze?: number
  }
  readonly source: 'metadata' | 'server' | 'local'
  readonly sourceId: string
  readonly popularity: number
}

export interface ISearchProvider {
  /** Execute a search and return raw documents. */
  search(query: SearchQuery): Promise<SearchDocument[]>
}
