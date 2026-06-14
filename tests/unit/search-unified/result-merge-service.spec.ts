// tests/unit/search-unified/result-merge-service.spec.ts — CE8-A ResultMergeService tests

import { describe, it, expect } from 'vitest'
import { ResultMergeService } from '@/modules/search-unified/domain/services/ResultMergeService'
import type { SearchDocument } from '@/modules/search-unified/domain/contracts/ISearchProvider'

function makeDoc(overrides: Partial<SearchDocument> = {}): SearchDocument {
  return {
    id: 'doc-1',
    contentId: 'tmdb:157336',
    title: 'Interstellar',
    type: 'movie',
    year: 2014,
    genres: ['Sci-Fi', 'Adventure'],
    externalIds: { tmdb: 157336, imdb: 'tt0816692' },
    source: 'metadata',
    sourceId: 'tmdb',
    popularity: 95,
    ...overrides,
  }
}

describe('ResultMergeService', () => {
  const service = new ResultMergeService()

  it('should merge single document into single result', () => {
    const docs = [makeDoc()]
    const results = service.merge(docs)
    expect(results).toHaveLength(1)
    expect(results[0].title).toBe('Interstellar')
    expect(results[0].contentId.value).toBe('tmdb:157336')
  })

  it('should deduplicate by contentId', () => {
    const docs = [
      makeDoc({ id: 'tmdb-1', source: 'metadata', sourceId: 'tmdb' }),
      makeDoc({ id: 'jf-1', source: 'server', sourceId: 'jellyfin-1', popularity: 90 }),
      makeDoc({ id: 'plx-1', source: 'server', sourceId: 'plex-1', popularity: 85 }),
      makeDoc({ id: 'local-1', source: 'local', sourceId: 'local-library', popularity: 80 }),
    ]
    const results = service.merge(docs)
    // All 4 docs share contentId 'tmdb:157336' → 1 result
    expect(results).toHaveLength(1)
    expect(results[0].sourceCount).toBe(4)
  })

  it('should merge genres from all sources', () => {
    const docs = [
      makeDoc({ id: '1', genres: ['Sci-Fi'], sourceId: 'tmdb' }),
      makeDoc({ id: '2', genres: ['Adventure', 'Drama'], sourceId: 'jellyfin-1' }),
    ]
    const results = service.merge(docs)
    expect(results[0].genres).toContain('Sci-Fi')
    expect(results[0].genres).toContain('Adventure')
    expect(results[0].genres).toContain('Drama')
    expect(results[0].genres).toHaveLength(3)
  })

  it('should use best document metadata', () => {
    const docs = [
      makeDoc({ id: '1', title: 'Interstellar (2014)', popularity: 50 }),
      makeDoc({ id: '2', title: 'Interstellar', popularity: 95 }),
    ]
    const results = service.merge(docs)
    expect(results[0].title).toBe('Interstellar') // From higher popularity doc
  })

  it('should separate different contentIds', () => {
    const docs = [
      makeDoc({ id: '1', contentId: 'tmdb:157336', title: 'Interstellar' }),
      makeDoc({ id: '2', contentId: 'tmdb:1396', title: 'Breaking Bad', type: 'tv' }),
    ]
    const results = service.merge(docs)
    expect(results).toHaveLength(2)
    const titles = results.map(r => r.title).sort()
    expect(titles).toEqual(['Breaking Bad', 'Interstellar'])
  })

  it('should handle empty document array', () => {
    const results = service.merge([])
    expect(results).toHaveLength(0)
  })

  it('should assign sources correctly', () => {
    const docs = [
      makeDoc({ id: '1', source: 'metadata', sourceId: 'tmdb' }),
      makeDoc({ id: '2', source: 'server', sourceId: 'jellyfin-1' }),
      makeDoc({ id: '3', source: 'local', sourceId: 'local-library' }),
    ]
    const results = service.merge(docs)
    const result = results[0]
    expect(result.sourceTypes).toContain('tmdb')
    expect(result.sourceTypes).toContain('jellyfin')
    expect(result.sourceTypes).toContain('local')
  })

  it('should build availability for merge result', () => {
    const docs = [
      makeDoc({ id: '1', source: 'local', sourceId: 'local-library' }),
      makeDoc({ id: '2', source: 'server', sourceId: 'jellyfin-1' }),
      makeDoc({ id: '3', source: 'metadata', sourceId: 'tmdb' }),
    ]
    const results = service.merge(docs)
    expect(results[0].availability.playable).toBe(true)
    expect(results[0].availability.localAvailable).toBe(true)
  })
})
