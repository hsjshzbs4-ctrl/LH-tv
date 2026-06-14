// tests/unit/search-unified/search-analytics-use-case.spec.ts — CE8-B SearchAnalyticsUseCase tests

import { describe, it, expect } from 'vitest'
import { SearchAnalyticsUseCase } from '@/modules/search-unified/application/use-cases/SearchAnalyticsUseCase'
import type { ISearchAnalyticsPort, SearchEvent, ClickEvent, PlayEvent } from '@/modules/search-unified/application/ports/ISearchAnalyticsPort'

class MockAnalyticsPort implements ISearchAnalyticsPort {
  searches: SearchEvent[] = []
  clicks: ClickEvent[] = []
  plays: PlayEvent[] = []

  recordSearch(event: SearchEvent): void { this.searches.push(event) }
  recordClick(event: ClickEvent): void { this.clicks.push(event) }
  recordPlay(event: PlayEvent): void { this.plays.push(event) }
}

describe('SearchAnalyticsUseCase', () => {
  it('should record search events', () => {
    const port = new MockAnalyticsPort()
    const useCase = new SearchAnalyticsUseCase(port)

    useCase.recordSearch('interstellar', 5, 42)
    expect(port.searches).toHaveLength(1)
    expect(port.searches[0].query).toBe('interstellar')
    expect(port.searches[0].resultCount).toBe(5)
    expect(port.searches[0].searchTimeMs).toBe(42)
  })

  it('should record click events', () => {
    const port = new MockAnalyticsPort()
    const useCase = new SearchAnalyticsUseCase(port)

    useCase.recordClick('tmdb:157336', 'interstellar', 3)
    expect(port.clicks).toHaveLength(1)
    expect(port.clicks[0].contentId).toBe('tmdb:157336')
    expect(port.clicks[0].position).toBe(3)
  })

  it('should record play events', () => {
    const port = new MockAnalyticsPort()
    const useCase = new SearchAnalyticsUseCase(port)

    useCase.recordPlay('tmdb:157336', 'jellyfin-1')
    expect(port.plays).toHaveLength(1)
    expect(port.plays[0].sourceId).toBe('jellyfin-1')
  })

  it('should not throw when analytics port fails', () => {
    const failing: ISearchAnalyticsPort = {
      recordSearch: () => { throw new Error('Down') },
      recordClick: () => { throw new Error('Down') },
      recordPlay: () => { throw new Error('Down') },
    }
    const useCase = new SearchAnalyticsUseCase(failing)

    // All calls should complete without throwing
    expect(() => useCase.recordSearch('q', 0, 0)).not.toThrow()
    expect(() => useCase.recordClick('c', 'q', 0)).not.toThrow()
    expect(() => useCase.recordPlay('c', 's')).not.toThrow()
  })
})
