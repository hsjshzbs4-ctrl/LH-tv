// local-media/library/LibraryIndexer.ts — CE5.7
// Build search index over library contents for fast queries

import type { LibraryMovie, LibrarySeries, LibraryEpisode } from '../contracts/local-media.types'
import type { LibraryQuery } from '../contracts/library.types'

export interface SearchIndexEntry {
  id: string
  type: 'movie' | 'series' | 'episode'
  title: string
  originalTitle?: string
  genres: string[]
  year?: number
  rating: number
  addedAt: number
  tokens: string[]          // tokenized for search
}

export class LibraryIndexer {
  private index: SearchIndexEntry[] = []
  private built = false

  build(movies: LibraryMovie[], series: LibrarySeries[]): void {
    this.index = []

    for (const movie of movies) {
      this.index.push({
        id: movie.id, type: 'movie',
        title: movie.title, originalTitle: movie.originalTitle,
        genres: movie.genres, year: movie.year, rating: movie.rating,
        addedAt: movie.addedAt,
        tokens: this._tokenize(movie.title + ' ' + (movie.originalTitle || '')),
      })
    }

    for (const s of series) {
      this.index.push({
        id: s.id, type: 'series',
        title: s.title, originalTitle: s.originalTitle,
        genres: s.genres, year: s.year, rating: s.rating,
        addedAt: s.addedAt,
        tokens: this._tokenize(s.title + ' ' + (s.originalTitle || '')),
      })
    }

    this.built = true
  }

  search(query: LibraryQuery): SearchIndexEntry[] {
    if (!this.built) return []

    let results = [...this.index]

    // Type filter
    if (query.type && query.type !== ('anime' as any)) {
      results = results.filter(e => e.type === query.type)
    }

    // Genre filter
    if (query.genre) {
      results = results.filter(e => e.genres.some(g => g.toLowerCase() === query.genre!.toLowerCase()))
    }

    // Keyword search
    if (query.keyword) {
      const tokens = this._tokenize(query.keyword)
      results = results.filter(e => tokens.some(t => e.tokens.some(et => et.includes(t) || t.includes(et))))
      // Sort by relevance: token match count
      results.sort((a, b) => {
        const aMatches = tokens.filter(t => a.tokens.some(et => et.includes(t))).length
        const bMatches = tokens.filter(t => b.tokens.some(et => et.includes(t))).length
        return bMatches - aMatches
      })
    }

    // Sort
    if (query.sortBy) {
      const order = query.sortOrder === 'desc' ? -1 : 1
      results.sort((a, b) => {
        const av = a[query.sortBy!] ?? 0
        const bv = b[query.sortBy!] ?? 0
        return (av > bv ? 1 : -1) * order
      })
    }

    // Unwatched only
    if (query.unwatched) {
      // This requires join with watch states — handled by LibraryManager
    }

    // Pagination
    if (query.offset) results = results.slice(query.offset)
    if (query.limit) results = results.slice(0, query.limit)

    return results
  }

  isBuilt(): boolean { return this.built }

  private _tokenize(text: string): string[] {
    return text.toLowerCase()
      .replace(/[^a-z0-9一-鿿\s]/g, '')
      .split(/\s+/)
      .filter(t => t.length > 0)
  }
}
