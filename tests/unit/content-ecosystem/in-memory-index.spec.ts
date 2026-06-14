// tests/unit/content-ecosystem/in-memory-index.spec.ts — CE7 InMemoryIndex unit tests

import { describe, it, expect, beforeEach } from 'vitest'
import { InMemoryIndex } from '@/core/content-ecosystem/search/storage/InMemoryIndex'
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
    overview: 'A team of explorers travel through a wormhole.',
    externalIds: { tmdb: 157336, imdb: 'tt0816692' },
    source: 'metadata',
    sourceId: 'tmdb',
    popularity: 95,
    updatedAt: Date.now(),
    ...overrides,
  }
}

describe('InMemoryIndex', () => {
  let index: InMemoryIndex

  beforeEach(() => {
    index = new InMemoryIndex()
  })

  // ─── Basic CRUD ───

  it('should add and retrieve a document', () => {
    const doc = makeDoc()
    index.add(doc)
    expect(index.get(doc.id)).toEqual(doc)
    expect(index.size).toBe(1)
  })

  it('should remove a document', () => {
    const doc = makeDoc()
    index.add(doc)
    expect(index.remove(doc.id)).toBe(true)
    expect(index.get(doc.id)).toBeUndefined()
    expect(index.size).toBe(0)
  })

  it('should return false when removing non-existent document', () => {
    expect(index.remove('nope')).toBe(false)
  })

  it('should update a document', () => {
    const doc = makeDoc()
    index.add(doc)
    index.update(doc.id, { title: 'Interstellar IMAX' })
    const updated = index.get(doc.id)
    expect(updated?.title).toBe('Interstellar IMAX')
  })

  it('should return false when updating non-existent document', () => {
    expect(index.update('nope', { title: 'x' })).toBe(false)
  })

  it('should clear all documents', () => {
    index.add(makeDoc({ id: '1' }))
    index.add(makeDoc({ id: '2' }))
    index.clear()
    expect(index.size).toBe(0)
    expect(index.getAll()).toHaveLength(0)
  })

  it('should return all documents', () => {
    index.add(makeDoc({ id: '1', title: 'A' }))
    index.add(makeDoc({ id: '2', title: 'B' }))
    expect(index.getAll()).toHaveLength(2)
  })

  // ─── Inverted Index: Title Token Search ───

  it('should find documents by title token', () => {
    index.add(makeDoc({ id: '1', title: 'Breaking Bad', aliases: [] }))
    index.add(makeDoc({ id: '2', title: 'Breaking Dawn', aliases: [] }))
    index.add(makeDoc({ id: '3', title: 'Mad Men', aliases: [] }))

    const results = index.searchByTokens(['breaking'])
    expect(results).toHaveLength(2)
    expect(results.map(d => d.id).sort()).toEqual(['1', '2'])
  })

  it('should find documents by alias token', () => {
    index.add(makeDoc({
      id: '1',
      title: 'Interstellar',
      aliases: ['星际穿越', 'Star Traveler'],
    }))

    const results = index.searchByTokens(['星际穿越'])
    expect(results).toHaveLength(1)
    expect(results[0].id).toBe('1')
  })

  it('should return title-matched documents before alias-matched', () => {
    index.add(makeDoc({ id: '1', title: 'Star Wars', aliases: [] }))
    index.add(makeDoc({ id: '2', title: 'Other Movie', aliases: ['Star Film'] }))

    const results = index.searchByTokens(['star'])
    // title-matched should come first
    expect(results[0].id).toBe('1')
    expect(results).toHaveLength(2)
  })

  it('should handle CJK tokens', () => {
    index.add(makeDoc({ id: '1', title: '進撃の巨人', aliases: [] }))
    index.add(makeDoc({ id: '2', title: '鬼滅の刃', aliases: [] }))

    // CJK tokenization produces character-level tokens for Han/Katakana
    const results = index.searchByTokens(['進', '巨'])
    expect(results).toHaveLength(1)
    expect(results[0].id).toBe('1')
  })

  it('should return empty when no tokens match', () => {
    index.add(makeDoc({ id: '1', title: 'Interstellar' }))
    expect(index.searchByTokens(['nonexistent'])).toHaveLength(0)
  })

  it('should return empty for empty token array', () => {
    index.add(makeDoc())
    expect(index.searchByTokens([])).toHaveLength(0)
  })

  // ─── Genre & Type Index ───

  it('should find documents by genre', () => {
    index.add(makeDoc({ id: '1', genres: ['Action'] }))
    index.add(makeDoc({ id: '2', genres: ['Comedy'] }))
    index.add(makeDoc({ id: '3', genres: ['Action', 'Comedy'] }))

    const action = index.getByGenre('action')
    expect(action).toHaveLength(2)
    expect(action.map(d => d.id).sort()).toEqual(['1', '3'])
  })

  it('should find documents by type', () => {
    index.add(makeDoc({ id: '1', type: SearchDocumentType.MOVIE }))
    index.add(makeDoc({ id: '2', type: SearchDocumentType.TV }))
    index.add(makeDoc({ id: '3', type: SearchDocumentType.MOVIE }))

    const movies = index.getByType(SearchDocumentType.MOVIE)
    expect(movies).toHaveLength(2)
  })

  it('should find documents by source', () => {
    index.add(makeDoc({ id: '1', source: 'metadata' }))
    index.add(makeDoc({ id: '2', source: 'server' }))
    index.add(makeDoc({ id: '3', source: 'local' }))

    expect(index.getBySource('metadata')).toHaveLength(1)
    expect(index.getBySource('server')).toHaveLength(1)
  })

  // ─── Remove cleans up inverted indexes ───

  it('should remove from inverted indexes when document is removed', () => {
    const doc = makeDoc({ id: '1', title: 'Test Movie', genres: ['Action'] })
    index.add(doc)
    index.remove('1')

    expect(index.searchByTokens(['test'])).toHaveLength(0)
    expect(index.getByGenre('action')).toHaveLength(0)
    expect(index.getByType(SearchDocumentType.MOVIE)).toHaveLength(0)
  })

  // ─── Tokenization ───

  it('should tokenize text correctly', () => {
    const tokens = InMemoryIndex.tokenize('The Quick Brown-Fox, 1984')
    expect(tokens).toContain('the')
    expect(tokens).toContain('quick')
    expect(tokens).toContain('brown')
    expect(tokens).toContain('fox')
    expect(tokens).toContain('1984')
  })

  it('should filter single-character tokens', () => {
    const tokens = InMemoryIndex.tokenize('a b c ab cd')
    // 'a', 'b', 'c' filtered out; 'ab', 'cd' kept
    expect(tokens).toEqual(['ab', 'cd'])
  })

  // ─── Performance (10K docs) ───

  it('should search 10K documents in under 50ms', () => {
    for (let i = 0; i < 10000; i++) {
      index.add(makeDoc({
        id: `doc-${i}`,
        title: `Movie Title ${i}`,
        aliases: i % 5 === 0 ? [`Alias ${i}`] : [],
      }))
    }
    // Verify index structure
    expect(index.size).toBe(10000)

    const start = performance.now()
    const results = index.searchByTokens(['movie'])
    const elapsed = performance.now() - start

    expect(results.length).toBeGreaterThan(0)
    expect(elapsed).toBeLessThan(50)
  })
})
