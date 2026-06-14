// core/content-ecosystem/search/engine/QueryParser.ts — CE7.5 Query parser
// Parses raw user query string into structured ParsedQuery.
// Future extension points (CE8+): genre:xxx, year:YYYY, type:movie/tv/anime syntax.

import { InMemoryIndex } from '../storage/InMemoryIndex'
import type { ParsedQuery } from '../contracts/search.types'

export class QueryParser {
  /**
   * Parse raw query string into structured ParsedQuery.
   *
   * Current: simple keyword extraction with tokenization.
   * Future (CE8+): `genre:sci-fi year:2014 type:movie interstellar` → structured filters.
   */
  parse(raw: string): ParsedQuery {
    const trimmed = raw.trim()

    // Future extension: detect filter prefixes
    // const filters = this._extractFilters(trimmed)
    // const keyword = this._extractKeyword(trimmed)

    const keyword = trimmed
    const tokens = keyword ? InMemoryIndex.tokenize(keyword) : []

    return {
      keyword,
      tokens,
      // Future expansion: type, genres, year from prefix syntax
    }
  }

  // Future extension points (not yet implemented):
  // private _extractFilters(raw: string): { type?, genres?, year? } { ... }
  // private _extractKeyword(raw: string): string { ... }
}
