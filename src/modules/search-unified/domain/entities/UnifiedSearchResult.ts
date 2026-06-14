// modules/search-unified/domain/entities/UnifiedSearchResult.ts — CE8-A
// The core entity: a merged, ranked search result from multiple sources.
// Immutable — constructed once, never modified.

import { ContentIdentity } from '../value-objects/ContentIdentity'
import { SearchScore } from '../value-objects/SearchScore'
import { SearchSource } from './SearchSource'
import { AvailabilityInfo } from './AvailabilityInfo'
import type { SourceType } from './SearchSource'

export type MediaType = 'movie' | 'tv' | 'anime'

export interface UnifiedSearchResultProps {
  readonly contentId: ContentIdentity
  readonly title: string
  readonly originalTitle?: string
  readonly mediaType: MediaType
  readonly overview?: string
  readonly poster?: string
  readonly backdrop?: string
  readonly year?: number
  readonly score: SearchScore
  readonly sources: SearchSource[]
  readonly availability: AvailabilityInfo
  readonly genres: string[]
}

export class UnifiedSearchResult {
  readonly contentId: ContentIdentity
  readonly title: string
  readonly originalTitle?: string
  readonly mediaType: MediaType
  readonly overview?: string
  readonly poster?: string
  readonly backdrop?: string
  readonly year?: number
  readonly score: SearchScore
  readonly sources: readonly SearchSource[]
  readonly availability: AvailabilityInfo
  readonly genres: readonly string[]

  private constructor(props: UnifiedSearchResultProps) {
    if (!props.title || props.title.trim().length === 0) {
      throw new Error('UnifiedSearchResult: title must not be empty')
    }
    if (props.sources.length === 0) {
      throw new Error('UnifiedSearchResult: at least one source required')
    }

    this.contentId = props.contentId
    this.title = props.title.trim()
    this.originalTitle = props.originalTitle?.trim()
    this.mediaType = props.mediaType
    this.overview = props.overview
    this.poster = props.poster
    this.backdrop = props.backdrop
    this.year = props.year
    this.score = props.score
    this.sources = [...props.sources]
    this.availability = props.availability
    this.genres = [...props.genres]
  }

  static create(props: UnifiedSearchResultProps): UnifiedSearchResult {
    return new UnifiedSearchResult(props)
  }

  get isPlayable(): boolean {
    return this.availability.playable
  }

  get sourceCount(): number {
    return this.sources.length
  }

  get sourceTypes(): SourceType[] {
    return [...new Set(this.sources.map(s => s.sourceType))]
  }

  /** For sorting: higher score first, then more sources, then higher quality */
  static compare(a: UnifiedSearchResult, b: UnifiedSearchResult): number {
    const scoreCmp = b.score.compare(a.score)
    if (scoreCmp !== 0) return scoreCmp
    const sourceCmp = b.sourceCount - a.sourceCount
    if (sourceCmp !== 0) return sourceCmp
    return b.availability.bestQuality - a.availability.bestQuality
  }
}
