// tests/unit/search-unified/unified-search-runtime.spec.ts — CE8-C2 Runtime tests

import { describe, it, expect, beforeEach } from 'vitest'
import { UnifiedSearchRuntime } from '@/modules/search-unified/infrastructure/services/UnifiedSearchRuntime'
import { SearchProviderRegistry } from '@/modules/search-unified/infrastructure/services/SearchProviderRegistry'
import { ProviderPriorityManager } from '@/modules/search-unified/infrastructure/services/ProviderPriorityManager'
import { SearchProviderMetrics } from '@/modules/search-unified/infrastructure/metrics/SearchProviderMetrics'
import { SearchHealthMonitor } from '@/modules/search-unified/infrastructure/services/SearchHealthMonitor'
import type { ISearchProviderPort } from '@/modules/search-unified/application/ports/ISearchProviderPort'
import type { SearchDocument } from '@/modules/search-unified/domain/contracts/ISearchProvider'
import { SearchQuery } from '@/modules/search-unified/domain/value-objects/SearchQuery'

function makeDoc(id: string): SearchDocument {
  return { id, contentId: `tmdb:${id}`, title: `Movie ${id}`, type: 'movie', genres: [], externalIds: { tmdb: parseInt(id) }, source: 'metadata', sourceId: 'tmdb', popularity: 50 }
}

describe('UnifiedSearchRuntime', () => {
  let registry: SearchProviderRegistry
  let metrics: SearchProviderMetrics
  let health: SearchHealthMonitor
  let priority: ProviderPriorityManager
  let runtime: UnifiedSearchRuntime

  beforeEach(() => {
    registry = new SearchProviderRegistry()
    metrics = new SearchProviderMetrics()
    health = new SearchHealthMonitor()
    priority = new ProviderPriorityManager()
    runtime = new UnifiedSearchRuntime(registry, priority, metrics, health)
  })

  it('should execute search across providers', async () => {
    const p = { providerId: 'tmdb', isAvailable: () => true, search: async (_q: SearchQuery) => [makeDoc('1')] }
    registry.register(p)
    const result = await runtime.execute('test')
    expect(result.documents).toHaveLength(1)
    expect(result.providerResults).toHaveLength(1)
    expect(result.providerResults[0].succeeded).toBe(true)
  })

  it('should handle partial failure', async () => {
    registry.register({ providerId: 'good', isAvailable: () => true, search: async () => [makeDoc('1')] })
    registry.register({ providerId: 'bad', isAvailable: () => true, search: async () => { throw new Error('Down') } })

    const result = await runtime.execute('test')
    expect(result.documents).toHaveLength(1)
    expect(result.providerResults).toHaveLength(2)
    expect(result.providerResults.find(r => r.providerId === 'bad')?.succeeded).toBe(false)
  })

  it('should skip offline providers', async () => {
    health.recordFailure('bad')
    health.recordFailure('bad')
    health.recordFailure('bad')
    health.recordFailure('bad')
    health.recordFailure('bad') // 5 failures → offline

    registry.register({ providerId: 'bad', isAvailable: () => true, search: async () => [makeDoc('1')] })
    registry.register({ providerId: 'good', isAvailable: () => true, search: async () => [makeDoc('2')] })

    const result = await runtime.execute('test')
    expect(result.providerResults).toHaveLength(1)
    expect(result.providerResults[0].providerId).toBe('good')
  })

  it('should handle empty query', async () => {
    const result = await runtime.execute('')
    expect(result.documents).toHaveLength(0)
  })
})
