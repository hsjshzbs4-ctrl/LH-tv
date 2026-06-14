// modules/search-unified/domain/entities/SearchSource.ts — CE8-A
// Represents a single data source contributing to a unified search result.
// Immutable — no framework dependencies.

export type SourceType = 'local' | 'jellyfin' | 'plex' | 'emby' | 'tmdb' | 'bangumi' | 'tvmaze'

export interface SearchSourceProps {
  readonly sourceId: string
  readonly sourceType: SourceType
  readonly externalId: string
  readonly available: boolean
  readonly quality: number  // 0-100 quality ranking
}

export class SearchSource {
  readonly sourceId: string
  readonly sourceType: SourceType
  readonly externalId: string
  readonly available: boolean
  readonly quality: number

  private constructor(props: SearchSourceProps) {
    this.sourceId = props.sourceId
    this.sourceType = props.sourceType
    this.externalId = props.externalId
    this.available = props.available
    this.quality = Math.max(0, Math.min(100, props.quality))
  }

  static create(props: SearchSourceProps): SearchSource {
    return new SearchSource(props)
  }

  /** Quality ranking for source priority: local > jellyfin > plex > emby > metadata */
  rankPriority(): number {
    const basePriority: Record<SourceType, number> = {
      local: 500,
      jellyfin: 400,
      plex: 300,
      emby: 200,
      tmdb: 100,
      bangumi: 90,
      tvmaze: 80,
    }
    return (basePriority[this.sourceType] || 0) + this.quality
  }

  isMetaOnly(): boolean {
    return this.sourceType === 'tmdb' || this.sourceType === 'bangumi' || this.sourceType === 'tvmaze'
  }

  isPlayable(): boolean {
    return this.available && !this.isMetaOnly()
  }
}
