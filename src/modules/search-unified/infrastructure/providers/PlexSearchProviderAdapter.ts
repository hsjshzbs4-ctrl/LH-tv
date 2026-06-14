// modules/search-unified/infrastructure/providers/PlexSearchProviderAdapter.ts — CE8-C1
// Bridges Plex IMediaServer → ISearchProviderPort.
// Cache: enabled (60s), Retry: 1, Timeout: 3000ms.

import type { ISearchProviderPort } from '../../application/ports/ISearchProviderPort'
import type { SearchDocument } from '../../domain/contracts/ISearchProvider'
import type { SearchQuery } from '../../domain/value-objects/SearchQuery'
import { SearchDocumentMapper } from '../mappers/SearchDocumentMapper'
import { SearchProviderCache } from '../cache/SearchProviderCache'
import { ProviderClientWrapper } from '../adapters/ProviderClientWrapper'
import { SearchProviderMetrics } from '../metrics/SearchProviderMetrics'
import type { IMediaServer } from '@provider-contracts'

const RETRY_CONFIG = { maxRetries: 1, baseDelayMs: 300 }

export class PlexSearchProviderAdapter implements ISearchProviderPort {
  readonly providerId: string
  private mapper = new SearchDocumentMapper()
  private cache = new SearchProviderCache()
  private wrapper = new ProviderClientWrapper(new SearchProviderMetrics())

  constructor(private server: IMediaServer) {
    this.providerId = server.id
  }

  isAvailable(): boolean {
    return this.server.isConnected?.() ?? false
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
    const items = await this.server.search(query.raw)
    return items.map(item =>
      this.mapper.toDocument({
        id: `${this.providerId}:${item.id}`,
        title: item.title,
        type: item.type === 'movie' ? 'movie' : 'tv',
        year: item.year,
        overview: item.remark,
        source: 'server',
        sourceId: this.providerId,
        popularity: item.score ? Math.round(item.score * 10) : 50,
      }),
    )
  }
}
