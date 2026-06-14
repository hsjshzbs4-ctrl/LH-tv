// tests/unit/recommendation/application/orchestrator.spec.ts — CE9-B Orchestrator Tests

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RecommendationOrchestrator } from '@/modules/recommendation/application/orchestrators/RecommendationOrchestrator'
import type { OrchestratorDependencies } from '@/modules/recommendation/application/orchestrators/RecommendationOrchestrator'
import type { RecommendationRequestDto } from '@/modules/recommendation/application/dto/RecommendationRequestDto'
import type { IRecommendationProfilePort } from '@/modules/recommendation/application/ports/IRecommendationProfilePort'
import type { IRecommendationCachePort } from '@/modules/recommendation/application/ports/IRecommendationCachePort'
import type { IRecommendationGenerator } from '@/modules/recommendation/domain/contracts/IRecommendationGenerator'
import { RecommendationProfile } from '@/modules/recommendation/domain/entities/RecommendationProfile'
import { RecommendationFeed } from '@/modules/recommendation/domain/entities/RecommendationFeed'
import { RecommendationSection } from '@/modules/recommendation/domain/entities/RecommendationSection'
import { RecommendationItem } from '@/modules/recommendation/domain/entities/RecommendationItem'
import { RecommendationSource } from '@/modules/recommendation/domain/entities/RecommendationSource'
import { RecommendationContext } from '@/modules/recommendation/domain/entities/RecommendationContext'
import { RecommendationScore } from '@/modules/recommendation/domain/value-objects/RecommendationScore'
import { RecommendationReason } from '@/modules/recommendation/domain/value-objects/RecommendationReason'
import { RecommendationValidationError } from '@/modules/recommendation/application/errors/RecommendationErrors'
import { FeedGenerationFailedError } from '@/modules/recommendation/application/errors/RecommendationErrors'
import { ProfileNotFoundError } from '@/modules/recommendation/application/errors/RecommendationErrors'

// ─── Helpers ───

function makeRequest(overrides?: Partial<RecommendationRequestDto>): RecommendationRequestDto {
  return {
    requestId: 'req-1',
    userId: 'user-1',
    experimentId: 'exp-1',
    variantId: 'variant-a',
    timestamp: Date.now(),
    feedType: 'personalized',
    limit: 10,
    offset: 0,
    ...overrides,
  }
}

function makeFeed(): RecommendationFeed {
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
  return RecommendationFeed.create({
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
      experiment: { experimentId: 'exp-1', variantId: 'variant-a', strategyWeights: {} },
      schemaVersion: 1,
    },
  })
}

function makeMocks() {
  const profilePort: IRecommendationProfilePort = {
    loadProfile: vi.fn().mockResolvedValue(RecommendationProfile.create({
      generatedAt: Date.now(),
      genrePreferences: [{ genre: 'Action', weight: 0.8, frequency: 5, lastSeen: Date.now() }],
      personPreferences: [],
      contentTypePreference: { movieRatio: 0.5, tvRatio: 0.3, animeRatio: 0.2 },
      preferredYears: [],
      favoriteMediaIds: ['fav-1'],
      historyMediaIds: [],
      dataPoints: 3,
    })),
    saveProfile: vi.fn().mockResolvedValue(undefined),
    refreshProfile: vi.fn().mockResolvedValue(RecommendationProfile.empty()),
  }

  const cachePort: IRecommendationCachePort = {
    readFeed: vi.fn().mockResolvedValue(null), // default: cache miss
    writeFeed: vi.fn().mockResolvedValue(undefined),
    invalidateFeed: vi.fn().mockResolvedValue(undefined),
    invalidateAll: vi.fn().mockResolvedValue(undefined),
  }

  const generator: IRecommendationGenerator = {
    generateFeed: vi.fn().mockResolvedValue(makeFeed()),
  }

  return { profilePort, cachePort, generator }
}

// ─── Tests ───

describe('RecommendationOrchestrator', () => {
  let mocks: ReturnType<typeof makeMocks>
  let orchestrator: RecommendationOrchestrator

  beforeEach(() => {
    mocks = makeMocks()
    orchestrator = new RecommendationOrchestrator({
      profilePort: mocks.profilePort,
      cachePort: mocks.cachePort,
      generator: mocks.generator,
    })
  })

  it('should execute full pipeline successfully', async () => {
    const response = await orchestrator.execute(makeRequest())

    expect(response.requestId).toBe('req-1')
    expect(response.feed).toBeDefined()
    expect(response.cacheHit).toBe(false)
    expect(response.duration).toBeGreaterThanOrEqual(0)
    expect(mocks.generator.generateFeed).toHaveBeenCalled()
  })

  it('should throw ValidationError for invalid request', async () => {
    await expect(orchestrator.execute(makeRequest({ userId: '' })))
      .rejects.toThrow(RecommendationValidationError)
  })

  it('should throw ProfileNotFoundError when profile load fails', async () => {
    mocks.profilePort.loadProfile = vi.fn().mockRejectedValue(new Error('DB error'))

    await expect(orchestrator.execute(makeRequest()))
      .rejects.toThrow(ProfileNotFoundError)
  })

  it('should use empty profile when null returned', async () => {
    mocks.profilePort.loadProfile = vi.fn().mockResolvedValue(null)

    const response = await orchestrator.execute(makeRequest())
    expect(response).toBeDefined()
    expect(mocks.generator.generateFeed).toHaveBeenCalled()
  })

  it('should return cached feed on cache hit', async () => {
    const cachedFeed = makeFeed()
    mocks.cachePort.readFeed = vi.fn().mockResolvedValue(cachedFeed)

    const response = await orchestrator.execute(makeRequest())
    expect(response.cacheHit).toBe(true)
    // Generator should NOT be called on cache hit
    expect(mocks.generator.generateFeed).not.toHaveBeenCalled()
  })

  it('should skip expired cached feed', async () => {
    // Create a feed that's already expired
    const ctx = RecommendationContext.default()
    const oldFeed = RecommendationFeed.create({
      feedId: 'old',
      sections: [],
      generatedAt: Date.now() - 120000, // 2 min ago
      ttl: 60000, // 1 min TTL — expired
      context: ctx,
      metadata: {
        confidence: 0, activeEngines: [], generationTimes: {},
        totalItems: 0, deduplicatedCount: 0, sourceAttribution: [],
        experiment: { experimentId: 'e', variantId: 'v', strategyWeights: {} },
        schemaVersion: 1,
      },
    })
    mocks.cachePort.readFeed = vi.fn().mockResolvedValue(oldFeed)

    const response = await orchestrator.execute(makeRequest())
    expect(response.cacheHit).toBe(false)
    expect(mocks.generator.generateFeed).toHaveBeenCalled()
  })

  it('should continue on cache read error', async () => {
    mocks.cachePort.readFeed = vi.fn().mockRejectedValue(new Error('cache down'))

    const response = await orchestrator.execute(makeRequest())
    expect(response.cacheHit).toBe(false)
    // Should still generate successfully
    expect(response.feed).toBeDefined()
  })

  it('should throw FeedGenerationFailedError on generator failure', async () => {
    mocks.generator.generateFeed = vi.fn().mockRejectedValue(new Error('generator crash'))

    await expect(orchestrator.execute(makeRequest()))
      .rejects.toThrow(FeedGenerationFailedError)
  })

  it('should collect events', async () => {
    await orchestrator.execute(makeRequest())
    const events = orchestrator.getEvents()
    expect(events.length).toBeGreaterThan(0)
    // First event should be cache miss, last should be delivered
    const lastEvent = events[events.length - 1]
    expect(lastEvent.type).toBe('app:recommendation:delivered')
  })

  it('should build correct cache key', async () => {
    await orchestrator.execute(makeRequest({
      userId: 'alice',
      feedType: 'trending',
      experimentId: 'exp-42',
      variantId: 'variant-b',
    }))

    expect(mocks.cachePort.readFeed).toHaveBeenCalledWith(
      'recommendation:alice:trending:exp-42:variant-b',
    )
  })

  it('should write to cache after generation', async () => {
    await orchestrator.execute(makeRequest())
    expect(mocks.cachePort.writeFeed).toHaveBeenCalled()
  })
})
