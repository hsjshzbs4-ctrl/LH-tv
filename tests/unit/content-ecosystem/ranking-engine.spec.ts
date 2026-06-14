// tests/unit/content-ecosystem/ranking-engine.spec.ts — CE7 RankingEngine unit tests

import { describe, it, expect } from 'vitest'
import { RankingEngine } from '@/core/content-ecosystem/search/engine/RankingEngine'
import { QueryParser } from '@/core/content-ecosystem/search/engine/QueryParser'
import { SearchDocumentType } from '@/core/content-ecosystem/search/contracts/search.types'
import type { SearchDocument } from '@/core/content-ecosystem/search/contracts/search.types'

function makeDoc(overrides: Partial<SearchDocument> = {}): SearchDocument {
  return {
    id: 'test-1',
    contentId: 'tmdb:123',
    title: 'Interstellar',
    aliases: ['星际穿越'],
    type: SearchDocumentType.MOVIE,
    year: 2014,
    genres: ['Sci-Fi', 'Adventure'],
    tags: [],
    overview: '',
    externalIds: { tmdb: 157336 },
    source: 'metadata',
    sourceId: 'tmdb',
    popularity: 95,
    updatedAt: Date.now(),
    ...overrides,
  }
}

describe('RankingEngine', () => {
  const engine = new RankingEngine()
  const parser = new QueryParser()

  // ─── Exact Match ───

  it('should give exact title match +100', () => {
    const doc = makeDoc({ title: 'Interstellar' })
    const query = parser.parse('interstellar')
    const result = engine.scoreOne(doc, query)
    expect(result.score).toBeGreaterThanOrEqual(100)
    expect(result.matchType).toBe('exact')
  })

  it('should match original title exactly', () => {
    const doc = makeDoc({ title: 'Test', originalTitle: 'Interstellar' })
    const query = parser.parse('interstellar')
    const result = engine.scoreOne(doc, query)
    expect(result.score).toBeGreaterThanOrEqual(100)
  })

  // ─── Alias Match ───

  it('should give alias exact match +70', () => {
    const doc = makeDoc({ title: 'Something Else', aliases: ['Interstellar'] })
    const query = parser.parse('interstellar')
    const result = engine.scoreOne(doc, query)
    expect(result.score).toBeGreaterThanOrEqual(70)
    expect(result.matchType).toBe('alias')
  })

  // ─── StartsWith ───

  it('should give startsWith +50', () => {
    const doc = makeDoc({ title: 'Interstellar 2: The Return' })
    const query = parser.parse('interstellar')
    const result = engine.scoreOne(doc, query)
    expect(result.score).toBeGreaterThanOrEqual(50)
    // matchType should be 'startsWith' if not exact or alias
    expect(result.matchType).toBe('startsWith')
  })

  // ─── Contains ───

  it('should give contains +30', () => {
    const doc = makeDoc({ title: 'The Interstellar Journey' })
    const query = parser.parse('interstellar')
    const result = engine.scoreOne(doc, query)
    expect(result.score).toBeGreaterThanOrEqual(30)
  })

  // ─── Scoring Priority ───

  it('should rank exact match highest', () => {
    const docs = [
      makeDoc({ id: '1', title: 'Interstellar' }),
      makeDoc({ id: '2', title: 'Something Else', aliases: ['Interstellar'] }),
      makeDoc({ id: '3', title: 'Interstellar Returns' }),
      makeDoc({ id: '4', title: 'The Interstellar Files' }),
    ]
    const query = parser.parse('interstellar')
    const ranked = engine.rank(docs, query)

    expect(ranked[0].doc.id).toBe('1')  // exact
    expect(ranked[1].doc.id).toBe('2')  // alias
    expect(ranked[2].doc.id).toBe('3')  // startsWith
    expect(ranked[3].doc.id).toBe('4')  // contains
  })

  // ─── Empty Query ───

  it('should return score 0 for empty query', () => {
    const doc = makeDoc({ title: 'Interstellar' })
    const query = parser.parse('')
    const result = engine.scoreOne(doc, query)
    expect(result.score).toBe(0)
    expect(result.matchType).toBe('none')
  })

  // ─── No Match ───

  it('should return score 0 for no match', () => {
    const doc = makeDoc({ title: 'Interstellar' })
    const query = parser.parse('nonexistent')
    const result = engine.scoreOne(doc, query)
    expect(result.score).toBe(0)
  })

  // ─── Recent Boost ───

  it('should give recent update +10', () => {
    const doc = makeDoc({ title: 'Interstellar', updatedAt: Date.now() })
    const query = parser.parse('interstellar')
    const result = engine.scoreOne(doc, query)
    // Exact (100) + Recent (10) = 110
    expect(result.score).toBeGreaterThanOrEqual(110)
  })

  // ─── Tiebreaker by Popularity ───

  it('should break ties by popularity', () => {
    const docs = [
      makeDoc({ id: 'popular', title: 'Movie', popularity: 90 }),
      makeDoc({ id: 'unpopular', title: 'Movie', popularity: 20 }),
    ]
    const query = parser.parse('movie')
    const ranked = engine.rank(docs, query)

    expect(ranked[0].doc.id).toBe('popular')
    expect(ranked[1].doc.id).toBe('unpopular')
  })
})
