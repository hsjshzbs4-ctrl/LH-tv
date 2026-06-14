// tests/unit/recommendation/runtime/services.spec.ts — CE9-C Cache, Telemetry, Experiments, Explanations, Snapshots, Metrics, Health Tests

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FeedCache } from '@/modules/recommendation/runtime/cache/FeedCache'
import { TelemetryCollector } from '@/modules/recommendation/runtime/telemetry/TelemetryCollector'
import { ExperimentEngine } from '@/modules/recommendation/runtime/experiments/ExperimentEngine'
import { RecommendationExplanationEngine } from '@/modules/recommendation/runtime/explanations/RecommendationExplanationEngine'
import { RecommendationSnapshotService } from '@/modules/recommendation/runtime/snapshots/RecommendationSnapshotService'
import { RuntimeMetrics } from '@/modules/recommendation/runtime/metrics/RuntimeMetrics'
import { RuntimeHealthService } from '@/modules/recommendation/runtime/health/RuntimeHealthService'
import { RecommendationFeed } from '@/modules/recommendation/domain/entities/RecommendationFeed'
import { RecommendationContext } from '@/modules/recommendation/domain/entities/RecommendationContext'
import { RecommendationProfile } from '@/modules/recommendation/domain/entities/RecommendationProfile'
import { RecommendationItem } from '@/modules/recommendation/domain/entities/RecommendationItem'
import { RecommendationSection } from '@/modules/recommendation/domain/entities/RecommendationSection'
import { RecommendationSource } from '@/modules/recommendation/domain/entities/RecommendationSource'
import { RecommendationScore } from '@/modules/recommendation/domain/value-objects/RecommendationScore'
import { RecommendationReason } from '@/modules/recommendation/domain/value-objects/RecommendationReason'

function makeFeed(feedId = 'feed-1'): RecommendationFeed {
  const ctx = RecommendationContext.default()
  const item = RecommendationItem.create({
    mediaId: 'm1', title: 'Movie', cover: 'x', type: 'movie',
    score: RecommendationScore.zero(),
    reason: RecommendationReason.recommendedForYou(),
    sources: [RecommendationSource.create({ sourceType: 'personalized', label: 'P', weight: 1 })],
  })
  const section = RecommendationSection.create({
    id: 's1', type: 'for-you', title: 'For You', items: [item],
    source: RecommendationSource.create({ sourceType: 'personalized', label: 'P', weight: 1 }),
    metadata: { originalCount: 1, diversityFilteredCount: 0, weights: {} },
  })
  return RecommendationFeed.create({
    feedId, sections: [section], generatedAt: Date.now(), ttl: 60000, context: ctx,
    metadata: {
      confidence: 0.8, activeEngines: ['test'], generationTimes: { test: 10 },
      totalItems: 1, deduplicatedCount: 0,
      sourceAttribution: [{ sourceType: 'personalized', itemCount: 1, weight: 1 }],
      experiment: { experimentId: 'e1', variantId: 'v1', strategyWeights: {} },
      schemaVersion: 1,
    },
  })
}

// ─── FeedCache ───

describe('FeedCache', () => {
  it('should return null on miss', () => {
    const cache = new FeedCache()
    expect(cache.read('key-1')).toBeNull()
  })

  it('should write and read', () => {
    const cache = new FeedCache()
    const feed = makeFeed()
    cache.write('key-1', feed)
    expect(cache.read('key-1')?.feedId).toBe('feed-1')
  })

  it('should invalidate by key', () => {
    const cache = new FeedCache()
    cache.write('key-1', makeFeed())
    cache.invalidate('key-1')
    expect(cache.read('key-1')).toBeNull()
  })

  it('should invalidate by prefix', () => {
    const cache = new FeedCache()
    cache.write('user:alice:feed1', makeFeed('f1'))
    cache.write('user:alice:feed2', makeFeed('f2'))
    cache.write('user:bob:feed1', makeFeed('f3'))
    cache.invalidateByPrefix('user:alice')
    expect(cache.read('user:alice:feed1')).toBeNull()
    expect(cache.read('user:alice:feed2')).toBeNull()
    expect(cache.read('user:bob:feed1')).not.toBeNull()
  })

  it('should evict LRU when at capacity', () => {
    const cache = new FeedCache(3)
    for (let i = 0; i < 5; i++) {
      cache.write(`key-${i}`, makeFeed(`f${i}`))
    }
    const stats = cache.getStats()
    expect(stats.size).toBeLessThanOrEqual(3)
  })

  it('should return cache stats', () => {
    const cache = new FeedCache(10, 300000)
    const stats = cache.getStats()
    expect(stats.maxSize).toBe(10)
    expect(stats.ttlMs).toBe(300000)
  })
})

// ─── TelemetryCollector ───

describe('TelemetryCollector', () => {
  it('should collect events', () => {
    const collector = new TelemetryCollector()
    collector.impression('f1', 's1', ['m1', 'm2'])
    collector.click('f1', 's1', 'm1', 0)
    collector.play('f1', 'm1', 'jellyfin')
    const stats = collector.getStats()
    expect(stats.totalCollected).toBe(3)
  })

  it('should flush events to handler', async () => {
    const collector = new TelemetryCollector(10) // small buffer
    const handler = vi.fn()
    collector.onFlush(handler)
    collector.impression('f1', 's1', ['m1'])
    await collector.flush()
    expect(handler).toHaveBeenCalled()
  })

  it('should handle all 7 event types', () => {
    const collector = new TelemetryCollector()
    collector.impression('f', 's', ['m'])
    collector.click('f', 's', 'm', 0)
    collector.play('f', 'm', 'src')
    collector.favorite('f', 'm')
    collector.dismiss('f', 's', 'm', 'not-interested')
    collector.hide('f', 's')
    collector.complete('f', 'm', 5400, 6000)
    expect(collector.getStats().totalCollected).toBe(7)
  })
})

// ─── ExperimentEngine ───

describe('ExperimentEngine', () => {
  it('should register experiments', () => {
    const engine = new ExperimentEngine()
    engine.registerExperiment({
      id: 'exp-1', name: 'Test', status: 'running', trafficAllocation: 1.0,
      variants: [
        { id: 'control', name: 'Control', weight: 0.5, config: {} },
        { id: 'variant-a', name: 'Variant A', weight: 0.5, config: {} },
      ],
    })
    expect(engine.getExperiment('exp-1')).toBeDefined()
  })

  it('should assign deterministically', () => {
    const engine = new ExperimentEngine()
    engine.registerExperiment({
      id: 'exp-1', name: 'Test', status: 'running', trafficAllocation: 1.0,
      variants: [
        { id: 'control', name: 'Control', weight: 0.5, config: {} },
        { id: 'variant-a', name: 'Variant A', weight: 0.5, config: {} },
      ],
    })
    const a1 = engine.assign('user-1', 'exp-1')
    const a2 = engine.assign('user-1', 'exp-1')
    expect(a1.variantId).toBe(a2.variantId) // deterministic
  })

  it('should return control for unknown experiment', () => {
    const engine = new ExperimentEngine()
    const assignment = engine.assign('user-1', 'unknown')
    expect(assignment.variantId).toBe('control')
  })

  it('should list active experiments', () => {
    const engine = new ExperimentEngine()
    engine.registerExperiment({
      id: 'e1', name: 'Running', status: 'running', trafficAllocation: 1.0,
      variants: [{ id: 'c', name: 'C', weight: 1, config: {} }],
    })
    engine.registerExperiment({
      id: 'e2', name: 'Completed', status: 'completed', trafficAllocation: 1.0,
      variants: [{ id: 'c', name: 'C', weight: 1, config: {} }],
    })
    expect(engine.activeExperiments).toHaveLength(1)
  })
})

// ─── RecommendationExplanationEngine ───

describe('RecommendationExplanationEngine', () => {
  it('should explain personalized items', () => {
    const engine = new RecommendationExplanationEngine()
    const item = RecommendationItem.create({
      mediaId: 'm1', title: 'Movie', cover: 'x', type: 'movie',
      score: RecommendationScore.zero(),
      reason: RecommendationReason.topPick(),
      sources: [RecommendationSource.create({ sourceType: 'personalized', label: 'P', weight: 1 })],
      genres: ['Action'],
    })
    const profile = RecommendationProfile.create({
      generatedAt: Date.now(),
      genrePreferences: [{ genre: 'Action', weight: 0.9, frequency: 5, lastSeen: Date.now() }],
      personPreferences: [],
      contentTypePreference: { movieRatio: 0.5, tvRatio: 0.3, animeRatio: 0.2 },
      preferredYears: [],
      favoriteMediaIds: [],
      historyMediaIds: [],
      dataPoints: 3,
    })
    const reason = engine.explain({ item, profile })
    expect(reason.rendered.length).toBeGreaterThan(0)
    // Item has genres ['Action'] matches profile's Action preference → trending-in-genre
    expect(reason.template).toBe('trending-in-genre')
  })

  it('should explain similar content', () => {
    const engine = new RecommendationExplanationEngine()
    const item = RecommendationItem.create({
      mediaId: 'm1', title: 'Movie', cover: 'x', type: 'movie',
      score: RecommendationScore.zero(),
      reason: RecommendationReason.topPick(),
      sources: [RecommendationSource.create({ sourceType: 'similar', label: 'S', weight: 1 })],
      genres: [],
    })
    const reason = engine.explain({
      item,
      profile: RecommendationProfile.empty(),
      sourceTitle: 'Inception',
      engineName: 'similar-content',
    })
    expect(reason.rendered).toContain('Similar to Inception')
  })

  it('should return top-pick for cold start', () => {
    const engine = new RecommendationExplanationEngine()
    const item = RecommendationItem.create({
      mediaId: 'm1', title: 'Movie', cover: 'x', type: 'movie',
      score: RecommendationScore.zero(),
      reason: RecommendationReason.topPick(),
      sources: [RecommendationSource.create({ sourceType: 'popular', label: 'CS', weight: 1 })],
      genres: [],
    })
    const reason = engine.explain({ item, profile: RecommendationProfile.empty() })
    expect(reason.template).toBe('top-pick')
  })
})

// ─── RecommendationSnapshotService ───

describe('RecommendationSnapshotService', () => {
  it('should capture snapshots', () => {
    const svc = new RecommendationSnapshotService()
    const ctx = RecommendationContext.default()
    const feed = makeFeed()
    const snap = svc.capture(ctx, null, feed, 150, ['test-engine'], false, { 'test-engine': 100 })
    expect(snap.id).toBeDefined()
    expect(snap.outputs.itemCount).toBe(1)
    expect(svc.count).toBeGreaterThanOrEqual(1)
  })

  it('should get latest snapshot', () => {
    const svc = new RecommendationSnapshotService()
    svc.capture(RecommendationContext.default(), null, makeFeed(), 100, [], false, {})
    svc.capture(RecommendationContext.default(), null, makeFeed('f2'), 200, [], false, {})
    expect(svc.getLatest()?.outputs.feed?.feedId).toBe('f2')
  })
})

// ─── RuntimeMetrics ───

describe('RuntimeMetrics', () => {
  it('should track requests', () => {
    const metrics = new RuntimeMetrics()
    metrics.recordRequest(false, 150)
    metrics.recordRequest(true, 50)
    const snap = metrics.snapshot()
    expect(snap.requestsTotal).toBe(2)
    expect(snap.cacheHitRatio).toBe(0.5)
  })

  it('should track provider latencies', () => {
    const metrics = new RuntimeMetrics()
    metrics.recordProviderLatency('test-engine', 100)
    metrics.recordProviderLatency('test-engine', 200)
    const snap = metrics.snapshot()
    expect(snap.providerLatency['test-engine']).toBe(150)
  })
})

// ─── RuntimeHealthService ───

describe('RuntimeHealthService', () => {
  it('should report healthy when engines are healthy', () => {
    const svc = new RuntimeHealthService()
    // Register a mock engine
    svc.registerEngine({
      name: 'test-engine', type: 'personalized', version: '1.0.0', state: 'ready',
      initialize: async () => {}, generate: async () => [], isAvailable: () => true,
      healthCheck: () => ({ state: 'ready', consecutiveErrors: 0, itemsGenerated: 10, averageLatencyMs: 100 }),
      refresh: async () => {}, dispose: async () => {},
    })
    const health = svc.getHealth()
    expect(health.status).toBe('healthy')
    expect(health.engineHealth['test-engine'].state).toBe('ready')
  })
})
