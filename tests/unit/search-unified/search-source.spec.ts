// tests/unit/search-unified/search-source.spec.ts — CE8-A SearchSource tests

import { describe, it, expect } from 'vitest'
import { SearchSource } from '@/modules/search-unified/domain/entities/SearchSource'

describe('SearchSource', () => {
  it('should create a valid source', () => {
    const src = SearchSource.create({
      sourceId: 'jellyfin-1',
      sourceType: 'jellyfin',
      externalId: 'item-123',
      available: true,
      quality: 85,
    })
    expect(src.sourceId).toBe('jellyfin-1')
    expect(src.sourceType).toBe('jellyfin')
    expect(src.available).toBe(true)
    expect(src.quality).toBe(85)
  })

  it('should clamp quality to 0-100', () => {
    const low = SearchSource.create({ sourceId: 'a', sourceType: 'local', externalId: '1', available: true, quality: -10 })
    const high = SearchSource.create({ sourceId: 'b', sourceType: 'local', externalId: '2', available: true, quality: 150 })
    expect(low.quality).toBe(0)
    expect(high.quality).toBe(100)
  })

  it('should rank local source highest', () => {
    const local = SearchSource.create({ sourceId: 'local', sourceType: 'local', externalId: '1', available: true, quality: 50 })
    const jelly = SearchSource.create({ sourceId: 'jf', sourceType: 'jellyfin', externalId: '2', available: true, quality: 90 })
    expect(local.rankPriority()).toBeGreaterThan(jelly.rankPriority())
  })

  it('should rank sources by priority order', () => {
    const sources = [
      SearchSource.create({ sourceId: '1', sourceType: 'tvmaze', externalId: 'a', available: true, quality: 100 }),
      SearchSource.create({ sourceId: '2', sourceType: 'tmdb', externalId: 'b', available: true, quality: 100 }),
      SearchSource.create({ sourceId: '3', sourceType: 'local', externalId: 'c', available: true, quality: 100 }),
      SearchSource.create({ sourceId: '4', sourceType: 'jellyfin', externalId: 'd', available: true, quality: 100 }),
      SearchSource.create({ sourceId: '5', sourceType: 'plex', externalId: 'e', available: true, quality: 100 }),
      SearchSource.create({ sourceId: '6', sourceType: 'emby', externalId: 'f', available: true, quality: 100 }),
    ]
    sources.sort((a, b) => b.rankPriority() - a.rankPriority())
    expect(sources[0].sourceType).toBe('local')
    expect(sources[1].sourceType).toBe('jellyfin')
    expect(sources[2].sourceType).toBe('plex')
    expect(sources[3].sourceType).toBe('emby')
    expect(sources[4].sourceType).toBe('tmdb')
    expect(sources[5].sourceType).toBe('tvmaze')
  })

  it('should identify metadata-only sources', () => {
    expect(SearchSource.create({ sourceId: '1', sourceType: 'tmdb', externalId: 'a', available: true, quality: 50 }).isMetaOnly()).toBe(true)
    expect(SearchSource.create({ sourceId: '2', sourceType: 'local', externalId: 'b', available: true, quality: 50 }).isMetaOnly()).toBe(false)
  })

  it('should identify playable sources', () => {
    expect(SearchSource.create({ sourceId: '1', sourceType: 'jellyfin', externalId: 'a', available: true, quality: 50 }).isPlayable()).toBe(true)
    expect(SearchSource.create({ sourceId: '2', sourceType: 'tmdb', externalId: 'b', available: true, quality: 50 }).isPlayable()).toBe(false)
    expect(SearchSource.create({ sourceId: '3', sourceType: 'local', externalId: 'c', available: false, quality: 50 }).isPlayable()).toBe(false)
  })
})
