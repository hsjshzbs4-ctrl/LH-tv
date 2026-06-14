// modules/search-unified/application/use-cases/SearchAnalyticsUseCase.ts — CE8-B
// Analytics use case — tracks search, click, and play events.
// Only event dispatching. No persistence.

import type { ISearchAnalyticsPort } from '../ports/ISearchAnalyticsPort'
import type { SearchEvent, ClickEvent, PlayEvent } from '../ports/ISearchAnalyticsPort'

export class SearchAnalyticsUseCase {
  constructor(private analyticsPort: ISearchAnalyticsPort) {}

  /**
   * Record a search execution.
   */
  recordSearch(query: string, resultCount: number, searchTimeMs: number): void {
    const event: SearchEvent = {
      query,
      resultCount,
      searchTimeMs,
      timestamp: Date.now(),
    }
    try {
      this.analyticsPort.recordSearch(event)
    } catch {
      // Analytics must never throw
    }
  }

  /**
   * Record a result click.
   */
  recordClick(contentId: string, query: string, position: number): void {
    const event: ClickEvent = {
      contentId,
      query,
      position,
      timestamp: Date.now(),
    }
    try {
      this.analyticsPort.recordClick(event)
    } catch {
      // Analytics must never throw
    }
  }

  /**
   * Record a play start.
   */
  recordPlay(contentId: string, sourceId: string): void {
    const event: PlayEvent = {
      contentId,
      sourceId,
      timestamp: Date.now(),
    }
    try {
      this.analyticsPort.recordPlay(event)
    } catch {
      // Analytics must never throw
    }
  }
}
