// tests/unit/content-ecosystem/registry.spec.ts — CE2
import { describe, it, expect } from 'vitest'
import { EcosystemProviderRegistry } from '@/core/content-ecosystem/registry/EcosystemProviderRegistry'
import { EcosystemProviderFacade } from '@/core/content-ecosystem/registry/EcosystemProviderFacade'
import type { IMetadataProvider, IMediaServer, MediaItem } from '@provider-contracts'

function mockMetadataProvider(id: string): IMetadataProvider {
  return {
    id, name: `Mock ${id}`, enabled: true, priority: 10,
    search: async () => [],
    getMovie: async () => ({ id, title: 'Mock', cover: '', description: '', providerId: id, episodes: [], type: 'movie', backdrop: '', poster: '', releaseDate: '', runtime: 0, genres: [], overview: '', tagline: '', rating: { average: 0, count: 0 }, cast: [], crew: [], similar: [], externalIds: {} }),
    getSeries: async () => ({ id, title: 'Mock', cover: '', description: '', providerId: id, episodes: [], type: 'tv', backdrop: '', poster: '', firstAirDate: '', lastAirDate: '', status: '', genres: [], overview: '', rating: { average: 0, count: 0 }, seasons: [], cast: [], crew: [], externalIds: {} }),
    getSeason: async () => ({ id, seriesId: id, name: 'S1', seasonNumber: 1, episodeCount: 0, poster: '', overview: '', airDate: '', episodes: [] }),
    getEpisode: async () => ({ id, name: 'E1', title: 'E1', episodeNumber: 1, seasonNumber: 1, overview: '', still: '', airDate: '', runtime: 0, rating: { average: 0, count: 0 } }),
    getPerson: async () => ({ id, name: 'Person', profile: '' }),
    getTrending: async () => [],
    getPopular: async () => [],
    getRecommendations: async () => [],
    healthCheck: async () => true,
  }
}

describe('EcosystemProviderRegistry', () => {
  it('registers and retrieves metadata providers', () => {
    const registry = new EcosystemProviderRegistry()
    const provider = mockMetadataProvider('tmdb')
    registry.registerMetadataProvider(provider)

    expect(registry.count).toBe(1)
    expect(registry.getMetadataProviders()).toHaveLength(1)
    expect(registry.getMetadataProviders()[0].id).toBe('tmdb')
  })

  it('getProvidersByType filters correctly', () => {
    const registry = new EcosystemProviderRegistry()
    registry.registerMetadataProvider(mockMetadataProvider('tmdb'))
    registry.registerMetadataProvider(mockMetadataProvider('bangumi'))

    expect(registry.getProvidersByType('metadata')).toHaveLength(2)
    expect(registry.getProvidersByType('media-server')).toHaveLength(0)
  })

  it('enable/disable toggles provider', () => {
    const registry = new EcosystemProviderRegistry()
    registry.registerMetadataProvider(mockMetadataProvider('tmdb'))

    registry.disable('tmdb')
    expect(registry.getMetadataProviders()).toHaveLength(0)

    registry.enable('tmdb')
    expect(registry.getMetadataProviders()).toHaveLength(1)
  })

  it('unregister removes provider', () => {
    const registry = new EcosystemProviderRegistry()
    registry.registerMetadataProvider(mockMetadataProvider('tmdb'))
    registry.unregister('tmdb')
    expect(registry.count).toBe(0)
  })

  it('subscriber is notified on changes', () => {
    const registry = new EcosystemProviderRegistry()
    let notified = 0
    registry.subscribe(() => notified++)
    registry.registerMetadataProvider(mockMetadataProvider('tmdb'))
    expect(notified).toBe(1)
  })
})

describe('EcosystemProviderFacade', () => {
  it('facade delegates to manager', async () => {
    const facade = new EcosystemProviderFacade()
    await facade.initialize()
    facade.registerMetadataProvider(mockMetadataProvider('tmdb'))
    expect(facade.totalCount).toBe(1)
    expect(facade.getMetadataProviders()).toHaveLength(1)
  })
})
