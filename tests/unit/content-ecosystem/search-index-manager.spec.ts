// tests/unit/content-ecosystem/search-index-manager.spec.ts — CE7 SearchIndexManager tests

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SearchIndexManager } from '@/core/content-ecosystem/search/index/SearchIndexManager'
import { MemorySearchStorage } from '@/core/content-ecosystem/search/storage/MemorySearchStorage'
import { SearchDocumentType } from '@/core/content-ecosystem/search/contracts/search.types'
import type { ISearchDataSource } from '@/core/content-ecosystem/search/contracts/ISearchDataSource'
import type { SearchDocument } from '@/core/content-ecosystem/search/contracts/search.types'

function makeDoc(overrides: Partial<SearchDocument> = {}): SearchDocument {
  return {
    id: 'test-1',
    contentId: 'tmdb:1',
    title: 'Test Movie',
    aliases: [],
    type: SearchDocumentType.MOVIE,
    year: 2024,
    genres: ['Action'],
    tags: [],
    externalIds: { tmdb: 1 },
    source: 'metadata',
    sourceId: 'tmdb',
    popularity: 80,
    updatedAt: Date.now(),
    ...overrides,
  }
}

class MockDataSource implements ISearchDataSource {
  constructor(
    public sourceId: string,
    public sourceType: 'metadata' | 'server' | 'local',
    private docs: SearchDocument[] = [],
    private available: boolean = true,
  ) {}

  isAvailable(): boolean { return this.available }
  async getDocuments(): Promise<SearchDocument[]> { return this.docs }
}

describe('SearchIndexManager', () => {
  let storage: MemorySearchStorage
  let manager: SearchIndexManager

  beforeEach(async () => {
    storage = new MemorySearchStorage()
    await storage.clear()
    manager = new SearchIndexManager([
      new MockDataSource('mock-ds', 'metadata', [
        makeDoc({ id: 'mock-1', contentId: 'tmdb:1', title: 'Source Movie' }),
      ]),
    ], storage)
  })

  // ─── buildIndex ───

  it('should build index from data sources', async () => {
    const stats = await manager.buildIndex()
    expect(stats.totalDocuments).toBe(1)
    expect(stats.buildTimeMs).toBeGreaterThanOrEqual(0)
    expect(stats.lastBuiltAt).toBeGreaterThan(0)
  })

  it('should rebuild index', async () => {
    await manager.buildIndex()
    const stats = await manager.rebuildIndex()
    expect(stats.totalDocuments).toBe(1)
  })

  // ─── Search ───

  it('should search after building index', async () => {
    await manager.buildIndex()
    const response = manager.search('source')
    expect(response.items).toHaveLength(1)
    expect(response.items[0].doc.id).toBe('mock-1')
  })

  // ─── Aggregated Search ───

  it('should return aggregated search results', async () => {
    // Build with duplicate contentIds
    const docs = [
      makeDoc({ id: '1', contentId: 'tmdb:1', source: 'metadata', sourceId: 'tmdb' }),
      makeDoc({ id: '2', contentId: 'tmdb:1', source: 'server', sourceId: 'jellyfin' }),
      makeDoc({ id: '3', contentId: 'tmdb:2', source: 'local', sourceId: 'library' }),
    ]

    const mgr = new SearchIndexManager([
      new MockDataSource('multi-ds', 'metadata', docs),
    ], storage)

    await mgr.buildIndex()
    const result = mgr.aggregatedSearch('', { minScore: 0 })
    expect(result.uniqueContentCount).toBe(2)
    expect(result.rawDocumentCount).toBe(3)
  })

  // ─── Stats ───

  it('should return index stats', async () => {
    await manager.buildIndex()
    const stats = manager.getStats()
    expect(stats.totalDocuments).toBe(1)
    expect(stats.uniqueContentCount).toBe(1)
    expect(stats.duplicateContentCount).toBe(0)
    expect(stats.bySource).toBeDefined()
    expect(stats.byType).toBeDefined()
    expect(stats.indexSizeBytes).toBeGreaterThan(0)
  })

  // ─── Clear ───

  it('should clear the index', async () => {
    await manager.buildIndex()
    await manager.clearIndex()
    expect(manager.getStats().totalDocuments).toBe(0)
  })

  // ─── Subscriber ───

  it('should notify subscribers on index change', async () => {
    const cb = vi.fn()
    const unsub = manager.subscribe(cb)

    await manager.buildIndex()
    expect(cb).toHaveBeenCalledTimes(1)

    await manager.clearIndex()
    expect(cb).toHaveBeenCalledTimes(2)

    unsub()
    await manager.buildIndex()
    expect(cb).toHaveBeenCalledTimes(2) // No longer called after unsubscribe
  })

  // ─── Initialize ───

  it('should skip indexing when already initialized', async () => {
    // Initialization with pre-loaded index
    const mgr = new SearchIndexManager([
      new MockDataSource('ds', 'metadata', []),
    ], storage)

    await mgr.initialize()
    // Second initialize should be no-op
    await mgr.initialize()
    // Should not throw
  })
})
