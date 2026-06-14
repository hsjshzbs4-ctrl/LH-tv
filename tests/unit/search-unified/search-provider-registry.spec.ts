// tests/unit/search-unified/search-provider-registry.spec.ts — CE8-C2 Registry tests

import { describe, it, expect, beforeEach } from 'vitest'
import { SearchProviderRegistry } from '@/modules/search-unified/infrastructure/services/SearchProviderRegistry'
import type { ISearchProviderPort } from '@/modules/search-unified/application/ports/ISearchProviderPort'
import type { SearchDocument } from '@/modules/search-unified/domain/contracts/ISearchProvider'
import { SearchQuery } from '@/modules/search-unified/domain/value-objects/SearchQuery'

function mockProvider(id: string, available = true): ISearchProviderPort {
  return {
    providerId: id,
    isAvailable: () => available,
    search: async (_q: SearchQuery): Promise<SearchDocument[]> => [],
  }
}

describe('SearchProviderRegistry', () => {
  let registry: SearchProviderRegistry

  beforeEach(() => { registry = new SearchProviderRegistry() })

  it('should register and retrieve a provider', () => {
    const p = mockProvider('tmdb')
    registry.register(p)
    expect(registry.getProvider('tmdb')).toBe(p)
    expect(registry.providerCount).toBe(1)
  })

  it('should unregister a provider', () => {
    registry.register(mockProvider('tmdb'))
    expect(registry.unregister('tmdb')).toBe(true)
    expect(registry.getProvider('tmdb')).toBeUndefined()
  })

  it('should return false when unregistering non-existent provider', () => {
    expect(registry.unregister('nope')).toBe(false)
  })

  it('should return all providers', () => {
    registry.register(mockProvider('a'))
    registry.register(mockProvider('b'))
    expect(registry.getAllProviders()).toHaveLength(2)
  })

  it('should filter available providers', () => {
    registry.register(mockProvider('a', true))
    registry.register(mockProvider('b', false))
    expect(registry.getAvailableProviders()).toHaveLength(1)
  })

  it('should clear all providers', () => {
    registry.register(mockProvider('a'))
    registry.register(mockProvider('b'))
    registry.clear()
    expect(registry.providerCount).toBe(0)
  })
})
