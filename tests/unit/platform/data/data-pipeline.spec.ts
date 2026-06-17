// tests/unit/platform/data/data-pipeline.spec.ts — DataPipeline 单元测试

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DataPipeline } from '@platform/data/pipeline/DataPipeline'
import {
  EventCategory,
  EventSource,
  type UnifiedEvent,
  type IIngestionSource,
} from '@platform/data/types/data.types'

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

function makeEvent(overrides?: Partial<UnifiedEvent>): UnifiedEvent {
  return {
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    category: EventCategory.PLAYBACK,
    name: 'playback:start',
    timestamp: Date.now(),
    source: EventSource.PLAYER,
    payload: {},
    ...overrides,
  }
}

function makeSource(name: string, source: EventSource): IIngestionSource {
  let handler: ((e: UnifiedEvent) => void) | null = null
  return {
    name,
    source,
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    onEvent(h: (e: UnifiedEvent) => void) {
      handler = h
      return () => { handler = null }
    },
    // Expose for testing
    emit(e: UnifiedEvent) { handler?.(e) },
  } as IIngestionSource & { emit(e: UnifiedEvent): void }
}

describe('DataPipeline', () => {
  let pipeline: DataPipeline

  beforeEach(() => {
    pipeline = new DataPipeline({ autoStart: false, flushIntervalMs: 0, maxBufferSize: 50 })
  })

  // ── Source Management ──

  it('registers and lists ingestion sources', () => {
    const source = makeSource('test-player', EventSource.PLAYER)
    pipeline.registerSource(source)
    expect(pipeline.getSources()).toHaveLength(1)
  })

  it('unregisters sources', () => {
    const source = makeSource('test-player', EventSource.PLAYER)
    pipeline.registerSource(source)
    pipeline.unregisterSource('test-player')
    expect(pipeline.getSources()).toHaveLength(0)
  })

  // ── Event Ingestion ──

  it('ingests events into buffer', () => {
    const event = makeEvent()
    pipeline.ingest(event)
    expect(pipeline.bufferSize).toBe(1)
  })

  it('deduplicates events by ID', () => {
    const event = makeEvent({ id: 'duplicate-id' })
    pipeline.ingest(event)
    pipeline.ingest(event)
    expect(pipeline.bufferSize).toBe(1)
  })

  it('flushes when buffer exceeds max size', () => {
    const smallPipeline = new DataPipeline({ autoStart: false, flushIntervalMs: 0, maxBufferSize: 5 })

    const handler = vi.fn()
    smallPipeline.onFlush(handler)

    for (let i = 0; i < 10; i++) {
      smallPipeline.ingest(makeEvent({ id: `evt-${i}` }))
    }

    // flush 清除整个缓冲区: 每 5 个 event 填满缓冲区触发 flush
    // 10 个 event 触发 10 次 handler 调用 (每次 flush 处理缓冲区中所有事件)
    expect(handler).toHaveBeenCalledTimes(10)
  })

  // ── Flush Handler ──

  it('calls flush handlers with batched events', () => {
    const handler = vi.fn()
    pipeline.onFlush(handler)

    const events = [makeEvent(), makeEvent(), makeEvent()]
    pipeline.ingestBatch(events)
    pipeline.flush()

    expect(handler).toHaveBeenCalledTimes(3)
    expect(pipeline.bufferSize).toBe(0)
  })

  it('unsubscribe removes handler', () => {
    const handler = vi.fn()
    const unsub = pipeline.onFlush(handler)
    unsub()

    pipeline.ingest(makeEvent())
    pipeline.flush()
    expect(handler).not.toHaveBeenCalled()
  })

  // ── Lifecycle ──

  it('starts and stops pipeline', async () => {
    const source = makeSource('test-src', EventSource.PLAYER)
    pipeline.registerSource(source)

    await pipeline.start()
    expect(pipeline.isRunning).toBe(true)

    await pipeline.stop()
    expect(pipeline.isRunning).toBe(false)
  })
})
