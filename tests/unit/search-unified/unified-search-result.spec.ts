// tests/unit/search-unified/unified-search-result.spec.ts — CE8-A UnifiedSearchResult tests

import { describe, it, expect } from 'vitest'
import { UnifiedSearchResult } from '@/modules/search-unified/domain/entities/UnifiedSearchResult'
import { SearchSource } from '@/modules/search-unified/domain/entities/SearchSource'
import { AvailabilityInfo } from '@/modules/search-unified/domain/entities/AvailabilityInfo'
import { ContentIdentity } from '@/modules/search-unified/domain/value-objects/ContentIdentity'
import { SearchScore } from '@/modules/search-unified/domain/value-objects/SearchScore'

function makeResult(overrides: Partial<{
  title: string; score: number; sourceCount: number; bestQuality: number; playable: boolean
}> = {}) {
  const src = SearchSource.create({
    sourceId: 'tmdb', sourceType: 'tmdb', externalId: '123', available: true, quality: overrides.bestQuality ?? 50,
  })
  const sources = Array.from({ length: overrides.sourceCount ?? 1 }, (_, i) =>
    SearchSource.create({ sourceId: `s${i}`, sourceType: 'tmdb', externalId: `${i}`, available: true, quality: 50 }),
  )
  const availability = overrides.playable
    ? AvailabilityInfo.create({ playable: true, preferredSource: src, availableSources: sources, bestQuality: overrides.bestQuality ?? 50, localAvailable: false })
    : AvailabilityInfo.create({ playable: false, preferredSource: null, availableSources: [], bestQuality: overrides.bestQuality ?? 50, localAvailable: false })

  return UnifiedSearchResult.create({
    contentId: ContentIdentity.create('tmdb:123'),
    title: overrides.title ?? 'Test Movie',
    mediaType: 'movie',
    score: SearchScore.create(overrides.score ?? 50),
    sources,
    availability,
    genres: ['Action'],
  })
}

describe('UnifiedSearchResult', () => {
  it('should create a valid result', () => {
    const result = makeResult()
    expect(result.title).toBe('Test Movie')
    expect(result.contentId.value).toBe('tmdb:123')
    expect(result.mediaType).toBe('movie')
    expect(result.score.value).toBe(50)
    expect(result.sourceCount).toBe(1)
  })

  it('should reject empty title', () => {
    const src = makeResult()
    expect(() =>
      UnifiedSearchResult.create({
        contentId: ContentIdentity.create('tmdb:123'),
        title: '',
        mediaType: 'movie',
        score: SearchScore.zero(),
        sources: [...src.sources],
        availability: AvailabilityInfo.unavailable(),
        genres: [],
      }),
    ).toThrow('title must not be empty')
  })

  it('should reject empty sources', () => {
    expect(() =>
      UnifiedSearchResult.create({
        contentId: ContentIdentity.create('tmdb:123'),
        title: 'Test',
        mediaType: 'movie',
        score: SearchScore.zero(),
        sources: [],
        availability: AvailabilityInfo.unavailable(),
        genres: [],
      }),
    ).toThrow('at least one source required')
  })

  it('should report isPlayable from availability', () => {
    expect(makeResult({ playable: true }).isPlayable).toBe(true)
    expect(makeResult({ playable: false }).isPlayable).toBe(false)
  })

  it('should return unique source types', () => {
    const src1 = SearchSource.create({ sourceId: '1', sourceType: 'tmdb', externalId: 'a', available: true, quality: 50 })
    const src2 = SearchSource.create({ sourceId: '2', sourceType: 'jellyfin', externalId: 'b', available: true, quality: 50 })
    const src3 = SearchSource.create({ sourceId: '3', sourceType: 'tmdb', externalId: 'c', available: true, quality: 50 })
    const result = UnifiedSearchResult.create({
      contentId: ContentIdentity.create('tmdb:123'),
      title: 'Test', mediaType: 'movie', score: SearchScore.zero(),
      sources: [src1, src2, src3],
      availability: AvailabilityInfo.unavailable(),
      genres: [],
    })
    expect(result.sourceTypes).toEqual(['tmdb', 'jellyfin'])
  })

  it('should sort by score descending, then sources, then quality', () => {
    const highScore = makeResult({ title: 'HighScore', score: 90, sourceCount: 1, bestQuality: 50 })
    const mostSources = makeResult({ title: 'MostSrcs', score: 50, sourceCount: 3, bestQuality: 90 })
    const highQual = makeResult({ title: 'HighQual', score: 50, sourceCount: 2, bestQuality: 80 })
    const lowQual = makeResult({ title: 'LowQual', score: 50, sourceCount: 2, bestQuality: 60 })

    const sorted = [mostSources, highScore, lowQual, highQual].sort(UnifiedSearchResult.compare)
    expect(sorted[0].title).toBe('HighScore')  // highest score (90)
    expect(sorted[1].title).toBe('MostSrcs')   // score(50) + most sources(3)
    expect(sorted[2].title).toBe('HighQual')   // score(50) + sources(2) + quality(80)
    expect(sorted[3].title).toBe('LowQual')    // score(50) + sources(2) + quality(60)
  })
})
