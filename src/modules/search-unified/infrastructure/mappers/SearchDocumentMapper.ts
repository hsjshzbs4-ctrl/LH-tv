// modules/search-unified/infrastructure/mappers/SearchDocumentMapper.ts — CE8-C1
// Converts provider-specific models into unified SearchDocument format.
// No provider-specific logic leaks past this mapper.

import type { SearchDocument } from '../../domain/contracts/ISearchProvider'

export interface RawDocumentInput {
  readonly id: string
  readonly contentId?: string
  readonly title: string
  readonly originalTitle?: string
  readonly type: 'movie' | 'tv' | 'anime'
  readonly year?: number
  readonly genres?: string[]
  readonly overview?: string
  readonly externalIds?: {
    readonly tmdb?: number
    readonly imdb?: string
    readonly bangumi?: number
    readonly tvmaze?: number
  }
  readonly source: 'metadata' | 'server' | 'local'
  readonly sourceId: string
  readonly popularity?: number
}

export class SearchDocumentMapper {
  /** Convert raw provider input to SearchDocument. */
  toDocument(input: RawDocumentInput): SearchDocument {
    const contentId = input.contentId
      ?? this._generateContentId(input.externalIds ?? {}, input.sourceId, input.type)

    return {
      id: input.id,
      contentId,
      title: input.title,
      originalTitle: input.originalTitle,
      type: input.type,
      year: input.year,
      genres: input.genres ?? [],
      overview: input.overview,
      externalIds: input.externalIds ?? {},
      source: input.source,
      sourceId: input.sourceId,
      popularity: input.popularity ?? 50,
    }
  }

  /** Convert multiple raw inputs. */
  toDocuments(inputs: RawDocumentInput[]): SearchDocument[] {
    return inputs.map(i => this.toDocument(i))
  }

  private _generateContentId(
    externalIds: RawDocumentInput['externalIds'],
    sourceId: string,
    type: string,
  ): string {
    const ids = externalIds ?? {}
    if (ids.tmdb !== undefined) return `tmdb:${ids.tmdb}`
    if (ids.imdb !== undefined) return `imdb:${ids.imdb}`
    if (ids.bangumi !== undefined) return `bangumi:${ids.bangumi}`
    if (ids.tvmaze !== undefined) return `tvmaze:${ids.tvmaze}`
    return `${sourceId}:${type}`
  }
}
