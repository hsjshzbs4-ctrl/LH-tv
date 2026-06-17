// tests/unit/platform/data/metrics-aggregator.spec.ts — MetricsAggregator 单元测试

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { MetricsAggregator } from '@platform/data/aggregation/MetricsAggregator'
import { EventCategory, EventSource, type UnifiedEvent } from '@platform/data/types/data.types'

vi.mock('@/shared/storage/storage.service', () => ({
  storageService: {
    getSettings: vi.fn().mockResolvedValue({}),
    setSettings: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('@platform/flags', () => ({
  featureFlagManager: { isEnabled: vi.fn().mockReturnValue(true) },
  FeatureState: { OFF: 'OFF', INTERNAL: 'INTERNAL', PUBLIC: 'PUBLIC' },
}))

// Mock DataPipeline to inject events
const mockHandlers: Array<(e: UnifiedEvent) => void> = []

vi.mock('@platform/data/pipeline/DataPipeline', () => ({
  dataPipeline: {
    onFlush: (handler: (e: UnifiedEvent) => void) => {
      mockHandlers.push(handler)
      return () => {
        const idx = mockHandlers.indexOf(handler)
        if (idx >= 0) mockHandlers.splice(idx, 1)
      }
    },
    bufferSize: 0,
  },
}))

function makeEvent(overrides?: Partial<UnifiedEvent>): UnifiedEvent {
  return {
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    category: EventCategory.PLAYBACK,
    name: 'playback:start',
    timestamp: Date.now(),
    source: EventSource.PLAYER,
    payload: { durationMs: 60000 },
    ...overrides,
  }
}

function emitToPipeline(event: UnifiedEvent): void {
  for (const handler of mockHandlers) {
    handler(event)
  }
}

describe('MetricsAggregator', () => {
  let aggregator: MetricsAggregator

  beforeEach(() => {
    mockHandlers.length = 0
    aggregator = new MetricsAggregator()
    aggregator.start()
  })

  it('processes events and produces daily metrics', () => {
    emitToPipeline(makeEvent({ name: 'playback:start', payload: { durationMs: 120000 } }))
    emitToPipeline(makeEvent({ name: 'playback:start', payload: { durationMs: 60000 } }))
    emitToPipeline(makeEvent({ name: 'playback:error', category: EventCategory.RECOVERY }))

    const metrics = aggregator.getDailyMetrics()
    expect(metrics.totalEvents).toBe(3)
    expect(metrics.playbackStarts).toBe(2)
    expect(metrics.playbackErrors).toBe(1)
    expect(metrics.totalWatchTimeMs).toBe(180000)
  })

  it('tracks active users', () => {
    emitToPipeline(makeEvent({ payload: { userId: 'user-a' } }))
    emitToPipeline(makeEvent({ payload: { userId: 'user-b' } }))
    emitToPipeline(makeEvent({ payload: { userId: 'user-a' } })) // 重复用户

    const metrics = aggregator.getDailyMetrics()
    expect(metrics.activeUsers).toBe(2)
  })

  it('provides realtime metrics', () => {
    emitToPipeline(makeEvent())
    emitToPipeline(makeEvent())

    const realtime = aggregator.getRealtimeMetrics()
    expect(realtime.eventsPerMinute).toBeGreaterThan(0)
  })

  it('counts crash and recovery events', () => {
    emitToPipeline(makeEvent({
      name: 'crash',
      category: EventCategory.RECOVERY,
    }))
    emitToPipeline(makeEvent({
      name: 'recovery',
      category: EventCategory.RECOVERY,
    }))

    const metrics = aggregator.getDailyMetrics()
    expect(metrics.crashCount).toBe(1)
    expect(metrics.recoveryCount).toBe(1)
  })

  afterEach(() => {
    aggregator.stop()
  })
})
