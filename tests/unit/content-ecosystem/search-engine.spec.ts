// tests/unit/content-ecosystem/search-engine.spec.ts — CE7 SearchEngine unit tests

import { describe, it, expect, beforeEach } from 'vitest'
import { SearchEngine } from '@/core/content-ecosystem/search/engine/SearchEngine'
import { SearchIndexRepository } from '@/core/content-ecosystem/search/index/SearchIndexRepository'
import { MemorySearchStorage } from '@/core/content-ecosystem/search/storage/MemorySearchStorage'
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
    tags: ['space', 'nolan'],
    overview: 'Space explorers.',
    externalIds: { tmdb: 157336, imdb: 'tt0816692' },
    source: 'metadata',
    sourceId: 'tmdb',
    popularity: 95,
    updatedAt: Date.now(),
    ...overrides,
  }
}

describe('SearchEngine', () => {
  let engine: SearchEngine
  let repo: SearchIndexRepository

  beforeEach(async () => {
    const storage = new MemorySearchStorage()
    await storage.clear()
    repo = new SearchIndexRepository(storage)
    engine = new SearchEngine(repo)
  })

  function seed(...docs: SearchDocument[]) {
    repo.saveDocuments(docs)
  }

  // ─── Basic Search ───

  it('should return search results for matching query', () => {
    seed(makeDoc({ id: '1', title: 'Interstellar' }))
    const response = engine.search('interstellar')
    expect(response.items).toHaveLength(1)
    expect(response.items[0].doc.id).toBe('1')
    expect(response.total).toBe(1)
    expect(response.hasMore).toBe(false)
    expect(response.searchTimeMs).toBeGreaterThanOrEqual(0)
  })

  it('should return empty for no match', () => {
    seed(makeDoc({ id: '1', title: 'Interstellar' }))
    const response = engine.search('nonexistent')
    expect(response.items).toHaveLength(0)
    expect(response.total).toBe(0)
  })

  it('should return all for empty query', () => {
    seed(
      makeDoc({ id: '1', title: 'A' }),
      makeDoc({ id: '2', title: 'B' }),
    )
    const response = engine.search('')
    expect(response.total).toBe(2)
  })

  // ─── Pagination ───

  it('should paginate results with limit', () => {
    const docs = Array.from({ length: 50 }, (_, i) =>
      makeDoc({ id: `doc-${i}`, title: `Movie ${i}` }),
    )
    seed(...docs)

    const response = engine.search('movie', { limit: 10 })
    expect(response.items).toHaveLength(10)
    expect(response.total).toBe(50)
    expect(response.hasMore).toBe(true)
  })

  it('should support offset', () => {
    const docs = Array.from({ length: 30 }, (_, i) =>
      makeDoc({ id: `doc-${i}`, title: `Movie ${i}` }),
    )
    seed(...docs)

    const page1 = engine.search('movie', { limit: 10, offset: 0 })
    const page2 = engine.search('movie', { limit: 10, offset: 10 })
    const page3 = engine.search('movie', { limit: 10, offset: 20 })

    expect(page1.items).toHaveLength(10)
    expect(page2.items).toHaveLength(10)
    expect(page3.items).toHaveLength(10)
    expect(page3.hasMore).toBe(false)
    // Results should be different across pages
    expect(page1.items[0].doc.id).not.toBe(page2.items[0].doc.id)
  })

  it('should apply minScore filter', () => {
    seed(
      makeDoc({ id: '1', title: 'Movie' }),            // exact match → +100
      makeDoc({ id: '2', title: 'Some Other Thing' }),  // no match → 0
    )
    const response = engine.search('movie', { minScore: 100 })
    expect(response.items).toHaveLength(1)
    expect(response.items[0].doc.id).toBe('1')
  })

  // ─── Type Filter ───

  it('should filter by type', () => {
    seed(
      makeDoc({ id: '1', type: SearchDocumentType.MOVIE, title: 'Movie A' }),
      makeDoc({ id: '2', type: SearchDocumentType.TV, title: 'TV A' }),
      makeDoc({ id: '3', type: SearchDocumentType.MOVIE, title: 'Movie B' }),
    )
    const response = engine.search('', { type: SearchDocumentType.MOVIE })
    expect(response.items).toHaveLength(2)
  })

  // ─── Source Filter ───

  it('should filter by sources', () => {
    seed(
      makeDoc({ id: '1', source: 'metadata', title: 'M1' }),
      makeDoc({ id: '2', source: 'server', title: 'S1' }),
      makeDoc({ id: '3', source: 'local', title: 'L1' }),
    )
    const response = engine.search('', { sources: ['metadata', 'local'] })
    expect(response.items).toHaveLength(2)
  })

  // ─── Convenience Methods ───

  it('should search by title', () => {
    seed(
      makeDoc({ id: '1', title: 'Interstellar' }),
      makeDoc({ id: '2', title: 'Interstellar 2' }),
    )
    const results = engine.searchByTitle('interstellar')
    expect(results).toHaveLength(2)
    // Exact match first
    expect(results[0].doc.id).toBe('1')
  })

  it('should search by genre', () => {
    seed(
      makeDoc({ id: '1', genres: ['Action'], title: 'Action Movie' }),
      makeDoc({ id: '2', genres: ['Comedy'], title: 'Comedy Film' }),
    )
    const results = engine.searchByGenre('action')
    expect(results).toHaveLength(1)
    expect(results[0].doc.id).toBe('1')
  })

  it('should search by tag', () => {
    seed(
      makeDoc({ id: '1', tags: ['nolan'], title: 'Interstellar' }),
      makeDoc({ id: '2', tags: ['tarantino'], title: 'Pulp Fiction' }),
    )
    const results = engine.searchByTag('nolan')
    expect(results).toHaveLength(1)
  })

  // ─── Aggregated Search ───

  it('should aggregate results by contentId', () => {
    seed(
      makeDoc({ id: 'tmdb-is', contentId: 'tmdb:157336', title: 'Interstellar', source: 'metadata', sourceId: 'tmdb', score: undefined, popularity: 95 }),
      makeDoc({ id: 'jf-is', contentId: 'tmdb:157336', title: 'Interstellar', source: 'server', sourceId: 'jellyfin-1', score: undefined, popularity: 95 }),
      makeDoc({ id: 'local-is', contentId: 'tmdb:157336', title: 'Interstellar', source: 'local', sourceId: 'local-library', score: undefined, popularity: 95 }),
      makeDoc({ id: 'tmdb-bb', contentId: 'tmdb:1396', title: 'Breaking Bad', source: 'metadata', sourceId: 'tmdb', score: undefined, popularity: 90 }),
    )

    const result = engine.aggregatedSearch('', { minScore: 0 })
    expect(result.uniqueContentCount).toBe(2)
    expect(result.rawDocumentCount).toBe(4)

    // Interstellar should have 3 sources
    const interstellar = result.items.find(i => i.contentId === 'tmdb:157336')
    expect(interstellar).toBeDefined()
    expect(interstellar!.sources).toHaveLength(3)
    expect(interstellar!.availableOnServers).toBe(true)
    expect(interstellar!.availableLocally).toBe(true)

    // Breaking Bad should be alone
    const bb = result.items.find(i => i.contentId === 'tmdb:1396')
    expect(bb).toBeDefined()
    expect(bb!.sources).toHaveLength(1)
  })
})
