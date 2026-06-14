// tests/unit/search-unified/infrastructure-diagnostics.spec.ts — CE8-C2 Diagnostics tests

import { describe, it, expect, beforeEach } from 'vitest'
import { InfrastructureDiagnostics } from '@/modules/search-unified/infrastructure/services/InfrastructureDiagnostics'
import { SearchProviderRegistry } from '@/modules/search-unified/infrastructure/services/SearchProviderRegistry'
import { SearchProviderMetrics } from '@/modules/search-unified/infrastructure/metrics/SearchProviderMetrics'
import { SearchHealthMonitor } from '@/modules/search-unified/infrastructure/services/SearchHealthMonitor'
import type { ISearchProviderPort } from '@/modules/search-unified/application/ports/ISearchProviderPort'
import type { SearchDocument } from '@/modules/search-unified/domain/contracts/ISearchProvider'
import { SearchQuery } from '@/modules/search-unified/domain/value-objects/SearchQuery'

function mock(id: string, available = true): ISearchProviderPort {
  return { providerId: id, isAvailable: () => available, search: async (_q: SearchQuery): Promise<SearchDocument[]> => [] }
}

describe('InfrastructureDiagnostics', () => {
  let registry: SearchProviderRegistry
  let metrics: SearchProviderMetrics
  let health: SearchHealthMonitor
  let diagnostics: InfrastructureDiagnostics

  beforeEach(() => {
    registry = new SearchProviderRegistry()
    metrics = new SearchProviderMetrics()
    health = new SearchHealthMonitor()
    diagnostics = new InfrastructureDiagnostics(registry, metrics, health)
  })

  it('should dump complete snapshot', () => {
    registry.register(mock('tmdb'))
    metrics.recordSuccess('tmdb', 42)
    health.recordSuccess('tmdb')

    const snapshot = diagnostics.dump()
    expect(snapshot.providers).toHaveLength(1)
    expect(snapshot.health).toHaveLength(1)
    expect(snapshot.metrics.totalCalls).toBe(1)
    expect(snapshot.timestamp).toBeGreaterThan(0)
  })

  it('should dump providers', () => {
    registry.register(mock('tmdb', true))
    registry.register(mock('jellyfin', false))
    const providers = diagnostics.dumpProviders()
    expect(providers).toHaveLength(2)
    expect(providers[0].available).toBe(true)
    expect(providers[1].available).toBe(false)
  })

  it('should dump health', () => {
    health.recordFailure('tmdb')
    health.recordFailure('tmdb')
    health.recordFailure('tmdb')
    const healthDiag = diagnostics.dumpHealth()
    expect(healthDiag).toHaveLength(1)
    expect(healthDiag[0].status).toBe('degraded')
    expect(healthDiag[0].consecutiveFailures).toBe(3)
  })

  it('should dump metrics', () => {
    metrics.recordSuccess('tmdb', 42)
    const m = diagnostics.dumpMetrics()
    expect(m.totalCalls).toBe(1)
    expect(m.providerStats.has('tmdb')).toBe(true)
  })
})
