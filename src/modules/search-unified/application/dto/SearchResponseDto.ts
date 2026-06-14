// modules/search-unified/application/dto/SearchResponseDto.ts — CE8-B
// Output DTO for search use cases. Contains only DTO-safe fields.

import type { UnifiedSearchItemDto } from './UnifiedSearchItemDto'

export interface SearchResponseDto {
  readonly items: UnifiedSearchItemDto[]
  readonly page: number
  readonly pageSize: number
  readonly total: number
  readonly totalPages: number
  readonly hasNextPage: boolean
  readonly searchTimeMs: number
}
