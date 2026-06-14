// modules/search-unified/application/dto/UnifiedSearchItemDto.ts — CE8-B
// UI-safe data transfer object for a single search result.
// No domain objects, no entities — only primitives and plain objects.

export interface SourceInfoDto {
  readonly sourceId: string
  readonly sourceType: string
  readonly available: boolean
  readonly quality: number
}

export interface AvailabilityDto {
  readonly playable: boolean
  readonly preferredSourceType: string | null
  readonly sourceCount: number
  readonly bestQuality: number
  readonly localAvailable: boolean
}

export interface UnifiedSearchItemDto {
  readonly contentId: string
  readonly title: string
  readonly originalTitle?: string
  readonly mediaType: 'movie' | 'tv' | 'anime'
  readonly overview?: string
  readonly poster?: string
  readonly backdrop?: string
  readonly year?: number
  readonly score: number
  readonly genres: string[]
  readonly sources: SourceInfoDto[]
  readonly availability: AvailabilityDto
  readonly sourceCount: number
  readonly isPlayable: boolean
}
