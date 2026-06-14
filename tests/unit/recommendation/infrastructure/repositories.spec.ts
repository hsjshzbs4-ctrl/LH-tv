// tests/unit/recommendation/infrastructure/repositories.spec.ts — CE9-D

import { describe, it, expect } from 'vitest'
import { InMemoryStorageAdapter } from '@/modules/recommendation/infrastructure/storage/IStorageAdapter'
import { RecommendationRepository } from '@/modules/recommendation/infrastructure/repositories/RecommendationRepository'
import { AnalyticsRepository } from '@/modules/recommendation/infrastructure/repositories/AnalyticsRepository'
import { SnapshotRepository } from '@/modules/recommendation/infrastructure/repositories/SnapshotRepository'
import { ExperimentRepository } from '@/modules/recommendation/infrastructure/repositories/ExperimentRepository'
import { ProfileRepository } from '@/modules/recommendation/infrastructure/repositories/ProfileRepository'
import { RecommendationFeed } from '@/modules/recommendation/domain/entities/RecommendationFeed'
import { RecommendationSection } from '@/modules/recommendation/domain/entities/RecommendationSection'
import { RecommendationItem } from '@/modules/recommendation/domain/entities/RecommendationItem'
import { RecommendationSource } from '@/modules/recommendation/domain/entities/RecommendationSource'
import { RecommendationContext } from '@/modules/recommendation/domain/entities/RecommendationContext'
import { RecommendationProfile } from '@/modules/recommendation/domain/entities/RecommendationProfile'
import { RecommendationScore } from '@/modules/recommendation/domain/value-objects/RecommendationScore'
import { RecommendationReason } from '@/modules/recommendation/domain/value-objects/RecommendationReason'

function makeFeed(id = 'feed-1'): RecommendationFeed {
  const ctx = RecommendationContext.default()
  const item = RecommendationItem.create({
    mediaId: 'm1', title: 'M', cover: 'x', type: 'movie',
    score: RecommendationScore.zero(),
    reason: RecommendationReason.topPick(),
    sources: [RecommendationSource.create({ sourceType: 'trending', label: 'T', weight: 1 })],
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

describe('RecommendationRepository', () => {
  it('should save and load feed', async () => {
    const repo = new RecommendationRepository(new InMemoryStorageAdapter())
    const feed = makeFeed()
    await repo.save('key-1', feed)
    expect(await repo.load('key-1')).toBeDefined()
  })

  it('should return null for missing key', async () => {
    const repo = new RecommendationRepository(new InMemoryStorageAdapter())
    expect(await repo.load('missing')).toBeNull()
  })

  it('should delete by key', async () => {
    const repo = new RecommendationRepository(new InMemoryStorageAdapter())
    await repo.save('k1', makeFeed('f1'))
    await repo.delete('k1')
    expect(await repo.load('k1')).toBeNull()
  })

  it('should delete by prefix', async () => {
    const repo = new RecommendationRepository(new InMemoryStorageAdapter())
    await repo.save('user:a:feed1', makeFeed('f1'))
    await repo.save('user:a:feed2', makeFeed('f2'))
    await repo.save('user:b:feed1', makeFeed('f3'))
    await repo.deleteByPrefix('user:a')
    expect(await repo.load('user:a:feed1')).toBeNull()
    expect(await repo.load('user:b:feed1')).toBeDefined()
  })
})

describe('AnalyticsRepository', () => {
  it('should save and query events', async () => {
    const repo = new AnalyticsRepository(new InMemoryStorageAdapter())
    await repo.save({ type: 'click', feedId: 'f1', mediaId: 'm1', timestamp: 1000 })
    await repo.save({ type: 'play', feedId: 'f1', mediaId: 'm1', timestamp: 2000 })
    expect(await repo.count({ type: 'click' })).toBe(1)
  })

  it('should query by mediaId', async () => {
    const repo = new AnalyticsRepository(new InMemoryStorageAdapter())
    await repo.save({ type: 'click', feedId: 'f1', mediaId: 'm1', timestamp: 1000 })
    await repo.save({ type: 'click', feedId: 'f1', mediaId: 'm2', timestamp: 2000 })
    expect(await repo.count({ mediaId: 'm1' })).toBe(1)
  })

  it('should save batch', async () => {
    const repo = new AnalyticsRepository(new InMemoryStorageAdapter())
    await repo.saveBatch([
      { type: 'impression', feedId: 'f', timestamp: 1000 },
      { type: 'click', feedId: 'f', timestamp: 2000 },
      { type: 'play', feedId: 'f', timestamp: 3000 },
    ])
    expect(await repo.count({})).toBe(3)
  })
})

describe('SnapshotRepository', () => {
  it('should save and load snapshots', async () => {
    const repo = new SnapshotRepository(new InMemoryStorageAdapter())
    const snap = { id: 's1', capturedAt: 1000, version: '1', inputs: {} as any, outputs: {} as any, metrics: {} as any }
    await repo.save(snap)
    expect((await repo.loadAll())).toHaveLength(1)
  })

  it('should load latest', async () => {
    const repo = new SnapshotRepository(new InMemoryStorageAdapter())
    await repo.save({ id: 's1', capturedAt: 1000, version: '1', inputs: {} as any, outputs: { feed: null, itemCount: 0, sectionCount: 0 }, metrics: {} as any })
    await repo.save({ id: 's2', capturedAt: 2000, version: '1', inputs: {} as any, outputs: { feed: null, itemCount: 0, sectionCount: 0 }, metrics: {} as any })
    expect((await repo.loadLatest())?.id).toBe('s2')
  })
})

describe('ExperimentRepository', () => {
  it('should save and load assignment', async () => {
    const repo = new ExperimentRepository(new InMemoryStorageAdapter(), new InMemoryStorageAdapter())
    await repo.saveAssignment({ userId: 'u1', experimentId: 'e1', variantId: 'v1', assignedAt: 1000 })
    expect(await repo.getAssignment('u1', 'e1')).toBeDefined()
  })

  it('should save and load experiment', async () => {
    const repo = new ExperimentRepository(new InMemoryStorageAdapter(), new InMemoryStorageAdapter())
    await repo.saveExperiment({ id: 'e1', name: 'Test', status: 'running', trafficAllocation: 1.0, variants: [] })
    expect(await repo.getExperiment('e1')).toBeDefined()
  })
})

describe('ProfileRepository', () => {
  it('should save and load profile', async () => {
    const repo = new ProfileRepository(new InMemoryStorageAdapter())
    const profile = RecommendationProfile.empty()
    await repo.save('user-1', profile)
    const loaded = await repo.load('user-1')
    expect(loaded?.dataPoints).toBe(0)
  })

  it('should return null for missing profile', async () => {
    const repo = new ProfileRepository(new InMemoryStorageAdapter())
    expect(await repo.load('unknown')).toBeNull()
  })
})
