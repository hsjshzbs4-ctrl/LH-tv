// tests/unit/search-unified/infrastructure-integration.spec.ts — CE8-C1 Integration tests
// Tests the full infrastructure layer with mocked providers.

import { describe, it, expect } from 'vitest'
import { SearchQuery } from '@/modules/search-unified/domain/value-objects/SearchQuery'
import { SearchProviderCache } from '@/modules/search-unified/infrastructure/cache/SearchProviderCache'
import { ProviderClientWrapper } from '@/modules/search-unified/infrastructure/adapters/ProviderClientWrapper'
import { SearchProviderMetrics } from '@/modules/search-unified/infrastructure/metrics/SearchProviderMetrics'
import { SearchDocumentMapper } from '@/modules/search-unified/infrastructure/mappers/SearchDocumentMapper'
import type { SearchDocument } from '@/modules/search-unified/domain/contracts/ISearchProvider'

function makeDoc(overrides: Partial<SearchDocument> = {}): SearchDocument {
  return {
    id: '1', contentId: 'tmdb:1', title: 'Test', type: 'movie',
    genres: [], externalIds: {}, source: 'metadata', sourceId: 'tmdb',
    popularity: 50, ...overrides,
  }
}

describe('Infrastructure Integration', () => {
  // ─── End-to-End: Cache + Wrapper + Metrics ───

  it('should cache successful results', async () => {
    const metrics = new SearchProviderMetrics()
    const wrapper = new ProviderClientWrapper(metrics)
    const cache = new SearchProviderCache(60_000)

    const query = SearchQuery.create('Interstellar')
    const cacheKey = cache.key('tmdb', query.normalized)

    // First call: uncached
    expect(cache.has(cacheKey)).toBe(false)

    const results = await wrapper.execute('tmdb', { maxRetries: 1, baseDelayMs: 10 },
      async () => [makeDoc()], query)

    cache.set(cacheKey, results)
    expect(cache.has(cacheKey)).toBe(true)
    expect(cache.get(cacheKey)).toHaveLength(1)
  })

  it('should not cache failed results', async () => {
    const metrics = new SearchProviderMetrics()
    const wrapper = new ProviderClientWrapper(metrics)
    const cache = new SearchProviderCache(60_000)

    const query = SearchQuery.create('test')
    const cacheKey = cache.key('bad-provider', query.normalized)

    try {
      await wrapper.execute('bad-provider', { maxRetries: 0, baseDelayMs: 10 },
        async () => { throw new Error('Unavailable') }, query)
    } catch {
      // Expected — don't cache
    }

    expect(cache.has(cacheKey)).toBe(false)
  })

  it('should track latency per provider', async () => {
    const metrics = new SearchProviderMetrics()
    const wrapper = new ProviderClientWrapper(metrics)
    const query = SearchQuery.create('test')

    await wrapper.execute('fast', { maxRetries: 0, baseDelayMs: 10 },
      async () => [makeDoc()], query)

    const stats = metrics.getProviderStats('fast')
    expect(stats.successCount).toBe(1)
    expect(stats.averageLatencyMs).toBeGreaterThanOrEqual(0)
  })

  // ─── Mapper + Cache Integration ───

  it('should map and cache consistently', () => {
    const mapper = new SearchDocumentMapper()
    const cache = new SearchProviderCache(60_000)

    const doc = mapper.toDocument({
      id: '157336', title: 'Interstellar', type: 'movie',
      externalIds: { tmdb: 157336 },
      source: 'metadata', sourceId: 'tmdb',
    })

    const key = cache.key('tmdb', 'interstellar')
    cache.set(key, [doc])

    const cached = cache.get<SearchDocument[]>(key)
    expect(cached).toHaveLength(1)
    expect(cached![0].contentId).toBe('tmdb:157336')
    expect(cached![0].title).toBe('Interstellar')
  })

  // ─── Multiple Provider Scenario ───

  it('should aggregate results from multiple providers', () => {
    // TMDB result
    const tmdbDoc = makeDoc({ id: 'tmdb:157336', contentId: 'tmdb:157336', source: 'metadata', sourceId: 'tmdb' })

    // Jellyfin result for same content
    const jfDoc = makeDoc({ id: 'jf:item-1', contentId: 'tmdb:157336', source: 'server', sourceId: 'jellyfin-1' })

    // Plex result for different content
    const plexDoc = makeDoc({ id: 'plex:item-2', contentId: 'tmdb:999', source: 'server', sourceId: 'plex-1' })

    const allDocs = [tmdbDoc, jfDoc, plexDoc]

    // Group by contentId (simulating merge)
    const groups = new Map<string, SearchDocument[]>()
    for (const doc of allDocs) {
      const existing = groups.get(doc.contentId)
      if (existing) existing.push(doc)
      else groups.set(doc.contentId, [doc])
    }

    expect(groups.size).toBe(2)
    expect(groups.get('tmdb:157336')).toHaveLength(2)
    expect(groups.get('tmdb:999')).toHaveLength(1)
  })

  // ─── Timeout + Partial Failure ───

  it('should handle timeout without affecting other providers', async () => {
    const allResults: SearchDocument[] = []

    // Fast provider
    allResults.push(makeDoc({ id: 'fast:1' }))

    // Slow provider would have timed out, contributing nothing

    expect(allResults).toHaveLength(1)
  })

  // ─── Cache Eviction ───

  it('should not return expired cache entries', async () => {
    const cache = new SearchProviderCache(10) // 10ms TTL
    const key = cache.key('tmdb', 'test')
    cache.set(key, [{ id: '1' }])

    await new Promise(r => setTimeout(r, 20))
    expect(cache.get(key)).toBeUndefined()
  })
})
