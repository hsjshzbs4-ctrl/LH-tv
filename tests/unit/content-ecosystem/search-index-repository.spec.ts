// tests/unit/content-ecosystem/search-index-repository.spec.ts — CE7 SearchIndexRepository tests

import { describe, it, expect, beforeEach } from 'vitest'
import { SearchIndexRepository } from '@/core/content-ecosystem/search/index/SearchIndexRepository'
import { MemorySearchStorage } from '@/core/content-ecosystem/search/storage/MemorySearchStorage'
import { SearchDocumentType } from '@/core/content-ecosystem/search/contracts/search.types'
import type { SearchDocument } from '@/core/content-ecosystem/search/contracts/search.types'

function makeDoc(overrides: Partial<SearchDocument> = {}): SearchDocument {
  return {
    id: 'test-1',
    contentId: 'tmdb:123',
    title: 'Test Movie',
    aliases: [],
    type: SearchDocumentType.MOVIE,
    year: 2024,
    genres: ['Action'],
    tags: [],
    externalIds: { tmdb: 123 },
    source: 'metadata',
    sourceId: 'tmdb',
    popularity: 80,
    updatedAt: Date.now(),
    ...overrides,
  }
}

describe('SearchIndexRepository', () => {
  let storage: MemorySearchStorage
  let repo: SearchIndexRepository

  beforeEach(async () => {
    storage = new MemorySearchStorage()
    repo = new SearchIndexRepository(storage)
    await storage.clear()
  })

  // ─── CRUD ───

  it('should save and find a document', () => {
    const doc = makeDoc()
    repo.saveDocument(doc)
    expect(repo.findById(doc.id)).toEqual(doc)
  })

  it('should save multiple documents', () => {
    repo.saveDocuments([
      makeDoc({ id: '1' }),
      makeDoc({ id: '2' }),
      makeDoc({ id: '3' }),
    ])
    expect(repo.getAll()).toHaveLength(3)
  })

  it('should delete a document', () => {
    repo.saveDocument(makeDoc({ id: '1' }))
    expect(repo.deleteDocument('1')).toBe(true)
    expect(repo.findById('1')).toBeUndefined()
    expect(repo.size).toBe(0)
  })

  it('should clear all documents', () => {
    repo.saveDocuments([makeDoc({ id: '1' }), makeDoc({ id: '2' })])
    repo.clear()
    expect(repo.size).toBe(0)
    expect(repo.getAll()).toHaveLength(0)
  })

  // ─── Persistence ───

  it('should persist and load documents', async () => {
    const doc = makeDoc({ id: 'p1' })
    repo.saveDocument(doc)
    await repo.persist()

    // Create a new repo with the same storage
    const repo2 = new SearchIndexRepository(storage)
    await repo2.load()
    expect(repo2.findById('p1')).toBeDefined()
    expect(repo2.size).toBe(1)
  })

  // ─── Filtered Queries ───

  it('should filter by type', () => {
    repo.saveDocuments([
      makeDoc({ id: '1', type: SearchDocumentType.MOVIE }),
      makeDoc({ id: '2', type: SearchDocumentType.TV }),
      makeDoc({ id: '3', type: SearchDocumentType.MOVIE }),
    ])
    const movies = repo.getByType(SearchDocumentType.MOVIE)
    expect(movies).toHaveLength(2)
  })

  it('should filter by source', () => {
    repo.saveDocuments([
      makeDoc({ id: '1', source: 'metadata' }),
      makeDoc({ id: '2', source: 'server' }),
      makeDoc({ id: '3', source: 'local' }),
    ])
    expect(repo.getBySource('metadata')).toHaveLength(1)
  })

  it('should search by tokens', () => {
    repo.saveDocuments([
      makeDoc({ id: '1', title: 'Breaking Bad' }),
      makeDoc({ id: '2', title: 'Breaking Dawn' }),
      makeDoc({ id: '3', title: 'Mad Men' }),
    ])
    const results = repo.searchByTokens(['breaking'])
    expect(results).toHaveLength(2)
  })

  // ─── Stats ───

  it('should compute stats correctly', () => {
    repo.saveDocuments([
      makeDoc({ id: '1', contentId: 'tmdb:1', source: 'metadata', type: SearchDocumentType.MOVIE }),
      makeDoc({ id: '2', contentId: 'tmdb:1', source: 'server', type: SearchDocumentType.MOVIE }),
      makeDoc({ id: '3', contentId: 'tmdb:2', source: 'local', type: SearchDocumentType.TV }),
    ])

    const stats = repo.getStats()
    expect(stats.totalDocuments).toBe(3)
    expect(stats.uniqueContentCount).toBe(2)
    expect(stats.duplicateContentCount).toBe(1)
    expect(stats.bySource['metadata']).toBe(1)
    expect(stats.bySource['server']).toBe(1)
    expect(stats.bySource['local']).toBe(1)
    expect(stats.byType['movie']).toBe(2)
    expect(stats.byType['tv']).toBe(1)
    expect(stats.indexSizeBytes).toBeGreaterThan(0)
  })

  it('should track build time', () => {
    repo.markBuilt(42)
    const stats = repo.getStats()
    expect(stats.buildTimeMs).toBe(42)
    expect(stats.lastBuiltAt).toBeGreaterThan(0)
  })
})
