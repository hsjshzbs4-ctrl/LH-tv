// tests/unit/search-unified/search-result-mapper.spec.ts — CE8-B SearchResultMapper tests

import { describe, it, expect } from 'vitest'
import { SearchResultMapper } from '@/modules/search-unified/application/mappers/SearchResultMapper'
import { UnifiedSearchResult } from '@/modules/search-unified/domain/entities/UnifiedSearchResult'
import { SearchSource } from '@/modules/search-unified/domain/entities/SearchSource'
import { AvailabilityInfo } from '@/modules/search-unified/domain/entities/AvailabilityInfo'
import { ContentIdentity } from '@/modules/search-unified/domain/value-objects/ContentIdentity'
import { SearchScore } from '@/modules/search-unified/domain/value-objects/SearchScore'

describe('SearchResultMapper', () => {
  const mapper = new SearchResultMapper()

  it('should map domain result to DTO', () => {
    const src = SearchSource.create({
      sourceId: 'jellyfin-1', sourceType: 'jellyfin', externalId: 'item-1', available: true, quality: 80,
    })
    const result = UnifiedSearchResult.create({
      contentId: ContentIdentity.create('tmdb:157336'),
      title: 'Interstellar',
      originalTitle: 'Interstellar',
      mediaType: 'movie',
      overview: 'Space explorers.',
      year: 2014,
      score: SearchScore.create(85),
      sources: [src],
      availability: AvailabilityInfo.create({
        playable: true, preferredSource: src, availableSources: [src], bestQuality: 80, localAvailable: false,
      }),
      genres: ['Sci-Fi'],
    })

    const dto = mapper.toDto(result)
    expect(dto.contentId).toBe('tmdb:157336')
    expect(dto.title).toBe('Interstellar')
    expect(dto.mediaType).toBe('movie')
    expect(dto.score).toBe(85)
    expect(dto.sources).toHaveLength(1)
    expect(dto.sources[0].sourceType).toBe('jellyfin')
    expect(dto.availability.playable).toBe(true)
    expect(dto.isPlayable).toBe(true)
    expect(dto.sourceCount).toBe(1)
  })

  it('should map multiple results', () => {
    const result = UnifiedSearchResult.create({
      contentId: ContentIdentity.create('tmdb:1'),
      title: 'Test', mediaType: 'movie', score: SearchScore.zero(),
      sources: [SearchSource.create({ sourceId: 'x', sourceType: 'tmdb', externalId: '1', available: true, quality: 50 })],
      availability: AvailabilityInfo.unavailable(),
      genres: [],
    })
    const dtos = mapper.toDtoList([result, result])
    expect(dtos).toHaveLength(2)
  })

  it('should not leak domain objects', () => {
    const result = UnifiedSearchResult.create({
      contentId: ContentIdentity.create('tmdb:1'),
      title: 'Test', mediaType: 'movie', score: SearchScore.zero(),
      sources: [SearchSource.create({ sourceId: 'x', sourceType: 'tmdb', externalId: '1', available: true, quality: 50 })],
      availability: AvailabilityInfo.unavailable(),
      genres: [],
    })
    const dto = mapper.toDto(result)
    // DTO should be plain objects, not domain instances
    expect(dto.constructor).toBe(Object.prototype.constructor)
    expect(typeof dto.contentId).toBe('string')
    expect(typeof dto.score).toBe('number')
  })
})
