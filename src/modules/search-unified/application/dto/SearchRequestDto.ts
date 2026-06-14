// modules/search-unified/application/dto/SearchRequestDto.ts — CE8-B
// Validated input DTO for search use cases.
// No domain objects — only primitives.

import type { MediaType } from '../../domain/entities/UnifiedSearchResult'

export interface SearchRequestDto {
  readonly query: string
  readonly page?: number
  readonly pageSize?: number
  readonly mediaTypes?: MediaType[]
}

export class SearchRequestValidator {
  static readonly MAX_QUERY_LENGTH = 500
  static readonly DEFAULT_PAGE = 1
  static readonly DEFAULT_PAGE_SIZE = 20
  static readonly MAX_PAGE_SIZE = 100

  static validate(dto: SearchRequestDto): SearchValidationResult {
    const errors: string[] = []

    if (dto.query.length > this.MAX_QUERY_LENGTH) {
      errors.push(`Query must be <= ${this.MAX_QUERY_LENGTH} characters`)
    }

    const page = dto.page ?? this.DEFAULT_PAGE
    if (page < 1) {
      errors.push('Page must be >= 1')
    }

    const pageSize = dto.pageSize ?? this.DEFAULT_PAGE_SIZE
    if (pageSize < 1 || pageSize > this.MAX_PAGE_SIZE) {
      errors.push(`PageSize must be 1-${this.MAX_PAGE_SIZE}`)
    }

    if (dto.mediaTypes) {
      const valid = ['movie', 'tv', 'anime']
      for (const mt of dto.mediaTypes) {
        if (!valid.includes(mt)) {
          errors.push(`Invalid mediaType: ${mt}`)
        }
      }
    }

    return errors.length === 0
      ? { valid: true, page, pageSize }
      : { valid: false, errors, page, pageSize }
  }
}

export interface SearchValidationResult {
  readonly valid: boolean
  readonly errors?: string[]
  readonly page: number
  readonly pageSize: number
}
