// core/content-ecosystem/search/datasources/LocalLibrarySearchDataSource.ts — CE7.4
// Adapts the local media library into ISearchDataSource.
// Converts LibraryMovie[] + LibrarySeries[] → SearchDocument[].

import type { ISearchDataSource } from '../contracts/ISearchDataSource'
import type { SearchDocument, SearchSource } from '../contracts/search.types'
import { SearchDocumentType } from '../contracts/search.types'
import { contentIdentityService } from '../engine/ContentIdentityService'
import type { LocalMediaFacade } from '../../local-media/LocalMediaFacade'

interface LibraryMovieLike {
  id: string
  metadataId?: string
  title: string
  originalTitle?: string
  year?: number
  overview?: string
  genres?: string[]
  rating?: number
  addedAt?: number
}

interface LibrarySeriesLike {
  id: string
  metadataId?: string
  title: string
  originalTitle?: string
  year?: number
  overview?: string
  genres?: string[]
  rating?: number
  addedAt?: number
}

export class LocalLibrarySearchDataSource implements ISearchDataSource {
  readonly sourceId = 'local-library'
  readonly sourceType: SearchSource = 'local'

  constructor(private localMediaFacade: LocalMediaFacade) {}

  isAvailable(): boolean {
    return true // Local library is always available
  }

  async getDocuments(): Promise<SearchDocument[]> {
    const documents: SearchDocument[] = []

    try {
      const movies = this.localMediaFacade.getMovies() as unknown as LibraryMovieLike[]
      const series = this.localMediaFacade.getSeries() as unknown as LibrarySeriesLike[]

      for (const movie of movies) {
        documents.push(this._convertMovie(movie))
      }

      for (const show of series) {
        documents.push(this._convertSeries(show))
      }
    } catch {
      // Graceful
    }

    return documents
  }

  private _convertMovie(m: LibraryMovieLike): SearchDocument {
    const externalIds = this._buildExternalIds(m.metadataId)
    const type = SearchDocumentType.MOVIE
    const contentId = contentIdentityService.generateContentId(
      externalIds,
      type,
      this.sourceId,
    )

    return {
      id: `local:${m.id}`,
      contentId,
      title: m.title,
      originalTitle: m.originalTitle,
      aliases: m.originalTitle ? [m.originalTitle] : [],
      type,
      year: m.year,
      genres: m.genres || [],
      tags: [],
      overview: m.overview,
      externalIds,
      source: 'local',
      sourceId: this.sourceId,
      popularity: m.rating ? Math.round(m.rating * 10) : 50,
      updatedAt: m.addedAt || Date.now(),
    }
  }

  private _convertSeries(s: LibrarySeriesLike): SearchDocument {
    const externalIds = this._buildExternalIds(s.metadataId)
    const type = SearchDocumentType.TV
    const contentId = contentIdentityService.generateContentId(
      externalIds,
      type,
      this.sourceId,
    )

    return {
      id: `local:${s.id}`,
      contentId,
      title: s.title,
      originalTitle: s.originalTitle,
      aliases: s.originalTitle ? [s.originalTitle] : [],
      type,
      year: s.year,
      genres: s.genres || [],
      tags: [],
      overview: s.overview,
      externalIds,
      source: 'local',
      sourceId: this.sourceId,
      popularity: s.rating ? Math.round(s.rating * 10) : 50,
      updatedAt: s.addedAt || Date.now(),
    }
  }

  /** metadataId typically stores the TMDB ID in the library. */
  private _buildExternalIds(metadataId?: string): { tmdb?: number } {
    if (metadataId && /^\d+$/.test(metadataId)) {
      return { tmdb: parseInt(metadataId, 10) }
    }
    return {}
  }
}
