// core/content-ecosystem/search/engine/RankingEngine.ts — CE7.6 Document scorer
// Scores SearchDocuments against a parsed query.
//
// Scoring rules:
//   Title exact match   +100
//   Alias exact match   +70
//   Title startsWith    +50
//   Title/alias contains +30
//   Genre intersection  +20
//   Recent update (7d)  +10

import type { SearchDocument, ParsedQuery, SearchResult, MatchType } from '../contracts/search.types'

/** Scoring weight constants */
const WEIGHTS = {
  EXACT_TITLE: 100,
  EXACT_ALIAS: 70,
  STARTS_WITH: 50,
  CONTAINS: 30,
  GENRE_MATCH: 20,
  RECENT_BOOST: 10,
} as const

const RECENT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export class RankingEngine {
  /**
   * Score and rank documents against a query.
   * Returns sorted SearchResult[] (highest score first).
   * When query is empty, returns all documents with score 0.
   */
  rank(docs: SearchDocument[], query: ParsedQuery): SearchResult[] {
    const results: SearchResult[] = []

    for (const doc of docs) {
      const scoreResult = this.scoreOne(doc, query)
      // For empty queries, include all documents (score 0)
      // For keyword queries, filter out zero-score results
      if (scoreResult.score > 0 || !query.keyword) {
        results.push(scoreResult)
      }
    }

    // Sort by score descending, then by popularity descending for ties
    results.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return (b.doc.popularity || 0) - (a.doc.popularity || 0)
    })

    return results
  }

  /**
   * Score a single document against a query.
   */
  scoreOne(doc: SearchDocument, query: ParsedQuery): SearchResult {
    if (!query.keyword) {
      return { doc, score: 0, matchType: 'none' }
    }

    const keyword = query.keyword.toLowerCase()
    const title = doc.title.toLowerCase()
    const aliases = doc.aliases.map(a => a.toLowerCase())
    const originalTitle = doc.originalTitle?.toLowerCase()

    let score = 0
    let matchType: MatchType = 'none'

    // 1. Exact match on title
    if (title === keyword || originalTitle === keyword) {
      score += WEIGHTS.EXACT_TITLE
      matchType = 'exact'
    }

    // 2. Exact match on alias
    if (aliases.some(a => a === keyword)) {
      score += WEIGHTS.EXACT_ALIAS
      if (matchType === 'none') matchType = 'alias'
    }

    // 3. StartsWith on title
    if (title.startsWith(keyword) || (originalTitle && originalTitle.startsWith(keyword))) {
      score += WEIGHTS.STARTS_WITH
      if (matchType === 'none') matchType = 'startsWith'
    }

    // Also check alias startsWith
    if (aliases.some(a => a.startsWith(keyword))) {
      score += Math.floor(WEIGHTS.STARTS_WITH / 2) // Partial weight for alias startsWith
    }

    // 4. Contains in title
    if (title.includes(keyword) || (originalTitle && originalTitle.includes(keyword))) {
      score += WEIGHTS.CONTAINS
      if (matchType === 'none') matchType = 'contains'
    }

    // Contains in alias
    if (aliases.some(a => a.includes(keyword))) {
      score += Math.floor(WEIGHTS.CONTAINS / 2)
      if (matchType === 'none') matchType = 'contains'
    }

    // 5. Genre intersection (if query specifies genres)
    if (query.genres && query.genres.length > 0) {
      const docGenres = new Set(doc.genres.map(g => g.toLowerCase()))
      const matching = query.genres.filter(g => docGenres.has(g.toLowerCase()))
      score += matching.length * WEIGHTS.GENRE_MATCH
      if (matching.length > 0 && matchType === 'none') matchType = 'genre'
    }

    // 6. Recent update boost (only if there was some text match)
    if (score > 0) {
      const ageMs = Date.now() - doc.updatedAt
      if (ageMs < RECENT_WINDOW_MS) {
        score += WEIGHTS.RECENT_BOOST
      }
    }

    return { doc, score, matchType }
  }
}
