// modules/search-unified/domain/value-objects/SearchQuery.ts — CE8-A
// Immutable value object wrapping a raw search query string.
// Prevents raw string usage — all search input flows through normalization.

export class SearchQuery {
  readonly raw: string
  readonly normalized: string
  readonly tokens: string[]

  private constructor(raw: string) {
    this.raw = raw
    this.normalized = raw.trim().replace(/\s+/g, ' ').toLowerCase()
    this.tokens = this._tokenize(this.normalized)
  }

  static create(raw: string): SearchQuery {
    return new SearchQuery(raw)
  }

  static empty(): SearchQuery {
    return new SearchQuery('')
  }

  get isEmpty(): boolean {
    return this.normalized.length === 0
  }

  /** Tokenize: split on separators, filter tokens < 2 chars (except CJK). */
  private _tokenize(text: string): string[] {
    const tokens: string[] = []

    // Standard word tokenization
    const words = text
      .split(/[\s\-_,.:;、，。·/()\[\]{}「」『』【】《》]+/)
      .map(t => t.trim())
      .filter(t => t.length >= 2)
    tokens.push(...words)

    // CJK character-level tokens
    const cjkChars = text.match(/[\p{Script=Han}\p{Script=Katakana}]/gu)
    if (cjkChars) {
      for (const char of cjkChars) {
        tokens.push(char)
      }
    }

    return tokens
  }

  equals(other: SearchQuery): boolean {
    return this.normalized === other.normalized
  }
}
