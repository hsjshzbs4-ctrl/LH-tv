// tests/unit/search-unified/unified-search-orchestrator.spec.ts — CE8-B Orchestrator tests

import { describe, it, expect } from 'vitest'
import { UnifiedSearchOrchestrator } from '@/modules/search-unified/application/orchestrators/UnifiedSearchOrchestrator'
import type { ISearchProviderPort } from '@/modules/search-unified/application/ports/ISearchProviderPort'
import type { SearchDocument } from '@/modules/search-unified/domain/contracts/ISearchProvider'
import { SearchQuery } from '@/modules/search-unified/domain/value-objects/SearchQuery'

function makeDoc(overrides: Partial<SearchDocument> = {}): SearchDocument {
  return {
    id: 'doc-1', contentId: 'tmdb:157336', title: 'Interstellar',
    type: 'movie', year: 2014, genres: ['Sci-Fi'],
    externalIds: { tmdb: 157336 },
    source: 'metadata', sourceId: 'tmdb', popularity: 95,
    ...overrides,
  }
}

class MockProvider implements ISearchProviderPort {
  constructor(
    public providerId: string,
    private docs: SearchDocument[] = [],
    private available: boolean = true,
    private delayMs: number = 0,
  ) {}
  isAvailable(): boolean { return this.available }
  async search(_query: SearchQuery): Promise<SearchDocument[]> {
    if (this.delayMs > 0) await new Promise(r => setTimeout(r, this.delayMs))
    return this.docs
  }
}

describe('UnifiedSearchOrchestrator', () => {
  it('should execute full search pipeline', async () => {
    const provider = new MockProvider('tmdb', [
      makeDoc({ id: '1', title: 'Interstellar' }),
    ])
    const orchestrator = new UnifiedSearchOrchestrator([provider])

    const { response } = await orchestrator.execute({ query: 'interstellar' }, 1, 20)
    expect(response.items).toHaveLength(1)
    expect(response.items[0].title).toBe('Interstellar')
    expect(response.total).toBe(1)
    expect(response.page).toBe(1)
  })

  it('should deduplicate across providers', async () => {
    const p1 = new MockProvider('tmdb', [
      makeDoc({ id: 't1', contentId: 'tmdb:157336', source: 'metadata', sourceId: 'tmdb' }),
    ])
    const p2 = new MockProvider('jellyfin-1', [
      makeDoc({ id: 'j1', contentId: 'tmdb:157336', source: 'server', sourceId: 'jellyfin-1' }),
    ])
    const orchestrator = new UnifiedSearchOrchestrator([p1, p2])

    const { response } = await orchestrator.execute({ query: 'interstellar' }, 1, 20)
    expect(response.items).toHaveLength(1)
    expect(response.items[0].sourceCount).toBe(2)
  })

  it('should handle provider errors gracefully', async () => {
    class FailingProvider implements ISearchProviderPort {
      providerId = 'failing'
      isAvailable(): boolean { return true }
      async search(_q: SearchQuery): Promise<SearchDocument[]> { throw new Error('Down') }
    }

    const good = new MockProvider('tmdb', [makeDoc()])
    const bad = new FailingProvider()
    const orchestrator = new UnifiedSearchOrchestrator([good, bad])

    const { response, providerResults } = await orchestrator.execute({ query: 'test' }, 1, 20)
    expect(response.items).toHaveLength(1) // Good provider still works
    expect(providerResults).toHaveLength(2)
    expect(providerResults[1].documents).toBeNull()
  })

  it('should handle timeout gracefully', async () => {
    const slow = new MockProvider('slow', [makeDoc()], true, 5000) // 5s delay
    const fast = new MockProvider('fast', [makeDoc()], true, 0)
    const orchestrator = new UnifiedSearchOrchestrator([fast, slow])

    const { response, providerResults } = await orchestrator.execute({ query: 'test' }, 1, 20)
    expect(response.items.length).toBeGreaterThanOrEqual(1)
    const slowResult = providerResults.find(r => r.providerId === 'slow')
    expect(slowResult?.timedOut).toBe(true)
  })

  it('should skip unavailable providers', async () => {
    const available = new MockProvider('a', [makeDoc()], true)
    const unavailable = new MockProvider('b', [], false)
    const orchestrator = new UnifiedSearchOrchestrator([available, unavailable])

    const { providerResults } = await orchestrator.execute({ query: 'test' }, 1, 20)
    expect(providerResults).toHaveLength(1)
  })

  it('should paginate results', async () => {
    const docs = Array.from({ length: 30 }, (_, i) =>
      makeDoc({ id: `d${i}`, contentId: `tmdb:${i}`, title: `Movie ${i}` }),
    )
    const provider = new MockProvider('tmdb', docs)
    const orchestrator = new UnifiedSearchOrchestrator([provider])

    const { response } = await orchestrator.execute({ query: 'movie' }, 2, 10)
    expect(response.items).toHaveLength(10)
    expect(response.page).toBe(2)
    expect(response.total).toBe(30)
    expect(response.totalPages).toBe(3)
  })

  it('should prefer playable results', async () => {
    const local = makeDoc({ id: 'l1', contentId: 'tmdb:1', source: 'local', sourceId: 'local-library' })
    const meta = makeDoc({ id: 'm1', contentId: 'tmdb:2', source: 'metadata', sourceId: 'tmdb' })
    const provider = new MockProvider('combo', [meta, local])
    const orchestrator = new UnifiedSearchOrchestrator([provider])

    const { response } = await orchestrator.execute({ query: 'test' }, 1, 20)
    // Playable (local) should come first
    const firstIsPlayable = response.items[0]?.availability.playable
    expect(firstIsPlayable).toBe(true)
  })
})
