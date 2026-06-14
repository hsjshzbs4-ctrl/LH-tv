// tests/unit/recommendation/domain/entities.spec.ts — CE9-A Entity Tests

import { describe, it, expect } from 'vitest'
import { RecommendationContext } from '@/modules/recommendation/domain/entities/RecommendationContext'
import { RecommendationProfile } from '@/modules/recommendation/domain/entities/RecommendationProfile'
import { RecommendationSource } from '@/modules/recommendation/domain/entities/RecommendationSource'
import { RecommendationItem } from '@/modules/recommendation/domain/entities/RecommendationItem'
import { RecommendationSection } from '@/modules/recommendation/domain/entities/RecommendationSection'
import { RecommendationFeed } from '@/modules/recommendation/domain/entities/RecommendationFeed'
import { RecommendationScore } from '@/modules/recommendation/domain/value-objects/RecommendationScore'
import { RecommendationReason } from '@/modules/recommendation/domain/value-objects/RecommendationReason'

// ─── RecommendationContext ───

describe('RecommendationContext', () => {
  it('should create valid context', () => {
    const ctx = RecommendationContext.create({
      userId: 'user-1',
      timestamp: Date.now(),
      experimentId: 'exp-001',
      variantId: 'variant-a',
      sessionId: 'session-1',
    })
    expect(ctx.userId).toBe('user-1')
    expect(ctx.experimentId).toBe('exp-001')
    expect(ctx.variantId).toBe('variant-a')
  })

  it('should enforce experimentId requirement (Req 10)', () => {
    expect(() => RecommendationContext.create({
      userId: 'user-1',
      timestamp: Date.now(),
      experimentId: '',
      variantId: 'a',
      sessionId: 's',
    })).toThrow('experimentId')
  })

  it('should enforce variantId requirement (Req 10)', () => {
    expect(() => RecommendationContext.create({
      userId: 'user-1',
      timestamp: Date.now(),
      experimentId: 'e',
      variantId: '',
      sessionId: 's',
    })).toThrow('variantId')
  })

  it('default() should create valid anonymous context', () => {
    const ctx = RecommendationContext.default()
    expect(ctx.userId).toBe('anonymous')
    expect(ctx.experimentId).toBe('default')
    expect(ctx.variantId).toBe('control')
    expect(ctx.hasInteractions).toBe(false)
  })

  it('should track interactions', () => {
    const ctx = RecommendationContext.create({
      userId: 'u1',
      timestamp: Date.now(),
      experimentId: 'e1',
      variantId: 'v1',
      sessionId: 's1',
      recentInteractions: [
        { mediaId: 'm1', action: 'click', timestamp: 1000 },
        { mediaId: 'm2', action: 'play', timestamp: 2000 },
        { mediaId: 'm1', action: 'favorite', timestamp: 3000 },
      ],
    })
    expect(ctx.hasInteractions).toBe(true)
    expect(ctx.interactedMediaCount).toBe(2) // m1 appears twice, m2 once
  })
})

// ─── RecommendationProfile ───

describe('RecommendationProfile', () => {
  function makeProfile(overrides?: Partial<{
    genrePreferences: { genre: string; weight: number; frequency: number; lastSeen: number }[]
    dataPoints: number
  }>) {
    return RecommendationProfile.create({
      generatedAt: Date.now(),
      genrePreferences: overrides?.genrePreferences ?? [],
      personPreferences: [],
      contentTypePreference: { movieRatio: 0.5, tvRatio: 0.3, animeRatio: 0.2 },
      preferredYears: [],
      favoriteMediaIds: ['fav-1', 'fav-2'],
      historyMediaIds: ['hist-1'],
      dataPoints: overrides?.dataPoints ?? 3,
    })
  }

  it('should create a valid profile', () => {
    const profile = makeProfile()
    expect(profile.dataPoints).toBe(3)
    expect(profile.favoriteMediaIds).toContain('fav-1')
  })

  it('empty() should create empty profile', () => {
    const profile = RecommendationProfile.empty()
    expect(profile.dataPoints).toBe(0)
    expect(profile.isPersonalized).toBe(false)
    expect(profile.genrePreferences).toHaveLength(0)
  })

  it('isPersonalized should require >= 3 data points', () => {
    expect(makeProfile({ dataPoints: 3 }).isPersonalized).toBe(true)
    expect(makeProfile({ dataPoints: 2 }).isPersonalized).toBe(false)
    expect(RecommendationProfile.empty().isPersonalized).toBe(false)
  })

  it('hasInteractedWith should detect favorites and history', () => {
    const profile = makeProfile()
    expect(profile.hasInteractedWith('fav-1')).toBe(true)
    expect(profile.hasInteractedWith('hist-1')).toBe(true)
    expect(profile.hasInteractedWith('unknown')).toBe(false)
  })

  it('getTopGenres should return sorted by weight', () => {
    const profile = makeProfile({
      genrePreferences: [
        { genre: 'Action', weight: 0.8, frequency: 10, lastSeen: Date.now() },
        { genre: 'Comedy', weight: 0.5, frequency: 5, lastSeen: Date.now() },
        { genre: 'Drama', weight: 0.3, frequency: 3, lastSeen: Date.now() },
      ],
    })
    const top = profile.getTopGenres(2)
    expect(top).toHaveLength(2)
    expect(top[0].genre).toBe('Action')
    expect(top[1].genre).toBe('Comedy')
  })

  it('isStale should detect old profiles', () => {
    const old = RecommendationProfile.create({
      generatedAt: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
      genrePreferences: [],
      personPreferences: [],
      contentTypePreference: { movieRatio: 0.5, tvRatio: 0.3, animeRatio: 0.2 },
      preferredYears: [],
      favoriteMediaIds: [],
      historyMediaIds: [],
      dataPoints: 0,
    })
    expect(old.isStale()).toBe(true)
  })
})

// ─── RecommendationItem ───

describe('RecommendationItem', () => {
  function makeItem(overrides?: Partial<{ mediaId: string; title: string; score: RecommendationScore }>) {
    return RecommendationItem.create({
      mediaId: overrides?.mediaId ?? 'media-1',
      title: overrides?.title ?? 'Test Item',
      cover: 'https://example.com/poster.jpg',
      type: 'movie',
      year: 2024,
      score: overrides?.score ?? RecommendationScore.create({
        interestScore: 0.8, noveltyScore: 0.6, diversityScore: 0.5,
        popularityScore: 0.7, freshnessScore: 0.4,
      }),
      reason: RecommendationReason.recommendedForYou(),
      sources: [RecommendationSource.create({
        sourceType: 'personalized',
        label: 'Profile Engine',
        weight: 1.0,
      })],
      genres: ['Action', 'Sci-Fi'],
    })
  }

  it('should create valid item', () => {
    const item = makeItem()
    expect(item.mediaId).toBe('media-1')
    expect(item.reasonText).toBe('Recommended for you')
    expect(item.compositeScore).toBeGreaterThan(0)
  })

  it('should enforce mandatory reason (Req 5)', () => {
    expect(() => RecommendationItem.create({
      mediaId: 'm1',
      title: 'Test',
      cover: 'x',
      type: 'movie',
      score: RecommendationScore.zero(),
      reason: null as any,
      sources: [RecommendationSource.create({ sourceType: 'trending', label: 't', weight: 1 })],
    })).toThrow()
  })

  it('should require at least one source', () => {
    expect(() => RecommendationItem.create({
      mediaId: 'm1',
      title: 'Test',
      cover: 'x',
      type: 'movie',
      score: RecommendationScore.zero(),
      reason: RecommendationReason.topPick(),
      sources: [],
    })).toThrow('at least one source')
  })

  it('should sort by composite score descending', () => {
    const a = makeItem({ mediaId: 'a', score: RecommendationScore.create({
      interestScore: 0.9, noveltyScore: 0, diversityScore: 0, popularityScore: 0, freshnessScore: 0,
    }) })
    const b = makeItem({ mediaId: 'b', score: RecommendationScore.create({
      interestScore: 0.3, noveltyScore: 0, diversityScore: 0, popularityScore: 0, freshnessScore: 0,
    }) })
    // a > b → compare returns negative (JS sort convention: a before b in descending)
    expect(RecommendationItem.compare(a, b)).toBe(-1)
    expect(RecommendationItem.compare(b, a)).toBe(1)
    // Items should sort with a (higher) first
    const sorted = [b, a].sort(RecommendationItem.compare)
    expect(sorted[0].mediaId).toBe('a')
  })

  it('equals should compare by mediaId', () => {
    const a = makeItem({ mediaId: 'a' })
    const a2 = makeItem({ mediaId: 'a', title: 'Different Title' })
    const b = makeItem({ mediaId: 'b' })
    expect(a.equals(a2)).toBe(true)
    expect(a.equals(b)).toBe(false)
  })
})

// ─── RecommendationFeed ───

describe('RecommendationFeed', () => {
  function makeFeed() {
    const ctx = RecommendationContext.default()
    const section = RecommendationSection.create({
      id: 'section-1',
      type: 'for-you',
      title: 'For You',
      items: [
        RecommendationItem.create({
          mediaId: 'm1',
          title: 'Movie 1',
          cover: 'x',
          type: 'movie',
          score: RecommendationScore.zero(),
          reason: RecommendationReason.recommendedForYou(),
          sources: [RecommendationSource.create({ sourceType: 'personalized', label: 'p', weight: 1 })],
        }),
      ],
      source: RecommendationSource.create({ sourceType: 'personalized', label: 'Profile', weight: 1 }),
      metadata: { originalCount: 1, diversityFilteredCount: 0, weights: {} },
    })

    return RecommendationFeed.create({
      feedId: 'feed-1',
      sections: [section],
      generatedAt: Date.now(),
      ttl: 60000,
      context: ctx,
      metadata: {
        confidence: 0.8,
        activeEngines: ['profile-based'],
        generationTimes: { 'profile-based': 150 },
        totalItems: 1,
        deduplicatedCount: 0,
        sourceAttribution: [{ sourceType: 'personalized', itemCount: 1, weight: 1 }],
        experiment: {
          experimentId: 'default',
          variantId: 'control',
          strategyWeights: {},
        },
        schemaVersion: 1,
      },
    })
  }

  it('should create valid feed', () => {
    const feed = makeFeed()
    expect(feed.feedId).toBe('feed-1')
    expect(feed.totalItems).toBe(1)
    expect(feed.isDisplayable).toBe(true)
  })

  it('isExpired should detect expired feed', () => {
    const ctx = RecommendationContext.default()
    const oldFeed = RecommendationFeed.create({
      feedId: 'old',
      sections: [],
      generatedAt: Date.now() - 120000, // 2 min ago
      ttl: 60000, // 1 min TTL
      context: ctx,
      metadata: {
        confidence: 0, activeEngines: [], generationTimes: {},
        totalItems: 0, deduplicatedCount: 0, sourceAttribution: [],
        experiment: { experimentId: 'd', variantId: 'c', strategyWeights: {} },
        schemaVersion: 1,
      },
    })
    expect(oldFeed.isExpired()).toBe(true)
  })

  it('isDisplayable should be false for empty feed', () => {
    const ctx = RecommendationContext.default()
    const emptyFeed = RecommendationFeed.create({
      feedId: 'empty',
      sections: [],
      generatedAt: Date.now(),
      ttl: 60000,
      context: ctx,
      metadata: {
        confidence: 0, activeEngines: [], generationTimes: {},
        totalItems: 0, deduplicatedCount: 0, sourceAttribution: [],
        experiment: { experimentId: 'd', variantId: 'c', strategyWeights: {} },
        schemaVersion: 1,
      },
    })
    expect(emptyFeed.isDisplayable).toBe(false)
    expect(emptyFeed.nonEmptySections).toHaveLength(0)
  })

  it('allItems should flatten items from all sections', () => {
    const feed = makeFeed()
    expect(feed.allItems).toHaveLength(1)
    expect(feed.allMediaIds).toEqual(['m1'])
  })
})
