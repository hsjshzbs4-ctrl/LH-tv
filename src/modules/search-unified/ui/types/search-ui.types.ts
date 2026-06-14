// modules/search-unified/ui/types/search-ui.types.ts — CE8-E
// UI-specific types for the unified search experience.

export type SearchOverlayState = 'closed' | 'loading' | 'results' | 'error' | 'empty'
export type SearchResultFilter = 'all' | 'movie' | 'tv' | 'anime'
export type SearchSortOrder = 'relevance' | 'popularity' | 'recently_added' | 'recently_played' | 'alphabetical'
export type SearchTrendPeriod = 'today' | 'week' | 'month'

export interface UISearchResult {
  readonly contentId: string
  readonly title: string
  readonly originalTitle?: string
  readonly mediaType: 'movie' | 'tv' | 'anime'
  readonly overview?: string
  readonly poster?: string
  readonly year?: number
  readonly score: number
  readonly genres: string[]
  readonly sourceCount: number
  readonly isPlayable: boolean
  readonly providers: string[]
  readonly availability: {
    readonly playable: boolean
    readonly preferredSourceType: string | null
    readonly bestQuality: number
    readonly localAvailable: boolean
  }
}

export interface UISearchState {
  readonly query: string
  readonly overlayState: SearchOverlayState
  readonly results: UISearchResult[]
  readonly suggestions: string[]
  readonly history: string[]
  readonly trending: string[]
  readonly total: number
  readonly page: number
  readonly loading: boolean
  readonly error: string | null
  readonly activeFilter: SearchResultFilter
  readonly sortOrder: SearchSortOrder
  readonly selectedIndex: number
}
