// tests/unit/recommendation/domain/services.spec.ts — CE9-A Domain Service Tests

import { describe, it, expect } from 'vitest'
import { RecommendationScoringService } from '@/modules/recommendation/domain/services/RecommendationScoringService'
import { RecommendationRankingService } from '@/modules/recommendation/domain/services/RecommendationRankingService'
import { RecommendationDiversificationService } from '@/modules/recommendation/domain/services/RecommendationDiversificationService'
import { RecommendationReasonGenerator } from '@/modules/recommendation/domain/services/RecommendationReasonGenerator'
import { FeedAssemblyService } from '@/modules/recommendation/domain/services/FeedAssemblyService'
import { RecommendationItem } from '@/modules/recommendation/domain/entities/RecommendationItem'
import { RecommendationProfile } from '@/modules/recommendation/domain/entities/RecommendationProfile'
import { RecommendationContext } from '@/modules/recommendation/domain/entities/RecommendationContext'
import { RecommendationSource } from '@/modules/recommendation/domain/entities/RecommendationSource'
import { RecommendationScore } from '@/modules/recommendation/domain/value-objects/RecommendationScore'
import { RecommendationReason } from '@/modules/recommendation/domain/value-objects/RecommendationReason'
import { RecommendationSection } from '@/modules/recommendation/domain/entities/RecommendationSection'

// ─── Helpers ───

function makeItem(mediaId: string, genres: string[], overrides?: Partial<{ score: RecommendationScore }>): RecommendationItem {
  return RecommendationItem.create({
    mediaId,
    title: `Title ${mediaId}`,
    cover: 'https://example.com/poster.jpg',
    type: 'movie',
    year: 2024,
    score: overrides?.score ?? RecommendationScore.create({
      interestScore: 0.7, noveltyScore: 0.5, diversityScore: 0.4,
      popularityScore: 0.6, freshnessScore: 0.3,
    }),
    reason: RecommendationReason.recommendedForYou(),
    sources: [RecommendationSource.create({ sourceType: 'personalized', label: 'Engine', weight: 1 })],
    genres,
  })
}

function makeProfile() {
  return RecommendationProfile.create({
    generatedAt: Date.now(),
    genrePreferences: [
      { genre: 'Action', weight: 0.9, frequency: 10, lastSeen: Date.now() },
      { genre: 'Sci-Fi', weight: 0.7, frequency: 7, lastSeen: Date.now() },
      { genre: 'Drama', weight: 0.3, frequency: 3, lastSeen: Date.now() },
    ],
    personPreferences: [
      { personId: 'p1', name: 'Actor A', weight: 0.8, frequency: 5 },
    ],
    contentTypePreference: { movieRatio: 0.6, tvRatio: 0.3, animeRatio: 0.1 },
    preferredYears: [{ year: 2020, weight: 0.5 }, { year: 2024, weight: 0.8 }],
    favoriteMediaIds: ['fav-1', 'fav-2'],
    historyMediaIds: ['hist-1', 'hist-2'],
    dataPoints: 5,
  })
}

function makeContext() {
  return RecommendationContext.default()
}

// ─── RecommendationScoringService ───

describe('RecommendationScoringService', () => {
  const scorer = new RecommendationScoringService()

  it('should compute multi-objective score', () => {
    const score = scorer.score({
      genreMatch: 0.8,
      castMatch: 0.6,
      typeMatch: 1.0,
      yearProximity: 0.9,
      ratingQuality: 0.85,
      novelty: 1.0,
      diversity: 0.5,
      popularity: 0.7,
      freshness: 0.6,
      confidence: 0.8,
    })
    expect(score.composite).toBeGreaterThan(0)
    expect(score.interestScore).toBeGreaterThan(0)
    expect(score.confidence).toBe(0.8)
  })

  it('should clamp values to [0, 1]', () => {
    const score = scorer.score({
      genreMatch: 1.5,
      castMatch: 2.0,
      typeMatch: -1,
      yearProximity: 3,
      ratingQuality: 5,
      novelty: -0.5,
      diversity: 2,
      popularity: 3,
      freshness: -1,
      confidence: 2,
    })
    // All values should be clamped
    expect(score.interestScore).toBeLessThanOrEqual(1)
    expect(score.interestScore).toBeGreaterThanOrEqual(0)
    expect(score.noveltyScore).toBeGreaterThanOrEqual(0)
    expect(score.confidence).toBe(1) // clamped from 2
  })

  it('scoreContentMatch should produce interest-only score', () => {
    const score = scorer.scoreContentMatch(0.9, 0.5, 1.0, 0.7)
    expect(score.interestScore).toBeGreaterThan(0)
    expect(score.noveltyScore).toBe(0.5) // neutral default
  })

  it('scoreColdStart should favor popularity and freshness', () => {
    const score = scorer.scoreColdStart(0.9, 0.8, 0.6)
    expect(score.popularityScore).toBe(0.9)
    expect(score.freshnessScore).toBe(0.8)
    expect(score.interestScore).toBe(0.5) // neutral
    expect(score.noveltyScore).toBe(1.0)  // everything is new
  })

  it('should clamp cold start values', () => {
    const score = scorer.scoreColdStart(2.5, -1, 3)
    expect(score.popularityScore).toBe(1)
    expect(score.freshnessScore).toBe(0)
    expect(score.confidence).toBe(1)
  })
})

// ─── RecommendationRankingService ───

describe('RecommendationRankingService', () => {
  const ranker = new RecommendationRankingService()
  const profile = makeProfile()
  const ctx = makeContext()

  it('should sort by composite score descending', () => {
    const items = [
      makeItem('a', [], { score: RecommendationScore.create({ interestScore: 0.3, noveltyScore: 0, diversityScore: 0, popularityScore: 0, freshnessScore: 0 }) }),
      makeItem('b', [], { score: RecommendationScore.create({ interestScore: 0.9, noveltyScore: 0, diversityScore: 0, popularityScore: 0, freshnessScore: 0 }) }),
      makeItem('c', [], { score: RecommendationScore.create({ interestScore: 0.6, noveltyScore: 0, diversityScore: 0, popularityScore: 0, freshnessScore: 0 }) }),
    ]
    const ranked = ranker.rank(items, profile, ctx)
    expect(ranked[0].mediaId).toBe('b') // highest
    expect(ranked[1].mediaId).toBe('c')
    expect(ranked[2].mediaId).toBe('a') // lowest
  })

  it('should deduplicate by mediaId', () => {
    const items = [
      makeItem('dup', ['Action']),
      makeItem('dup', ['Comedy']),
      makeItem('unique', ['Drama']),
    ]
    const ranked = ranker.rank(items, profile, ctx)
    expect(ranked).toHaveLength(2)
    expect(ranked.map(i => i.mediaId)).toEqual(['dup', 'unique']) // first 'dup' kept
  })

  it('should paginate', () => {
    const items = [
      makeItem('a', []), makeItem('b', []), makeItem('c', []),
      makeItem('d', []), makeItem('e', []),
    ]
    const ranked = ranker.rank(items, profile, ctx, { offset: 1, limit: 2 })
    expect(ranked).toHaveLength(2)
  })

  it('topN should return top N items', () => {
    const items = [makeItem('a', []), makeItem('b', []), makeItem('c', [])]
    const top = ranker.topN(items, 2, profile, ctx)
    expect(top).toHaveLength(2)
  })

  it('should sort by specific dimension', () => {
    const items = [
      makeItem('a', [], { score: RecommendationScore.create({ interestScore: 0.3, noveltyScore: 0.1, diversityScore: 0, popularityScore: 0, freshnessScore: 0 }) }),
      makeItem('b', [], { score: RecommendationScore.create({ interestScore: 0.5, noveltyScore: 0.9, diversityScore: 0, popularityScore: 0, freshnessScore: 0 }) }),
    ]
    const byNovelty = ranker.rankByDimension(items, 'noveltyScore')
    expect(byNovelty[0].mediaId).toBe('b') // novelty 0.9
  })

  it('rankWithDiversityBoost should interleave', () => {
    const items = [
      makeItem('a', [], { score: RecommendationScore.create({ interestScore: 0.9, noveltyScore: 0, diversityScore: 0.1, popularityScore: 0, freshnessScore: 0 }) }),
      makeItem('b', [], { score: RecommendationScore.create({ interestScore: 0.8, noveltyScore: 0, diversityScore: 0.9, popularityScore: 0, freshnessScore: 0 }) }),
    ]
    const result = ranker.rankWithDiversityBoost(items)
    expect(result).toHaveLength(2)
    // b has higher composite (0.37 vs 0.325) due to diversity contribution
    expect(result[0].mediaId).toBe('b')
  })
})

// ─── RecommendationDiversificationService ───

describe('RecommendationDiversificationService', () => {
  const diversifier = new RecommendationDiversificationService()

  it('should allow items within limits', () => {
    const items = [
      makeItem('a', ['Action', 'Sci-Fi']),
      makeItem('b', ['Comedy']),
      makeItem('c', ['Drama']),
    ]
    const result = diversifier.diversify(items)
    expect(result.items).toHaveLength(3)
    expect(result.filteredCount).toBe(0)
  })

  it('should filter items exceeding genre limit (max 5)', () => {
    // 6 items all of the same genre "Action" → only 5 should pass
    const items = Array.from({ length: 6 }, (_, i) => makeItem(`m${i}`, ['Action']))
    const result = diversifier.diversify(items)
    expect(result.items).toHaveLength(5)
    expect(result.filteredCount).toBe(1)
    expect(result.violations).toHaveLength(1)
    expect(result.violations[0].reason).toBe('genre')
  })

  it('should filter items by franchise when extractor provided', () => {
    const franchiseDiversifier = new RecommendationDiversificationService(
      undefined,
      (item) => item.title.startsWith('Title franchise') ? 'franchise-1' : null,
    )
    // Create items with titles that match the franchise extractor
    const items = Array.from({ length: 4 }, (_, i) =>
      RecommendationItem.create({
        mediaId: `f${i}`,
        title: `Title franchise ${i}`,
        cover: 'x',
        type: 'movie',
        score: RecommendationScore.zero(),
        reason: RecommendationReason.topPick(),
        sources: [RecommendationSource.create({ sourceType: 'trending', label: 't', weight: 1 })],
        genres: ['Action'],
      }),
    )
    // All 4 are same franchise → max 3 should pass
    const result = franchiseDiversifier.diversify(items)
    expect(result.items.length).toBeLessThanOrEqual(3)
  })

  it('wouldViolate should detect upcoming violations', () => {
    const existing = Array.from({ length: 5 }, (_, i) => makeItem(`m${i}`, ['Action']))
    const newItem = makeItem('new', ['Action'])
    expect(diversifier.wouldViolate(newItem, existing)).toBe(true)
  })

  it('wouldViolate should return false when within limits', () => {
    const existing = [makeItem('a', ['Action']), makeItem('b', ['Comedy'])]
    const newItem = makeItem('new', ['Drama'])
    expect(diversifier.wouldViolate(newItem, existing)).toBe(false)
  })
})

// ─── RecommendationReasonGenerator ───

describe('RecommendationReasonGenerator', () => {
  const generator = new RecommendationReasonGenerator()
  const profile = makeProfile()

  it('should generate because-you-watched when source known', () => {
    const item = makeItem('m1', ['Action', 'Sci-Fi'])
    const reason = generator.generate(item, profile, { sourceTitle: 'Inception', matchedGenres: ['Action'] })
    expect(reason.template).toBe('because-you-watched')
    expect(reason.rendered).toContain('Because you watched')
  })

  it('should generate similar-to for similarity engine items', () => {
    const item = makeItem('m2', ['Drama'])
    const reason = generator.generate(item, profile, {
      sourceTitle: 'The Matrix',
      engineName: 'similarity',
    })
    expect(reason.template).toBe('similar-to')
  })

  it('should generate trending-in-genre with matched genres', () => {
    const item = makeItem('m3', ['Crime Drama'])
    const reason = generator.generate(item, profile, { matchedGenres: ['Crime Drama'] })
    expect(reason.template).toBe('trending-in-genre')
  })

  it('should generate popular-on-provider when provider known', () => {
    const item = makeItem('m4', [])
    const reason = generator.generate(item, profile, { providerName: 'Jellyfin' })
    expect(reason.template).toBe('popular-on-provider')
    expect(reason.rendered).toContain('Jellyfin')
  })

  it('should generate recommended-for-you for personalized users', () => {
    const item = makeItem('m5', [])
    const reason = generator.generate(item, profile, {})
    expect(reason.template).toBe('recommended-for-you')
  })

  it('should generate top-pick for cold start (non-personalized profile)', () => {
    const coldProfile = RecommendationProfile.empty()
    const item = makeItem('m6', [])
    const reason = generator.generate(item, coldProfile, {})
    expect(reason.template).toBe('top-pick')
  })

  it('coldStartReason should always return top-pick', () => {
    const reason = generator.coldStartReason()
    expect(reason.template).toBe('top-pick')
  })
})

// ─── FeedAssemblyService ───

describe('FeedAssemblyService', () => {
  const assembler = new FeedAssemblyService()
  const ctx = makeContext()

  function makeSection(id: string, type: string, itemCount: number): RecommendationSection {
    const items = Array.from({ length: itemCount }, (_, i) =>
      makeItem(`${id}-${i}`, ['Action']),
    )
    return RecommendationSection.create({
      id,
      type: type as any,
      title: `Section ${id}`,
      items,
      source: RecommendationSource.create({ sourceType: 'personalized', label: 'Engine', weight: 1 }),
      metadata: { originalCount: itemCount, diversityFilteredCount: 0, weights: {} },
    })
  }

  it('should assemble a complete feed', () => {
    const section = makeSection('s1', 'for-you', 5)
    const feed = assembler.assemble({
      feedId: 'test-feed',
      sections: [section],
      context: ctx,
      generationTimes: { 'profile-based': 100 },
      activeEngines: ['profile-based'],
      ttl: 60000,
    })

    expect(feed.feedId).toBe('test-feed')
    expect(feed.totalItems).toBe(5)
    expect(feed.metadata.activeEngines).toContain('profile-based')
    expect(feed.metadata.experiment.experimentId).toBe('default')
  })

  it('should sort sections by display order', () => {
    const trending = makeSection('trending', 'trending', 3)
    const forYou = makeSection('for-you', 'for-you', 5)
    const sections = [trending, forYou] // trending first in array
    const feed = assembler.assemble({
      feedId: 'ordered',
      sections,
      context: ctx,
      generationTimes: {},
      activeEngines: [],
      ttl: 60000,
    })
    // 'for-you' has lower display order → should be first
    expect(feed.sections[0].type).toBe('for-you')
  })

  it('should compute confidence from sections', () => {
    const section = makeSection('s1', 'popular', 20) // 20 items → full confidence
    const feed = assembler.assemble({
      feedId: 'confident',
      sections: [section],
      context: ctx,
      generationTimes: {},
      activeEngines: ['profile-based', 'trend-based', 'similarity', 'provider-popularity'],
      ttl: 60000,
    })
    expect(feed.confidence).toBeGreaterThan(0.5)
  })

  it('cold start feed should have lower TTL', () => {
    const trending = makeSection('trending', 'trending', 5)
    const popular = makeSection('popular', 'popular', 5)
    const feed = assembler.assembleColdStart(trending, popular, ctx)
    expect(feed.sections).toHaveLength(2)
    expect(feed.ttl).toBe(30 * 60 * 1000) // 30 min
    expect(feed.feedId).toContain('cold_start')
  })

  it('cold start feed should skip empty sections', () => {
    const trending = makeSection('trending', 'trending', 0)
    const popular = makeSection('popular', 'popular', 5)
    const feed = assembler.assembleColdStart(trending, popular, ctx)
    // Empty trending section should be excluded
    expect(feed.sections).toHaveLength(1)
    expect(feed.sections[0].type).toBe('popular')
  })
})
