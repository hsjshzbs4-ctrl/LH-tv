// tests/unit/search-unified/search-ranking-service.spec.ts — CE8-A SearchRankingService tests

import { describe, it, expect } from 'vitest'
import { SearchRankingService } from '@/modules/search-unified/domain/services/SearchRankingService'
import { UnifiedSearchResult } from '@/modules/search-unified/domain/entities/UnifiedSearchResult'
import { SearchSource } from '@/modules/search-unified/domain/entities/SearchSource'
import { AvailabilityInfo } from '@/modules/search-unified/domain/entities/AvailabilityInfo'
import { ContentIdentity } from '@/modules/search-unified/domain/value-objects/ContentIdentity'
import { SearchScore } from '@/modules/search-unified/domain/value-objects/SearchScore'

function makeResult(title: string, score: number, sourceCount = 1, bestQuality = 50, playable = false) {
  const srcType = playable ? 'local' : 'tmdb'
  const src = SearchSource.create({
    sourceId: `s-${title}`, sourceType: srcType, externalId: '1', available: true, quality: bestQuality,
  })
  const sources = Array.from({ length: sourceCount }, (_, i) =>
    i === 0 ? src : SearchSource.create({ sourceId: `s${i}`, sourceType: 'tmdb', externalId: `${i}`, available: true, quality: bestQuality }),
  )
  const availability = playable
    ? AvailabilityInfo.create({ playable: true, preferredSource: src, availableSources: [src], bestQuality, localAvailable: true })
    : AvailabilityInfo.create({ playable: false, preferredSource: null, availableSources: [], bestQuality, localAvailable: false })

  return UnifiedSearchResult.create({
    contentId: ContentIdentity.create(`tmdb:${title}`),
    title, mediaType: 'movie', score: SearchScore.create(score),
    sources, availability, genres: [],
  })
}

describe('SearchRankingService', () => {
  const service = new SearchRankingService()

  it('should sort by score descending', () => {
    const results = [
      makeResult('C', 30),
      makeResult('A', 90),
      makeResult('B', 60),
    ]
    const ranked = service.rank(results)
    expect(ranked[0].title).toBe('A')
    expect(ranked[1].title).toBe('B')
    expect(ranked[2].title).toBe('C')
  })

  it('should break ties by source count', () => {
    const results = [
      makeResult('B', 50, 2),
      makeResult('A', 50, 3),
      makeResult('C', 50, 1),
    ]
    const ranked = service.rank(results)
    expect(ranked[0].title).toBe('A') // most sources
    expect(ranked[1].title).toBe('B')
    expect(ranked[2].title).toBe('C')
  })

  it('should break ties by quality', () => {
    // All have same score (50) and same sourceCount (1),
    // difference is bestQuality: 90 > 60 > 30
    const results = [
      makeResult('LowQ', 50, 1, 30),
      makeResult('HighQ', 50, 1, 90),
      makeResult('MidQ', 50, 1, 60),
    ]
    const ranked = service.rank(results)
    expect(ranked[0].title).toBe('HighQ')
    expect(ranked[1].title).toBe('MidQ')
    expect(ranked[2].title).toBe('LowQ')
  })

  it('should prefer playable results when option set', () => {
    const results = [
      makeResult('B', 90, 1, 50, false),
      makeResult('A', 50, 1, 50, true),
    ]
    const ranked = service.rank(results, { preferPlayable: true })
    expect(ranked[0].title).toBe('A') // playable wins despite lower score
    expect(ranked[1].title).toBe('B')
  })

  it('should apply limit', () => {
    const results = Array.from({ length: 20 }, (_, i) => makeResult(`M${i}`, 50 - i))
    const ranked = service.rank(results, { limit: 5 })
    expect(ranked).toHaveLength(5)
  })

  it('should apply offset and limit', () => {
    const results = Array.from({ length: 10 }, (_, i) => makeResult(`M${i}`, 100 - i))
    const ranked = service.rank(results, { offset: 3, limit: 4 })
    expect(ranked).toHaveLength(4)
    expect(ranked[0].title).toBe('M3')
    expect(ranked[3].title).toBe('M6')
  })

  it('should handle empty results', () => {
    const ranked = service.rank([])
    expect(ranked).toHaveLength(0)
  })

  it('should compute stats', () => {
    const results = [
      makeResult('A', 100),
      makeResult('B', 50),
    ]
    const stats = service.computeStats(results)
    expect(stats.rankedCount).toBe(2)
    expect(stats.topScore).toBe(100)
    expect(stats.averageScore).toBe(75)
  })

  it('should compute stats for empty results', () => {
    const stats = service.computeStats([])
    expect(stats.rankedCount).toBe(0)
    expect(stats.topScore).toBe(0)
    expect(stats.averageScore).toBe(0)
  })
})
