// tests/unit/governance/eventbus.spec.ts
import { describe, it, expect, vi } from 'vitest'
import { GovernanceEventBus, Priority, GovernanceEventType } from '@governance/index'
vi.mock('@platform/flags', () => ({ featureFlagManager: { isEnabled: vi.fn().mockReturnValue(true) } }))

describe('GovernanceEventBus', () => {
  it('delivers events in priority order', () => {
    const bus = GovernanceEventBus.getInstance()
    bus.clear()
    const order: string[] = []
    bus.subscribe(GovernanceEventType.POLICY, () => order.push('n1'), Priority.LOW)
    bus.subscribe(GovernanceEventType.POLICY, () => order.push('n2'), Priority.HIGH)
    bus.publish(GovernanceEventType.POLICY, 'test', {})
    expect(order).toEqual(['n2', 'n1']) // HIGH before LOW
  })
  it('FIFO within same priority', () => {
    const bus = GovernanceEventBus.getInstance()
    bus.clear()
    const order: string[] = []
    bus.subscribe(GovernanceEventType.AUDIT, () => order.push('a'), Priority.HIGH)
    bus.subscribe(GovernanceEventType.AUDIT, () => order.push('b'), Priority.HIGH)
    bus.publish(GovernanceEventType.AUDIT, 'test', {})
    expect(order).toEqual(['a', 'b'])
  })
  it('dispatchAsync batches events', async () => {
    const bus = GovernanceEventBus.getInstance()
    bus.clear()
    let count = 0
    bus.subscribe(GovernanceEventType.UPDATE, () => count++)
    for (const e of [{ type: GovernanceEventType.UPDATE, priority: Priority.LOW, source: 't', payload: {}, timestamp: 1 }]) {
      bus.dispatchAsync(e)
    }
    bus.flush()
    expect(count).toBe(1)
  })
})
