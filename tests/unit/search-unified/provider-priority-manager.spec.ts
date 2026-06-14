// tests/unit/search-unified/provider-priority-manager.spec.ts — CE8-C2 PriorityManager tests

import { describe, it, expect } from 'vitest'
import { ProviderPriorityManager } from '@/modules/search-unified/infrastructure/services/ProviderPriorityManager'
import type { ISearchProviderPort } from '@/modules/search-unified/application/ports/ISearchProviderPort'
import { SearchQuery } from '@/modules/search-unified/domain/value-objects/SearchQuery'
import type { SearchDocument } from '@/modules/search-unified/domain/contracts/ISearchProvider'

function mock(id: string, available = true): ISearchProviderPort {
  return { providerId: id, isAvailable: () => available, search: async (_q: SearchQuery): Promise<SearchDocument[]> => [] }
}

describe('ProviderPriorityManager', () => {
  const manager = new ProviderPriorityManager()

  it('should order by priority: local > jellyfin > plex > emby > tmdb', () => {
    const providers = [
      mock('tmdb-provider'),
      mock('plex-server-1'),
      mock('local-library'),
      mock('jellyfin-main'),
      mock('emby-home'),
    ]
    const ordered = manager.orderByPriority(providers)
    expect(ordered[0].providerId).toBe('local-library')
    expect(ordered[1].providerId).toBe('jellyfin-main')
    expect(ordered[2].providerId).toBe('plex-server-1')
    expect(ordered[3].providerId).toBe('emby-home')
    expect(ordered[4].providerId).toBe('tmdb-provider')
  })

  it('should prioritize available over unavailable within same tier', () => {
    const providers = [
      mock('jellyfin-2', false),
      mock('jellyfin-1', true),
    ]
    const ordered = manager.orderByPriority(providers)
    expect(ordered[0].providerId).toBe('jellyfin-1')
  })

  it('should filter to available only in execution order', () => {
    const providers = [
      mock('tmdb', true),
      mock('plex-down', false),
    ]
    const order = manager.getExecutionOrder(providers)
    expect(order).toHaveLength(1)
    expect(order[0].providerId).toBe('tmdb')
  })
})
