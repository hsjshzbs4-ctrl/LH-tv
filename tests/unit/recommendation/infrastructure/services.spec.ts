// tests/unit/recommendation/infrastructure/services.spec.ts — CE9-D

import { describe, it, expect } from 'vitest'
import { InMemoryStorageAdapter } from '@/modules/recommendation/infrastructure/storage/IStorageAdapter'
import { AnalyticsRepository } from '@/modules/recommendation/infrastructure/repositories/AnalyticsRepository'
import { AnalyticsPersistence } from '@/modules/recommendation/infrastructure/analytics/AnalyticsPersistence'
import { FeedCachePersistence } from '@/modules/recommendation/infrastructure/cache/FeedCachePersistence'
import { RecommendationRepository } from '@/modules/recommendation/infrastructure/repositories/RecommendationRepository'
import { TelemetryPersistence } from '@/modules/recommendation/infrastructure/telemetry/TelemetryPersistence'
import { InfrastructureHealthService } from '@/modules/recommendation/infrastructure/health/InfrastructureHealthService'
import { FeedSerializer } from '@/modules/recommendation/infrastructure/serialization/FeedSerializer'
import { RecommendationFeed } from '@/modules/recommendation/domain/entities/RecommendationFeed'
import { RecommendationSection } from '@/modules/recommendation/domain/entities/RecommendationSection'
import { RecommendationItem } from '@/modules/recommendation/domain/entities/RecommendationItem'
import { RecommendationSource } from '@/modules/recommendation/domain/entities/RecommendationSource'
import { RecommendationContext } from '@/modules/recommendation/domain/entities/RecommendationContext'
import { RecommendationScore } from '@/modules/recommendation/domain/value-objects/RecommendationScore'
import { RecommendationReason } from '@/modules/recommendation/domain/value-objects/RecommendationReason'
import { RecommendationEntityMapper } from '@/modules/recommendation/infrastructure/mappers/RecommendationEntityMapper'

function makeFeed(id = 'feed-1'): RecommendationFeed {
  const ctx = RecommendationContext.default()
  const item = RecommendationItem.create({
    mediaId: 'm1', title: 'Movie', cover: 'x', type: 'movie',
    score: RecommendationScore.zero(),
    reason: RecommendationReason.topPick(),
    sources: [RecommendationSource.create({ sourceType: 'trending', label: 'T', weight: 1 })],
    genres: ['Action'],
  })
  const section = RecommendationSection.create({
    id: 's1', type: 'for-you', title: 'Test', items: [item],
    source: RecommendationSource.create({ sourceType: 'personalized', label: 'P', weight: 1 }),
    metadata: { originalCount: 1, diversityFilteredCount: 0, weights: {} },
  })
  return RecommendationFeed.create({
    feedId: id, sections: [section], generatedAt: Date.now(), ttl: 60000, context: ctx,
    metadata: {
      confidence: 0.8, activeEngines: [], generationTimes: {}, totalItems: 1, deduplicatedCount: 0,
      sourceAttribution: [], experiment: { experimentId: 'e', variantId: 'v', strategyWeights: {} }, schemaVersion: 1,
    },
  })
}

describe('AnalyticsPersistence', () => {
  it('should compute stats', async () => {
    const repo = new AnalyticsRepository(new InMemoryStorageAdapter())
    const persistence = new AnalyticsPersistence(repo)
    await repo.saveBatch([
      { type: 'impression', feedId: 'f1', mediaId: 'm1', timestamp: Date.now() },
      { type: 'impression', feedId: 'f1', mediaId: 'm2', timestamp: Date.now() },
      { type: 'click', feedId: 'f1', mediaId: 'm1', timestamp: Date.now() },
    ])
    const stats = await persistence.getStats(1)
    expect(stats.totalImpressions).toBe(2)
    expect(stats.totalClicks).toBe(1)
    expect(stats.ctr).toBe(0.5)
  })
})

describe('FeedCachePersistence', () => {
  it('should persist and read feed', async () => {
    const repo = new RecommendationRepository(new InMemoryStorageAdapter())
    const cache = new FeedCachePersistence(repo)
    const feed = makeFeed()
    await cache.write('key-1', feed)
    const loaded = await cache.read('key-1')
    expect(loaded?.feedId).toBe('feed-1')
  })

  it('should invalidate by user', async () => {
    const repo = new RecommendationRepository(new InMemoryStorageAdapter())
    const cache = new FeedCachePersistence(repo)
    await cache.write('recommendation:alice:feed1', makeFeed('f1'))
    await cache.write('recommendation:alice:feed2', makeFeed('f2'))
    await cache.invalidateByUser('alice')
    expect(await cache.read('recommendation:alice:feed1')).toBeNull()
  })
})

describe('TelemetryPersistence', () => {
  it('should persist events', async () => {
    const repo = new AnalyticsRepository(new InMemoryStorageAdapter())
    const persistence = new TelemetryPersistence(repo)
    await persistence.persist({ type: 'click', feedId: 'f1', timestamp: Date.now() })
    const events = await persistence.getRecentEvents('click', 10)
    expect(events).toHaveLength(1)
  })
})

describe('InfrastructureHealthService', () => {
  it('should report healthy with no checks', async () => {
    const svc = new InfrastructureHealthService()
    expect(await svc.isHealthy()).toBe(true)
  })

  it('should report unhealthy if checks fail', async () => {
    const svc = new InfrastructureHealthService()
    svc.registerCheck(async () => ({ name: 'db', status: 'unhealthy', details: 'Connection refused' }))
    expect(await svc.isHealthy()).toBe(false)
  })

  it('should report degraded for mixed status', async () => {
    const svc = new InfrastructureHealthService()
    svc.registerCheck(async () => ({ name: 'db', status: 'healthy', details: 'OK' }))
    svc.registerCheck(async () => ({ name: 'cache', status: 'degraded', details: 'Slow' }))
    const health = await svc.getHealth()
    expect(health.overallStatus).toBe('degraded')
  })
})

describe('FeedSerializer', () => {
  it('should serialize and deserialize', () => {
    const serializer = new FeedSerializer()
    const feed = makeFeed()
    const json = serializer.serialize(feed)
    expect(json).toContain('feed-1')
    const restored = serializer.deserialize(json)
    expect(restored).not.toBeNull()
  })

  it('should return null on invalid JSON', () => {
    const serializer = new FeedSerializer()
    expect(serializer.deserialize('invalid')).toBeNull()
  })
})

describe('RecommendationEntityMapper', () => {
  it('should round-trip item', () => {
    const item = RecommendationItem.create({
      mediaId: 'm1', title: 'Movie', cover: 'x', type: 'movie', year: 2024,
      score: RecommendationScore.create({ interestScore: 0.8, noveltyScore: 0.5, diversityScore: 0.5, popularityScore: 0.5, freshnessScore: 0.5 }),
      reason: RecommendationReason.recommendedForYou(),
      sources: [RecommendationSource.create({ sourceType: 'personalized', label: 'P', weight: 1 })],
      genres: ['Action'],
    })
    const stored = RecommendationEntityMapper.toStorage(item)
    expect(stored.mediaId).toBe('m1')
    expect(stored.composite).toBeGreaterThan(0)

    const restored = RecommendationEntityMapper.fromStorage(stored)
    expect(restored.mediaId).toBe('m1')
  })
})
