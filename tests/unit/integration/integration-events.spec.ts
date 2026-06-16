// tests/unit/integration/integration-events.spec.ts — PATCH 5 Event Bus 测试
import { describe, it, expect, vi } from 'vitest'
import { IntegrationEvent, integrationEvents } from '@/integration/events/integrationEvents'

describe('IntegrationEventBus', () => {
  it('should emit and receive events', () => {
    const cb = vi.fn()
    const unsub = integrationEvents.on(IntegrationEvent.PLAYER_RESUMED, cb)
    integrationEvents.emit(IntegrationEvent.PLAYER_RESUMED, { mediaId: 'm1' })
    expect(cb).toHaveBeenCalledTimes(1)
    expect(cb).toHaveBeenCalledWith(expect.objectContaining({ mediaId: 'm1', timestamp: expect.any(Number) }))
    unsub()
  })

  it('should return unsubscribe function', () => {
    const cb = vi.fn()
    const unsub = integrationEvents.on(IntegrationEvent.PROGRESS_SYNCED, cb)
    unsub()
    integrationEvents.emit(IntegrationEvent.PROGRESS_SYNCED)
    expect(cb).not.toHaveBeenCalled()
  })

  it('should support multiple subscribers', () => {
    const cb1 = vi.fn(); const cb2 = vi.fn()
    const u1 = integrationEvents.on(IntegrationEvent.PLAYER_COMPLETED, cb1)
    const u2 = integrationEvents.on(IntegrationEvent.PLAYER_COMPLETED, cb2)
    integrationEvents.emit(IntegrationEvent.PLAYER_COMPLETED)
    expect(cb1).toHaveBeenCalledTimes(1)
    expect(cb2).toHaveBeenCalledTimes(1)
    u1(); u2()
  })

  it('should clear all listeners', () => {
    const cb = vi.fn()
    integrationEvents.on(IntegrationEvent.RECOMMENDATION_READY, cb)
    integrationEvents.clear()
    integrationEvents.emit(IntegrationEvent.RECOMMENDATION_READY)
    expect(cb).not.toHaveBeenCalled()
  })

  it('should handle errors in callbacks gracefully', () => {
    const badCb = vi.fn(() => { throw new Error('fail') })
    const goodCb = vi.fn()
    integrationEvents.on(IntegrationEvent.WATCH_HISTORY_UPDATED, badCb)
    integrationEvents.on(IntegrationEvent.WATCH_HISTORY_UPDATED, goodCb)
    expect(() => integrationEvents.emit(IntegrationEvent.WATCH_HISTORY_UPDATED)).not.toThrow()
    expect(goodCb).toHaveBeenCalled()
  })
})
