// tests/unit/search-unified/search-content-use-case.spec.ts — CE8-B SearchContentUseCase tests

import { describe, it, expect } from 'vitest'
import { SearchContentUseCase } from '@/modules/search-unified/application/use-cases/SearchContentUseCase'
import { SearchValidationError } from '@/modules/search-unified/application/errors/SearchErrors'
import type { ISearchProviderPort } from '@/modules/search-unified/application/ports/ISearchProviderPort'
import type { ISearchAnalyticsPort } from '@/modules/search-unified/application/ports/ISearchAnalyticsPort'
import type { SearchDocument } from '@/modules/search-unified/domain/contracts/ISearchProvider'
import type { SearchQuery } from '@/modules/search-unified/domain/value-objects/SearchQuery'

class MockProvider implements ISearchProviderPort {
  constructor(
    public providerId: string,
    private docs: SearchDocument[] = [],
  ) {}
  isAvailable(): boolean { return true }
  async search(_q: SearchQuery): Promise<SearchDocument[]> { return this.docs }
}

function makeDoc(id: string, title: string): SearchDocument {
  return { id, contentId: `tmdb:${id}`, title, type: 'movie', year: 2024, genres: [], externalIds: { tmdb: parseInt(id) }, source: 'metadata', sourceId: 'tmdb', popularity: 50 }
}

describe('SearchContentUseCase', () => {
  it('should execute search successfully', async () => {
    const provider = new MockProvider('tmdb', [makeDoc('1', 'Interstellar')])
    const useCase = new SearchContentUseCase([provider])

    const result = await useCase.execute({ query: 'interstellar' })
    expect(result.response.items).toHaveLength(1)
    expect(result.response.items[0].title).toBe('Interstellar')
    expect(result.events).toHaveLength(1)
    expect(result.events[0].type).toBe('SearchCompleted')
    expect(result.providerResults).toHaveLength(1)
  })

  it('should throw validation error for invalid request', async () => {
    const provider = new MockProvider('tmdb', [])
    const useCase = new SearchContentUseCase([provider])

    await expect(useCase.execute({ query: '', page: 0, pageSize: 0 })).rejects.toThrow(SearchValidationError)
  })

  it('should not throw when analytics fails', async () => {
    const provider = new MockProvider('tmdb', [makeDoc('1', 'Test')])
    const badAnalytics: ISearchAnalyticsPort = {
      recordSearch: () => { throw new Error('Analytics down') },
      recordClick: () => {},
      recordPlay: () => {},
    }
    const useCase = new SearchContentUseCase([provider], badAnalytics)

    // Should not throw despite analytics failure
    const result = await useCase.execute({ query: 'test' })
    expect(result.response.items).toHaveLength(1)
  })
})
