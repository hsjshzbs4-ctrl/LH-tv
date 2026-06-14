// tests/unit/search-unified/availability-resolver.spec.ts — CE8-A AvailabilityResolver tests

import { describe, it, expect } from 'vitest'
import { AvailabilityResolver } from '@/modules/search-unified/domain/services/AvailabilityResolver'
import { AvailabilityInfo } from '@/modules/search-unified/domain/entities/AvailabilityInfo'
import { SearchSource } from '@/modules/search-unified/domain/entities/SearchSource'
import { UnifiedSearchResult } from '@/modules/search-unified/domain/entities/UnifiedSearchResult'
import { ContentIdentity } from '@/modules/search-unified/domain/value-objects/ContentIdentity'
import { SearchScore } from '@/modules/search-unified/domain/value-objects/SearchScore'

function makeResult(sources: SearchSource[], overrides: Partial<{ title: string }> = {}) {
  return UnifiedSearchResult.create({
    contentId: ContentIdentity.create('tmdb:123'),
    title: overrides.title ?? 'Test',
    mediaType: 'movie',
    score: SearchScore.zero(),
    sources,
    availability: AvailabilityInfo.unavailable(),
    genres: [],
  })
}

describe('AvailabilityResolver', () => {
  const resolver = new AvailabilityResolver()

  it('should return unavailable when no playable sources', () => {
    const result = makeResult([
      SearchSource.create({ sourceId: '1', sourceType: 'tmdb', externalId: 'a', available: true, quality: 50 }),
    ])
    const availability = resolver.resolve(result)
    expect(availability.playable).toBe(false)
  })

  it('should prefer local source', () => {
    const result = makeResult([
      SearchSource.create({ sourceId: '1', sourceType: 'tmdb', externalId: 'a', available: true, quality: 100 }),
      SearchSource.create({ sourceId: '2', sourceType: 'local', externalId: 'b', available: true, quality: 50 }),
    ])
    const availability = resolver.resolve(result)
    expect(availability.playable).toBe(true)
    expect(availability.preferredSource?.sourceType).toBe('local')
    expect(availability.localAvailable).toBe(true)
  })

  it('should rank sources by priority: local > jellyfin > plex > emby > metadata', () => {
    const result = makeResult([
      SearchSource.create({ sourceId: '1', sourceType: 'tmdb', externalId: 'a', available: true, quality: 100 }),
      SearchSource.create({ sourceId: '2', sourceType: 'emby', externalId: 'b', available: true, quality: 70 }),
      SearchSource.create({ sourceId: '3', sourceType: 'jellyfin', externalId: 'c', available: true, quality: 60 }),
      SearchSource.create({ sourceId: '4', sourceType: 'plex', externalId: 'd', available: true, quality: 80 }),
    ])
    const availability = resolver.resolve(result)
    expect(availability.preferredSource?.sourceType).toBe('jellyfin')
    expect(availability.bestQuality).toBe(60)
  })

  it('should break ties by quality within same priority tier', () => {
    const result = makeResult([
      SearchSource.create({ sourceId: '1', sourceType: 'jellyfin', externalId: 'a', available: true, quality: 60 }),
      SearchSource.create({ sourceId: '2', sourceType: 'jellyfin', externalId: 'b', available: true, quality: 90 }),
    ])
    const availability = resolver.resolve(result)
    expect(availability.preferredSource?.quality).toBe(90)
  })

  it('should resolve batch', () => {
    const r1 = makeResult([
      SearchSource.create({ sourceId: '1', sourceType: 'local', externalId: 'a', available: true, quality: 80 }),
    ], { title: 'Movie A' })
    const r2 = makeResult([
      SearchSource.create({ sourceId: '2', sourceType: 'tmdb', externalId: 'b', available: true, quality: 50 }),
    ], { title: 'Movie B' })

    const results = resolver.resolveBatch([r1, r2])
    expect(results[0].availability.playable).toBe(true)
    expect(results[0].availability.localAvailable).toBe(true)
    expect(results[1].availability.playable).toBe(false)
  })
})
