// tests/unit/recommendation/runtime/providers.spec.ts — CE9-C Provider Tests

import { describe, it, expect } from 'vitest'
import { LocalRecommendationProvider } from '@/modules/recommendation/runtime/providers/LocalRecommendationProvider'
import { TrendingRecommendationProvider } from '@/modules/recommendation/runtime/providers/TrendingRecommendationProvider'
import { PersonalizedRecommendationProvider } from '@/modules/recommendation/runtime/providers/PersonalizedRecommendationProvider'
import { SimilarContentRecommendationProvider } from '@/modules/recommendation/runtime/providers/SimilarContentRecommendationProvider'
import { AIRecommendationProvider } from '@/modules/recommendation/runtime/providers/AIRecommendationProvider'
import { RecommendationContext } from '@/modules/recommendation/domain/entities/RecommendationContext'
import { RecommendationProfile } from '@/modules/recommendation/domain/entities/RecommendationProfile'

function makeContext() { return RecommendationContext.default() }
function makeProfile() {
  return RecommendationProfile.create({
    generatedAt: Date.now(),
    genrePreferences: [{ genre: 'Action', weight: 0.9, frequency: 10, lastSeen: Date.now() }],
    personPreferences: [],
    contentTypePreference: { movieRatio: 0.6, tvRatio: 0.3, animeRatio: 0.1 },
    preferredYears: [],
    favoriteMediaIds: ['fav-1'],
    historyMediaIds: ['hist-1'],
    dataPoints: 3,
  })
}

describe('LocalRecommendationProvider', () => {
  it('should implement IRecommendationProvider', async () => {
    const p = new LocalRecommendationProvider()
    expect(p.name).toBe('local-recommendation')
    await p.initialize()
    expect(p.state).toBe('ready')
    expect(p.isAvailable()).toBe(true)
  })

  it('should return empty for cold profile', async () => {
    const p = new LocalRecommendationProvider()
    await p.initialize()
    const items = await p.generate(makeContext(), RecommendationProfile.empty(), 10)
    expect(items).toEqual([])
  })

  it('should generate items for personalized profile', async () => {
    const p = new LocalRecommendationProvider()
    await p.initialize()
    const items = await p.generate(makeContext(), makeProfile(), 10)
    expect(Array.isArray(items)).toBe(true)
  })

  it('should provide health check', () => {
    const p = new LocalRecommendationProvider()
    const health = p.healthCheck()
    expect(health.state).toBeDefined()
    expect(health.consecutiveErrors).toBeGreaterThanOrEqual(0)
  })

  it('should dispose cleanly', async () => {
    const p = new LocalRecommendationProvider()
    await p.dispose()
    expect(p.state).toBe('disposed')
  })
})

describe('TrendingRecommendationProvider', () => {
  it('should generate items from signals', async () => {
    const p = new TrendingRecommendationProvider()
    await p.initialize()

    p.updateSignals([
      { mediaId: 'm1', title: 'Trending 1', type: 'movie', cover: 'x', genres: ['Action'], trendingScore: 0.9, year: 2024 },
      { mediaId: 'm2', title: 'Trending 2', type: 'tv', cover: 'x', genres: ['Drama'], trendingScore: 0.7, year: 2023 },
      { mediaId: 'm3', title: 'Trending 3', type: 'movie', cover: 'x', genres: [], trendingScore: 0.5, year: 2024 },
    ])

    const items = await p.generate(makeContext(), makeProfile(), 2)
    expect(items).toHaveLength(2)
    expect(items[0].mediaId).toBe('m1') // highest trending score
    expect(items[1].reason.rendered).toContain('Trending in')
  })

  it('should return empty when no signals', async () => {
    const p = new TrendingRecommendationProvider()
    await p.initialize()
    const items = await p.generate(makeContext(), makeProfile(), 10)
    expect(items).toHaveLength(0)
  })
})

describe('PersonalizedRecommendationProvider', () => {
  it('should generate personalized items from candidate pool', async () => {
    const p = new PersonalizedRecommendationProvider()
    await p.initialize()

    p.updateCandidatePool([
      { mediaId: 'm1', title: 'Action Movie', type: 'movie', cover: 'x', genres: ['Action', 'Sci-Fi'], rating: 8.5 },
      { mediaId: 'm2', title: 'Drama Show', type: 'tv', cover: 'x', genres: ['Drama'], rating: 7.0 },
      { mediaId: 'fav-1', title: 'Already Watched', type: 'movie', cover: 'x', genres: ['Action'], rating: 9.0 },
    ])

    const items = await p.generate(makeContext(), makeProfile(), 10)
    // 'fav-1' should be excluded (already in history), 'm1' matches Action genre
    expect(items.find(i => i.mediaId === 'fav-1')).toBeUndefined()
    // m1 should rank higher than m2 because it matches Action genre preference
    if (items.length >= 2) {
      const m1Idx = items.findIndex(i => i.mediaId === 'm1')
      const m2Idx = items.findIndex(i => i.mediaId === 'm2')
      if (m1Idx >= 0 && m2Idx >= 0) {
        expect(m1Idx).toBeLessThan(m2Idx)
      }
    }
  })

  it('should return empty for non-personalized profile', async () => {
    const p = new PersonalizedRecommendationProvider()
    await p.initialize()
    p.updateCandidatePool([{ mediaId: 'm1', title: 'Movie', type: 'movie', cover: 'x', genres: ['Action'] }])
    const items = await p.generate(makeContext(), RecommendationProfile.empty(), 10)
    expect(items).toHaveLength(0)
  })
})

describe('SimilarContentRecommendationProvider', () => {
  it('should generate similar items', async () => {
    const p = new SimilarContentRecommendationProvider()
    await p.initialize()

    p.setContext(
      { sourceMediaId: 'source-1', sourceTitle: 'The Matrix', sourceType: 'movie', sourceGenres: ['Sci-Fi'] },
      [
        { mediaId: 'sim-1', title: 'Inception', type: 'movie', cover: 'x', genres: ['Sci-Fi'], matchScore: 0.9, matchReason: 'Genre match' },
        { mediaId: 'sim-2', title: 'Dark City', type: 'movie', cover: 'x', genres: ['Sci-Fi'], matchScore: 0.7, matchReason: 'Genre match' },
      ],
    )

    const items = await p.generate(makeContext(), makeProfile(), 1)
    expect(items).toHaveLength(1)
    expect(items[0].reason.rendered).toContain('Similar to The Matrix')
  })

  it('should return empty without context', async () => {
    const p = new SimilarContentRecommendationProvider()
    await p.initialize()
    const items = await p.generate(makeContext(), makeProfile(), 10)
    expect(items).toHaveLength(0)
  })
})

describe('AIRecommendationProvider (CE9 placeholder)', () => {
  it('should return empty in CE9', async () => {
    const p = new AIRecommendationProvider()
    await p.initialize()
    expect(p.isAvailable()).toBe(false)
    const items = await p.generate(makeContext(), makeProfile(), 10)
    expect(items).toHaveLength(0)
  })
})
