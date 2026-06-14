// core/content-ecosystem/search/engine/SearchEngine.ts — CE7.7 Search orchestrator
// Unified search pipeline: Query → Parser → Index → Ranking → Response.
// Supports pagination, filtering, and cross-source aggregation (CE8 ready).

import { QueryParser } from './QueryParser'
import { RankingEngine } from './RankingEngine'
import { ContentIdentityService } from './ContentIdentityService'
import type { SearchIndexRepository } from '../index/SearchIndexRepository'
import type {
  SearchResult,
  SearchResponse,
  SearchOptions,
  SearchDocument,
  AggregatedSearchResult,
  AggregatedSource,
} from '../contracts/search.types'

const DEFAULT_LIMIT = 20
const DEFAULT_MIN_SCORE = 10

export class SearchEngine {
  private parser: QueryParser
  private ranker: RankingEngine
  private identity: ContentIdentityService
  private repository: SearchIndexRepository

  constructor(repository: SearchIndexRepository) {
    this.parser = new QueryParser()
    this.ranker = new RankingEngine()
    this.identity = new ContentIdentityService()
    this.repository = repository
  }

  // ─── Main Search ───

  /**
   * Search with full pipeline: parse → index lookup → filter → rank → paginate.
   */
  search(query: string, options?: SearchOptions): SearchResponse {
    const startTime = performance.now()

    // 1. Parse query
    const parsed = this.parser.parse(query)

    // 2. Candidate retrieval via inverted index (O(k))
    let candidates: SearchDocument[]
    if (parsed.tokens.length > 0) {
      candidates = this.repository.searchByTokens(parsed.tokens)
    } else {
      candidates = this.repository.getAll()
    }

    // 3. Pre-filter by options
    candidates = this._filterByOptions(candidates, options)

    // 4. Rank
    const ranked = this.ranker.rank(candidates, parsed)

    // 5. Apply minScore (use 0 for empty queries; options override wins otherwise)
    const hasKeyword = parsed.keyword.length > 0
    const explicitMinScore = options?.minScore
    const effectiveMinScore = explicitMinScore ?? (hasKeyword ? DEFAULT_MIN_SCORE : 0)
    const qualified = ranked.filter(r => r.score >= effectiveMinScore)

    // 6. Paginate
    const offset = options?.offset ?? 0
    const limit = options?.limit ?? DEFAULT_LIMIT
    const paged = qualified.slice(offset, offset + limit)

    return {
      items: paged,
      total: qualified.length,
      hasMore: offset + limit < qualified.length,
      searchTimeMs: Math.round(performance.now() - startTime),
    }
  }

  // ─── Convenience Methods ───

  searchByTitle(title: string): SearchResult[] {
    return this.search(title, { minScore: 0 }).items.filter(
      r => r.matchType === 'exact' || r.matchType === 'startsWith',
    )
  }

  searchByGenre(genre: string): SearchResult[] {
    const docs = this.repository.getByType('movie' as any) // Use index-based lookup
    // Get all docs and filter by genre (since genreIndex is in InMemoryIndex)
    const allDocs = this.repository.getAll()
    const filtered = allDocs.filter(d =>
      d.genres.some(g => g.toLowerCase() === genre.toLowerCase()),
    )
    const parsed = this.parser.parse('')
    return this.ranker.rank(filtered, parsed)
  }

  searchByTag(tag: string): SearchResult[] {
    const allDocs = this.repository.getAll()
    const filtered = allDocs.filter(d =>
      d.tags.some(t => t.toLowerCase() === tag.toLowerCase()),
    )
    const parsed = this.parser.parse('')
    return this.ranker.rank(filtered, parsed)
  }

  // ─── Aggregated Search (CE8 ready) ───

  /**
   * Search and aggregate results by contentId.
   * Same content from multiple sources (TMDB + Jellyfin + Plex + local)
   * is merged into a single AggregatedSearchResult.
   */
  aggregatedSearch(query: string, options?: SearchOptions): {
    items: AggregatedSearchResult[]
    rawDocumentCount: number
    uniqueContentCount: number
    searchTimeMs: number
    hasMore: boolean
  } {
    // Get raw search results
    const raw = this.search(query, { ...options, limit: undefined, offset: undefined })

    // Group by contentId
    const groups = new Map<string, SearchResult[]>()
    for (const result of raw.items) {
      const cid = result.doc.contentId
      const existing = groups.get(cid)
      if (existing) {
        existing.push(result)
      } else {
        groups.set(cid, [result])
      }
    }

    // Build aggregated results
    const aggregated: AggregatedSearchResult[] = []
    for (const [contentId, results] of groups) {
      const best = results.reduce((a, b) => (a.score > b.score ? a : b))
      const doc = best.doc

      const sources: AggregatedSource[] = results.map(r => ({
        source: r.doc.source,
        sourceId: r.doc.sourceId,
        title: r.doc.title,
        score: r.score,
      }))

      const allGenres = new Set<string>()
      for (const r of results) {
        for (const g of r.doc.genres) allGenres.add(g)
      }

      aggregated.push({
        contentId,
        title: doc.title,
        type: doc.type,
        year: doc.year,
        overview: doc.overview,
        genres: Array.from(allGenres),
        sources,
        bestScore: best.score,
        availableOnServers: results.some(r => r.doc.source === 'server'),
        availableLocally: results.some(r => r.doc.source === 'local'),
      })
    }

    // Re-sort by bestScore
    aggregated.sort((a, b) => b.bestScore - a.bestScore)

    // Apply pagination on aggregated results
    const offset = options?.offset ?? 0
    const limit = options?.limit ?? DEFAULT_LIMIT
    const paged = aggregated.slice(offset, offset + limit)

    return {
      items: paged,
      rawDocumentCount: raw.items.length,
      uniqueContentCount: aggregated.length,
      searchTimeMs: raw.searchTimeMs,
      hasMore: offset + limit < aggregated.length,
    }
  }

  // ─── Internal ───

  private _filterByOptions(docs: SearchDocument[], options?: SearchOptions): SearchDocument[] {
    if (!options) return docs

    let filtered = docs

    if (options.type !== undefined) {
      filtered = filtered.filter(d => d.type === options.type)
    }

    if (options.sources && options.sources.length > 0) {
      filtered = filtered.filter(d => options.sources!.includes(d.source))
    }

    if (options.year !== undefined) {
      filtered = filtered.filter(d => d.year === options.year)
    }

    return filtered
  }
}
