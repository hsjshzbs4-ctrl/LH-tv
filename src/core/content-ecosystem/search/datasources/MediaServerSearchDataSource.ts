// core/content-ecosystem/search/datasources/MediaServerSearchDataSource.ts — CE7.4
// Adapts a single IMediaServer into ISearchDataSource.
// Fetches library contents from all server libraries → SearchDocument[].

import type { ISearchDataSource } from '../contracts/ISearchDataSource'
import type { SearchDocument, SearchSource } from '../contracts/search.types'
import { SearchDocumentType } from '../contracts/search.types'
import { contentIdentityService } from '../engine/ContentIdentityService'
import type { IMediaServer, MediaItem } from '@provider-contracts'

export class MediaServerSearchDataSource implements ISearchDataSource {
  readonly sourceType: SearchSource = 'server'

  constructor(private server: IMediaServer) {}

  get sourceId(): string {
    return this.server.id
  }

  isAvailable(): boolean {
    return this.server.isConnected?.() ?? false
  }

  async getDocuments(): Promise<SearchDocument[]> {
    const documents: SearchDocument[] = []
    const seen = new Set<string>()

    try {
      const libraries = await this.server.getLibraries()

      for (const lib of libraries) {
        // Only index movie/tv show type libraries
        // Skip music/audiobook/photo libraries
        if (lib.type && !['movie', 'show', 'mixed'].includes(lib.type)) continue

        try {
          const contents = await this.server.getLibraryContents(lib.id)
          for (const item of contents) {
            if (seen.has(item.id)) continue
            seen.add(item.id)
            documents.push(this._convert(item))
          }
        } catch {
          // Skip failed libraries, continue with others
        }
      }
    } catch {
      // Server unreachable — return empty
    }

    return documents
  }

  private _convert(item: MediaItem): SearchDocument {
    const type = this._mapType(item.type)
    const externalIds = {} // MediaItem from servers doesn't carry ExternalIds
    const contentId = contentIdentityService.generateContentId(
      externalIds,
      type,
      this.server.id,
    )

    return {
      id: `${this.server.id}:${item.id}`,
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
      source: 'server',
      sourceId: this.server.id,
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
}
