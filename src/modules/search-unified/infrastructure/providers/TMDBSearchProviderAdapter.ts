// modules/search-unified/infrastructure/providers/TMDBSearchProviderAdapter.ts — CE8-C1
// Bridges TMDB IMetadataProvider → ISearchProviderPort.
// Cache: enabled (60s), Retry: 2, Timeout: 3000ms.

import type { ISearchProviderPort } from '../../application/ports/ISearchProviderPort'
import type { SearchDocument } from '../../domain/contracts/ISearchProvider'
import type { SearchQuery } from '../../domain/value-objects/SearchQuery'
import { SearchDocumentMapper } from '../mappers/SearchDocumentMapper'
import { SearchProviderCache } from '../cache/SearchProviderCache'
import { ProviderClientWrapper } from '../adapters/ProviderClientWrapper'
import { SearchProviderMetrics } from '../metrics/SearchProviderMetrics'
import type { IMetadataProvider } from '@provider-contracts'

const RETRY_CONFIG = { maxRetries: 2, baseDelayMs: 200 }

export class TMDBSearchProviderAdapter implements ISearchProviderPort {
  readonly providerId = 'tmdb'
  private mapper = new SearchDocumentMapper()
  private cache = new SearchProviderCache()
  private wrapper = new ProviderClientWrapper(new SearchProviderMetrics())

  constructor(private tmdbProvider: IMetadataProvider) {}

  isAvailable(): boolean {
    return this.tmdbProvider.enabled
  }

  async search(query: SearchQuery): Promise<SearchDocument[]> {
    if (query.isEmpty || !this.isAvailable()) return []

    const cacheKey = this.cache.key(this.providerId, query.normalized)
    const cached = this.cache.get<SearchDocument[]>(cacheKey)
    if (cached) return cached

    const results = await this.wrapper.execute(
      this.providerId,
      RETRY_CONFIG,
      (q) => this._doSearch(q),
      query,
    )

    this.cache.set(cacheKey, results)
    return results
  }

  private async _doSearch(query: SearchQuery): Promise<SearchDocument[]> {
    const items = await this.tmdbProvider.search(query.raw)
    return items.map(item =>
      this.mapper.toDocument({
        id: `tmdb:${item.id}`,
        title: item.title,
        type: this._mapType(item.type),
        year: item.year,
        overview: item.remark,
        source: 'metadata',
        sourceId: 'tmdb',
        popularity: item.score ? Math.round(item.score * 10) : 50,
      }),
    )
  }

  private _mapType(type: string): 'movie' | 'tv' | 'anime' {
    if (type === 'movie') return 'movie'
    return 'tv'
  }
}
