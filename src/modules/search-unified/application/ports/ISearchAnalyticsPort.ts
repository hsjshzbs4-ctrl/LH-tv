// modules/search-unified/application/ports/ISearchAnalyticsPort.ts — CE8-B
// Application port for search analytics.
// CE8-C infrastructure adapter implements this interface.

export interface SearchEvent {
  readonly query: string
  readonly resultCount: number
  readonly searchTimeMs: number
  readonly timestamp: number
}

export interface ClickEvent {
  readonly contentId: string
  readonly query: string
  readonly position: number
  readonly timestamp: number
}

export interface PlayEvent {
  readonly contentId: string
  readonly sourceId: string
  readonly timestamp: number
}

export interface ISearchAnalyticsPort {
  /** Record a search execution event. */
  recordSearch(event: SearchEvent): void

  /** Record a result click event. */
  recordClick(event: ClickEvent): void

  /** Record a play start event. */
  recordPlay(event: PlayEvent): void
}
