// modules/search-unified/domain/value-objects/ContentIdentity.ts — CE8-A
// Immutable value object wrapping a canonical contentId.
// Never nullable, never empty — identity is always valid by construction.

export class ContentIdentity {
  readonly value: string

  private constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('ContentIdentity value must not be empty')
    }
    this.value = value.trim()
  }

  static create(value: string): ContentIdentity {
    return new ContentIdentity(value)
  }

  /** Generate contentId from external IDs with priority: tmdb → imdb → bangumi → tvmaze → fallback */
  static fromExternalIds(
    externalIds: { tmdb?: number; imdb?: string; bangumi?: number; tvmaze?: number },
    fallbackSourceId: string,
    fallbackType: string,
  ): ContentIdentity {
    const ids = externalIds
    if (ids.tmdb !== undefined) return new ContentIdentity(`tmdb:${ids.tmdb}`)
    if (ids.imdb !== undefined) return new ContentIdentity(`imdb:${ids.imdb}`)
    if (ids.bangumi !== undefined) return new ContentIdentity(`bangumi:${ids.bangumi}`)
    if (ids.tvmaze !== undefined) return new ContentIdentity(`tvmaze:${ids.tvmaze}`)
    return new ContentIdentity(`${fallbackSourceId}:${fallbackType}`)
  }

  equals(other: ContentIdentity): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }
}
