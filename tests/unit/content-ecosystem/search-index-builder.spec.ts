// tests/unit/content-ecosystem/search-index-builder.spec.ts — CE7 SearchIndexBuilder tests

import { describe, it, expect, beforeEach } from 'vitest'
import { SearchIndexBuilder } from '@/core/content-ecosystem/search/index/SearchIndexBuilder'
import { SearchDocumentType } from '@/core/content-ecosystem/search/contracts/search.types'
import type { ISearchDataSource } from '@/core/content-ecosystem/search/contracts/ISearchDataSource'
import type { SearchDocument } from '@/core/content-ecosystem/search/contracts/search.types'

function makeDoc(overrides: Partial<SearchDocument> = {}): SearchDocument {
  return {
    id: 'test-1',
    contentId: 'tmdb:1',
    title: 'Test',
    aliases: [],
    type: SearchDocumentType.MOVIE,
    year: 2024,
    genres: [],
    tags: [],
    externalIds: { tmdb: 1 },
    source: 'metadata',
    sourceId: 'tmdb',
    popularity: 80,
    updatedAt: Date.now(),
    ...overrides,
  }
}

/** Mock ISearchDataSource for testing */
class MockDataSource implements ISearchDataSource {
  constructor(
    public sourceId: string,
    public sourceType: 'metadata' | 'server' | 'local',
    private docs: SearchDocument[] = [],
    private available: boolean = true,
    private shouldThrow: boolean = false,
  ) {}

  isAvailable(): boolean {
    return this.available
  }

  async getDocuments(): Promise<SearchDocument[]> {
    if (this.shouldThrow) throw new Error('Mock source error')
    return this.docs
  }
}

describe('SearchIndexBuilder', () => {
  // ─── rebuildAll ───

  it('should rebuild from all available data sources', async () => {
    const ds1 = new MockDataSource('tmdb-ds', 'metadata', [
      makeDoc({ id: 'tmdb-1', source: 'metadata', sourceId: 'tmdb-ds' }),
    ])
    const ds2 = new MockDataSource('local-ds', 'local', [
      makeDoc({ id: 'local-1', source: 'local', sourceId: 'local-ds' }),
    ])
    const builder = new SearchIndexBuilder([ds1, ds2])

    const docs = await builder.rebuildAll()
    expect(docs).toHaveLength(2)
    expect(docs.map(d => d.source).sort()).toEqual(['local', 'metadata'])
  })

  it('should skip unavailable data sources', async () => {
    const ds1 = new MockDataSource('ds1', 'metadata', [
      makeDoc({ id: '1' }),
    ], true) // available
    const ds2 = new MockDataSource('ds2', 'server', [
      makeDoc({ id: '2' }),
    ], false) // unavailable
    const builder = new SearchIndexBuilder([ds1, ds2])

    const docs = await builder.rebuildAll()
    expect(docs).toHaveLength(1)
    expect(docs[0].id).toBe('1')
  })

  it('should handle data source errors gracefully', async () => {
    const ds1 = new MockDataSource('ds1', 'metadata', [
      makeDoc({ id: '1' }),
    ], true, false) // available, no error
    const ds2 = new MockDataSource('ds2', 'server', [], true, true) // available, throws
    const builder = new SearchIndexBuilder([ds1, ds2])

    const docs = await builder.rebuildAll()
    // Should still get docs from ds1 even though ds2 throws
    expect(docs).toHaveLength(1)
    expect(docs[0].id).toBe('1')
  })

  it('should return empty when no data sources available', async () => {
    const ds1 = new MockDataSource('ds1', 'metadata', [], false)
    const builder = new SearchIndexBuilder([ds1])
    const docs = await builder.rebuildAll()
    expect(docs).toHaveLength(0)
  })

  it('should return empty when no data sources configured', async () => {
    const builder = new SearchIndexBuilder([])
    const docs = await builder.rebuildAll()
    expect(docs).toHaveLength(0)
  })

  // ─── buildFromSource ───

  it('should build from a specific source', async () => {
    const ds1 = new MockDataSource('tmdb-ds', 'metadata', [
      makeDoc({ id: 'tmdb-1', sourceId: 'tmdb-ds' }),
    ])
    const ds2 = new MockDataSource('local-ds', 'local', [
      makeDoc({ id: 'local-1', sourceId: 'local-ds' }),
    ])
    const builder = new SearchIndexBuilder([ds1, ds2])

    const docs = await builder.buildFromSource('tmdb-ds')
    expect(docs).toHaveLength(1)
    expect(docs[0].sourceId).toBe('tmdb-ds')
  })

  it('should return empty for non-existent source', async () => {
    const builder = new SearchIndexBuilder([])
    const docs = await builder.buildFromSource('nope')
    expect(docs).toHaveLength(0)
  })
})
