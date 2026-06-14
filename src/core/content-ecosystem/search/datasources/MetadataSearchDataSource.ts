// core/content-ecosystem/search/datasources/MetadataSearchDataSource.ts — CE7.4
// Adapts a single IMetadataProvider into ISearchDataSource.
// Fetches trending + popular items and converts to SearchDocument[].

import type { ISearchDataSource } from '../contracts/ISearchDataSource'
import type { SearchDocument, SearchSource } from '../contracts/search.types'
import { SearchDocumentType } from '../contracts/search.types'
import { contentIdentityService } from '../engine/ContentIdentityService'
import type { IMetadataProvider, MediaItem } from '@provider-contracts'

export class MetadataSearchDataSource implements ISearchDataSource {
  readonly sourceType: SearchSource = 'metadata'

  constructor(private provider: IMetadataProvider) {}

  get sourceId(): string {
    return this.provider.id
  }

  isAvailable(): boolean {
    return this.provider.enabled
  }

  async getDocuments(): Promise<SearchDocument[]> {
    const documents: SearchDocument[] = []
    const seen = new Set<string>()

    try {
      // Fetch trending (movies + tv)
      const [trendingMovies, trendingTV, popularMovies, popularTV] =
        await Promise.allSettled([
          this.provider.getTrending('movie'),
          this.provider.getTrending('tv'),
          this.provider.getPopular('movie'),
          this.provider.getPopular('tv'),
        ])

      const allItems: MediaItem[] = []
      for (const result of [trendingMovies, trendingTV, popularMovies, popularTV]) {
        if (result.status === 'fulfilled' && Array.isArray(result.value)) {
          allItems.push(...result.value)
        }
      }

      for (const item of allItems) {
        if (seen.has(item.id)) continue
        seen.add(item.id)

        documents.push(this._convert(item))
      }
    } catch {
      // Graceful: return whatever we got
    }

    return documents
  }

  private _convert(item: MediaItem): SearchDocument {
    const type = this._mapType(item.type)
    const externalIds = this._extractExternalIds(item)
    const contentId = contentIdentityService.generateContentId(
      externalIds,
      type,
      this.provider.id,
    )

    return {
      id: `${this.provider.id}:${item.id}`,
      contentId,
      title: item.title,
      originalTitle: undefined,
      aliases: [],
      type,
      year: item.year,
      genres: [],
      tags: [],
      overview: item.remark,
      externalIds,
      source: 'metadata',
      sourceId: this.provider.id,
      popularity: item.score ? Math.round(item.score * 10) : 50,
      updatedAt: Date.now(),
    }
  }

  private _mapType(raw: string): SearchDocumentType {
    switch (raw) {
      case 'movie': return SearchDocumentType.MOVIE
      case 'tv': return SearchDocumentType.TV
      case 'anime': return SearchDocumentType.ANIME
      default: return SearchDocumentType.MOVIE
    }
  }

  /** Best-effort external ID extraction from MediaItem. */
  private _extractExternalIds(_item: MediaItem): Record<string, never> {
    // MediaItem doesn't carry ExternalIds — metadata detail endpoints do.
    // For indexing, we rely on the provider ID scoping.
    // Full ExternalIds are populated during detail enrichment (CE8).
    return {}
  }
}
