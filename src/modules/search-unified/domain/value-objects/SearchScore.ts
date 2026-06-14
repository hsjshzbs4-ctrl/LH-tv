// modules/search-unified/domain/value-objects/SearchScore.ts — CE8-A
// Immutable value object for search relevance score.
// Range: 0-100. Validation rejects values outside this range.

export class SearchScore {
  readonly value: number

  private constructor(value: number) {
    if (value < 0 || value > 100) {
      throw new Error(`SearchScore must be 0-100, got ${value}`)
    }
    this.value = value
  }

  static create(value: number): SearchScore {
    return new SearchScore(value)
  }

  static zero(): SearchScore {
    return new SearchScore(0)
  }

  static max(): SearchScore {
    return new SearchScore(100)
  }

  /** Clamp value to valid range instead of throwing. */
  static clamp(value: number): SearchScore {
    return new SearchScore(Math.max(0, Math.min(100, Math.round(value))))
  }

  add(other: SearchScore): SearchScore {
    return SearchScore.clamp(this.value + other.value)
  }

  compare(other: SearchScore): number {
    return this.value - other.value
  }

  isGreaterThan(other: SearchScore): boolean {
    return this.value > other.value
  }

  equals(other: SearchScore): boolean {
    return this.value === other.value
  }
}
