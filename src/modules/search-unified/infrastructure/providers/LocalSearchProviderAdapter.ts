// modules/search-unified/infrastructure/providers/LocalSearchProviderAdapter.ts — CE8-C1
// Bridges CE7 SearchFacade → ISearchProviderPort.
// No cache, no retry — local search is always fresh and fast.

import type { ISearchProviderPort } from '../../application/ports/ISearchProviderPort'
import type { SearchDocument } from '../../domain/contracts/ISearchProvider'
import type { SearchQuery } from '../../domain/value-objects/SearchQuery'
import { SearchDocumentMapper } from '../mappers/SearchDocumentMapper'
import type { SearchFacade } from '@/core/content-ecosystem/search/facade/SearchFacade'

export class LocalSearchProviderAdapter implements ISearchProviderPort {
  readonly providerId = 'local-library'
  private mapper = new SearchDocumentMapper()

  constructor(private searchFacade: SearchFacade) {}

  isAvailable(): boolean {
    return true
  }

  async search(query: SearchQuery): Promise<SearchDocument[]> {
    if (query.isEmpty) return []

    const response = this.searchFacade.search(query.raw)
    return response.items.map(item =>
      this.mapper.toDocument({
        id: `local:${item.doc.id}`,
        title: item.doc.title,
        type: this._mapType(item.doc.type),
        year: item.doc.year,
        genres: item.doc.genres,
        overview: item.doc.overview,
        externalIds: item.doc.externalIds,
        source: 'local',
        sourceId: 'local-library',
        popularity: item.score,
      }),
    )
  }

  private _mapType(type: string): 'movie' | 'tv' | 'anime' {
    switch (type) {
      case 'movie': return 'movie'
      case 'tv': return 'tv'
      case 'anime': return 'anime'
      default: return 'movie'
    }
  }
}
