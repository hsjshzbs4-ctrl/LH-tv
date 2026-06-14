// tests/unit/content-ecosystem/search-facade.spec.ts — CE7 SearchFacade tests

import { describe, it, expect, beforeEach } from 'vitest'
import { SearchFacade, searchFacade } from '@/core/content-ecosystem/search/facade/SearchFacade'
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
  ) {}

  isAvailable(): boolean { return true }
  async getDocuments(): Promise<SearchDocument[]> { return this.docs }
}

describe('SearchFacade', () => {
  // ─── Singleton ───

  it('should export a singleton', () => {
    expect(searchFacade).toBeInstanceOf(SearchFacade)
  })

  // ─── Configure + Basic Use ───

  it('should throw if used before configuration', async () => {
    const facade = new SearchFacade()
    expect(() => facade.search('test')).toThrow('[SearchFacade]')
  })

  it('should work after configuration', async () => {
    const facade = new SearchFacade()
    const storage = new MemorySearchStorage()
    await storage.clear()

    facade.configure([
      new MockDataSource('ds', 'metadata', [
        makeDoc({ id: '1', title: 'My Movie' }),
      ]),
    ], storage)

    await facade.initialize()
    await facade.buildIndex()

    const response = facade.search('my')
    expect(response.items).toHaveLength(1)
    expect(response.items[0].doc.title).toBe('My Movie')
  })

  it('should support aggregated search', async () => {
    const facade = new SearchFacade()
    const storage = new MemorySearchStorage()
    await storage.clear()

    facade.configure([
      new MockDataSource('ds', 'metadata', [
        makeDoc({ id: '1', contentId: 'tmdb:1', title: 'Same Content', source: 'metadata' }),
        makeDoc({ id: '2', contentId: 'tmdb:1', title: 'Same Content', source: 'server' }),
        makeDoc({ id: '3', contentId: 'tmdb:2', title: 'Other Content', source: 'local' }),
      ]),
    ], storage)

    await facade.buildIndex()
    const result = facade.aggregatedSearch('', { minScore: 0 })
    expect(result.uniqueContentCount).toBe(2)
    expect(result.rawDocumentCount).toBe(3)
  })

  it('should return stats', async () => {
    const facade = new SearchFacade()
    const storage = new MemorySearchStorage()
    await storage.clear()

    facade.configure([
      new MockDataSource('ds', 'metadata', [makeDoc()]),
    ], storage)

    await facade.buildIndex()
    const stats = facade.getStats()
    expect(stats.totalDocuments).toBe(1)
    expect(stats.buildTimeMs).toBeGreaterThanOrEqual(0)
  })

  it('should rebuild index', async () => {
    const facade = new SearchFacade()
    const storage = new MemorySearchStorage()
    await storage.clear()

    facade.configure([
      new MockDataSource('ds', 'metadata', [makeDoc()]),
    ], storage)

    const stats = await facade.rebuildIndex()
    expect(stats.totalDocuments).toBe(1)
  })

  it('should clear index', async () => {
    const facade = new SearchFacade()
    const storage = new MemorySearchStorage()
    await storage.clear()

    facade.configure([
      new MockDataSource('ds', 'metadata', [makeDoc()]),
    ], storage)

    await facade.buildIndex()
    await facade.clearIndex()
    expect(facade.getStats().totalDocuments).toBe(0)
  })

  it('should support subscribers', async () => {
    const facade = new SearchFacade()
    const storage = new MemorySearchStorage()
    await storage.clear()

    facade.configure([
      new MockDataSource('ds', 'metadata', [makeDoc()]),
    ], storage)

    let notified = false
    const unsub = facade.subscribe(() => { notified = true })

    await facade.buildIndex()
    expect(notified).toBe(true)

    notified = false
    unsub()
    await facade.rebuildIndex()
    expect(notified).toBe(false)
  })
})
