// tests/unit/recommendation/application/mappers.spec.ts — CE9-B Mapper Tests

import { describe, it, expect } from 'vitest'
import { ItemMapper } from '@/modules/recommendation/application/mappers/ItemMapper'
import { FeedMapper } from '@/modules/recommendation/application/mappers/FeedMapper'
import { ProfileMapper } from '@/modules/recommendation/application/mappers/ProfileMapper'
import { RecommendationItem } from '@/modules/recommendation/domain/entities/RecommendationItem'
import { RecommendationFeed } from '@/modules/recommendation/domain/entities/RecommendationFeed'
import { RecommendationProfile } from '@/modules/recommendation/domain/entities/RecommendationProfile'
import { RecommendationSection } from '@/modules/recommendation/domain/entities/RecommendationSection'
import { RecommendationSource } from '@/modules/recommendation/domain/entities/RecommendationSource'
import { RecommendationContext } from '@/modules/recommendation/domain/entities/RecommendationContext'
import { RecommendationScore } from '@/modules/recommendation/domain/value-objects/RecommendationScore'
import { RecommendationReason } from '@/modules/recommendation/domain/value-objects/RecommendationReason'

// ─── ItemMapper ───

describe('ItemMapper', () => {
  function makeItem() {
    return RecommendationItem.create({
      mediaId: 'm1',
      title: 'Test Movie',
      cover: 'https://example.com/poster.jpg',
      type: 'movie',
      year: 2024,
      score: RecommendationScore.create({
        interestScore: 0.8, noveltyScore: 0.6, diversityScore: 0.5,
        popularityScore: 0.7, freshnessScore: 0.4,
      }),
      reason: RecommendationReason.becauseYouWatched('Inception'),
      sources: [
        RecommendationSource.create({ sourceType: 'personalized', label: 'Profile', weight: 1 }),
      ],
      genres: ['Action', 'Sci-Fi'],
      rating: 8.5,
      overview: 'A great movie',
      availableOn: ['Jellyfin'],
    })
  }

  it('should map entity to DTO', () => {
    const item = makeItem()
    const dto = ItemMapper.toDto(item)

    expect(dto.mediaId).toBe('m1')
    expect(dto.title).toBe('Test Movie')
    expect(dto.type).toBe('movie')
    expect(dto.score.interestScore).toBe(0.8)
    expect(dto.score.composite).toBeGreaterThan(0)
    expect(dto.reason.rendered).toContain('Because you watched')
    expect(dto.sources).toHaveLength(1)
    expect(dto.genres).toEqual(['Action', 'Sci-Fi'])
    expect(dto.rating).toBe(8.5)
    expect(dto.availableOn).toEqual(['Jellyfin'])
  })

  it('should handle empty optional fields', () => {
    const item = RecommendationItem.create({
      mediaId: 'm2',
      title: 'Minimal',
      cover: 'x',
      type: 'tv',
      score: RecommendationScore.zero(),
      reason: RecommendationReason.topPick(),
      sources: [RecommendationSource.create({ sourceType: 'trending', label: 'Trend', weight: 0.5 })],
    })
    const dto = ItemMapper.toDto(item)
    expect(dto.genres).toBeUndefined()
    expect(dto.availableOn).toBeUndefined()
  })

  it('toDtoList should map arrays', () => {
    const items = [makeItem(), makeItem()]
    const dtos = ItemMapper.toDtoList(items)
    expect(dtos).toHaveLength(2)
  })
})

// ─── FeedMapper ───

describe('FeedMapper', () => {
  it('should map feed to DTO', () => {
    const ctx = RecommendationContext.default()
    const item = RecommendationItem.create({
      mediaId: 'm1', title: 'Movie', cover: 'x', type: 'movie',
      score: RecommendationScore.zero(),
      reason: RecommendationReason.recommendedForYou(),
      sources: [RecommendationSource.create({ sourceType: 'personalized', label: 'P', weight: 1 })],
    })
    const section = RecommendationSection.create({
      id: 's1', type: 'for-you', title: 'For You',
      items: [item],
      source: RecommendationSource.create({ sourceType: 'personalized', label: 'P', weight: 1 }),
      metadata: { originalCount: 1, diversityFilteredCount: 0, weights: {} },
    })
    const feed = RecommendationFeed.create({
      feedId: 'feed-1',
      sections: [section],
      generatedAt: Date.now(),
      ttl: 60000,
      context: ctx,
      metadata: {
        confidence: 0.8,
        activeEngines: ['profile-based'],
        generationTimes: { 'profile-based': 100 },
        totalItems: 1,
        deduplicatedCount: 0,
        sourceAttribution: [{ sourceType: 'personalized', itemCount: 1, weight: 1 }],
        experiment: { experimentId: 'e1', variantId: 'v1', strategyWeights: {} },
        schemaVersion: 1,
      },
    })

    const dto = FeedMapper.toDto(feed)
    expect(dto.feedId).toBe('feed-1')
    expect(dto.version).toBe(1)
    expect(dto.sections).toHaveLength(1)
    expect(dto.metadata.confidence).toBe(0.8)
    expect(dto.metadata.experiment.experimentId).toBe('e1')
  })

  it('should skip empty sections', () => {
    const ctx = RecommendationContext.default()
    const emptySection = RecommendationSection.create({
      id: 'empty', type: 'trending', title: 'Trending',
      items: [],
      source: RecommendationSource.create({ sourceType: 'trending', label: 'T', weight: 1 }),
      metadata: { originalCount: 0, diversityFilteredCount: 0, weights: {} },
    })
    const feed = RecommendationFeed.create({
      feedId: 'feed-empty-section',
      sections: [emptySection],
      generatedAt: Date.now(),
      ttl: 60000,
      context: ctx,
      metadata: {
        confidence: 0, activeEngines: [], generationTimes: {},
        totalItems: 0, deduplicatedCount: 0, sourceAttribution: [],
        experiment: { experimentId: 'e', variantId: 'v', strategyWeights: {} },
        schemaVersion: 1,
      },
    })

    const dto = FeedMapper.toDto(feed)
    expect(dto.sections).toHaveLength(0)
  })
})

// ─── ProfileMapper ───

describe('ProfileMapper', () => {
  it('should map profile to DTO', () => {
    const profile = RecommendationProfile.create({
      generatedAt: 1000000,
      genrePreferences: [
        { genre: 'Action', weight: 0.9, frequency: 10, lastSeen: Date.now() },
      ],
      personPreferences: [
        { personId: 'p1', name: 'Actor A', weight: 0.8, frequency: 5 },
      ],
      contentTypePreference: { movieRatio: 0.6, tvRatio: 0.3, animeRatio: 0.1 },
      preferredYears: [{ year: 2024, weight: 0.8 }],
      favoriteMediaIds: ['fav-1'],
      historyMediaIds: ['hist-1'],
      dataPoints: 5,
    })

    const dto = ProfileMapper.toDto(profile)
    expect(dto.dataPoints).toBe(5)
    expect(dto.genrePreferences).toHaveLength(1)
    expect(dto.genrePreferences[0].genre).toBe('Action')
    expect(dto.favoriteMediaIds).toEqual(['fav-1'])
  })

  it('should map DTO back to domain (round trip)', () => {
    const original = RecommendationProfile.empty()
    const dto = ProfileMapper.toDto(original)
    const restored = ProfileMapper.toDomain(dto)

    expect(restored.dataPoints).toBe(original.dataPoints)
    expect(restored.generatedAt).toBe(original.generatedAt)
  })

  it('should preserve multi-genre preferences', () => {
    const profile = RecommendationProfile.create({
      generatedAt: Date.now(),
      genrePreferences: [
        { genre: 'Action', weight: 0.9, frequency: 10, lastSeen: Date.now() },
        { genre: 'Comedy', weight: 0.7, frequency: 8, lastSeen: Date.now() },
        { genre: 'Drama', weight: 0.5, frequency: 5, lastSeen: Date.now() },
      ],
      personPreferences: [],
      contentTypePreference: { movieRatio: 0.5, tvRatio: 0.3, animeRatio: 0.2 },
      preferredYears: [],
      favoriteMediaIds: ['m1', 'm2', 'm3'],
      historyMediaIds: ['h1'],
      dataPoints: 10,
    })

    const dto = ProfileMapper.toDto(profile)
    expect(dto.genrePreferences).toHaveLength(3)
    expect(dto.favoriteMediaIds).toHaveLength(3)
    expect(dto.dataPoints).toBe(10)
  })

  it('should handle person preferences with job info', () => {
    const profile = RecommendationProfile.create({
      generatedAt: Date.now(),
      genrePreferences: [],
      personPreferences: [
        { personId: 'p1', name: 'Director One', job: 'Director', weight: 0.9, frequency: 3 },
        { personId: 'p2', name: 'Actor Two', job: 'Actor', weight: 0.6, frequency: 2 },
      ],
      contentTypePreference: { movieRatio: 1, tvRatio: 0, animeRatio: 0 },
      preferredYears: [],
      favoriteMediaIds: [],
      historyMediaIds: [],
      dataPoints: 3,
    })

    const dto = ProfileMapper.toDto(profile)
    expect(dto.personPreferences).toHaveLength(2)
    expect(dto.personPreferences[0].job).toBe('Director')
  })
})
