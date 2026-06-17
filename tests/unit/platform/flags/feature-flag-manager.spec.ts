// tests/unit/platform/flags/feature-flag-manager.spec.ts — FeatureFlagManager 单元测试

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { FeatureFlagManager } from '@platform/flags/manager/FeatureFlagManager'
import { FeatureState, PB5Subsystem, type FeatureFlag } from '@platform/flags/types/flag.types'
import { flagStorage } from '@platform/flags/storage/FlagStorage'

// Mock storageService: 避免真实持久化
vi.mock('@/shared/storage/storage.service', () => ({
  storageService: {
    getSettings: vi.fn().mockResolvedValue({}),
    setSettings: vi.fn().mockResolvedValue(undefined),
  },
}))

const TEST_FLAGS: FeatureFlag[] = [
  {
    key: 'pb5.test_a',
    state: FeatureState.OFF,
    description: 'Test flag A',
    subsystem: PB5Subsystem.ACCOUNT,
    runtimeToggle: true,
  },
  {
    key: 'pb5.test_b',
    state: FeatureState.INTERNAL,
    description: 'Test flag B',
    subsystem: PB5Subsystem.AI,
    runtimeToggle: false,
  },
  {
    key: 'pb5.test_c',
    state: FeatureState.PUBLIC,
    description: 'Test flag C',
    subsystem: PB5Subsystem.DATA,
    runtimeToggle: true,
    dependencies: ['pb5.test_a'],
  },
]

describe('FeatureFlagManager', () => {
  let manager: FeatureFlagManager

  beforeEach(async () => {
    flagStorage.invalidateCache() // 测试隔离
    manager = new FeatureFlagManager({ defaults: TEST_FLAGS })
    await manager.initialize()
  })

  // ── isEnabled ──

  it('returns false for OFF flag', () => {
    expect(manager.isEnabled('pb5.test_a')).toBe(false)
  })

  it('returns true for INTERNAL flag', () => {
    expect(manager.isEnabled('pb5.test_b')).toBe(true)
  })

  it('returns true for PUBLIC flag', () => {
    expect(manager.isEnabled('pb5.test_c')).toBe(true)
  })

  it('returns false for unknown flag', () => {
    expect(manager.isEnabled('pb5.nonexistent')).toBe(false)
  })

  // ── getState ──

  it('returns correct FeatureState for each flag', () => {
    expect(manager.getState('pb5.test_a')).toBe(FeatureState.OFF)
    expect(manager.getState('pb5.test_b')).toBe(FeatureState.INTERNAL)
    expect(manager.getState('pb5.test_c')).toBe(FeatureState.PUBLIC)
    expect(manager.getState('pb5.nonexistent')).toBe(FeatureState.OFF)
  })

  // ── isPublic ──

  it('isPublic only returns true for PUBLIC state', () => {
    expect(manager.isPublic('pb5.test_a')).toBe(false)
    expect(manager.isPublic('pb5.test_b')).toBe(false)
    expect(manager.isPublic('pb5.test_c')).toBe(true)
  })

  // ── getFlag ──

  it('returns full flag definition', () => {
    const flag = manager.getFlag('pb5.test_a')
    expect(flag).toBeDefined()
    expect(flag!.key).toBe('pb5.test_a')
    expect(flag!.subsystem).toBe(PB5Subsystem.ACCOUNT)
    expect(flag!.dependencies).toBeUndefined()
  })

  it('returns undefined for unknown flag', () => {
    expect(manager.getFlag('pb5.nonexistent')).toBeUndefined()
  })

  // ── getAllFlags / getActiveFlags ──

  it('getAllFlags returns all registered flags', () => {
    const all = manager.getAllFlags()
    expect(all).toHaveLength(3)
  })

  it('getActiveFlags returns only non-OFF flags', () => {
    const active = manager.getActiveFlags()
    expect(active).toHaveLength(2)
    expect(active.map((f) => f.key).sort()).toEqual(['pb5.test_b', 'pb5.test_c'])
  })

  // ── setOverride ──

  it('setOverride changes flag state', async () => {
    await manager.setOverride('pb5.test_a', FeatureState.PUBLIC, 'test override')

    expect(manager.getState('pb5.test_a')).toBe(FeatureState.PUBLIC)
    expect(manager.isEnabled('pb5.test_a')).toBe(true)
  })

  it('setOverride throws for unknown flag', async () => {
    await expect(
      manager.setOverride('pb5.nonexistent', FeatureState.PUBLIC, 'bad'),
    ).rejects.toThrow('Unknown feature flag')
  })

  // ── clearOverride ──

  it('clearOverride restores default state', async () => {
    await manager.setOverride('pb5.test_b', FeatureState.PUBLIC, 'test')
    expect(manager.getState('pb5.test_b')).toBe(FeatureState.PUBLIC)

    await manager.clearOverride('pb5.test_b')
    expect(manager.getState('pb5.test_b')).toBe(FeatureState.INTERNAL) // 恢复默认
  })

  // ── 订阅机制 ──

  it('notifies subscribers on state change', async () => {
    const subscriber = vi.fn()
    const unsubscribe = manager.subscribe(subscriber)

    await manager.setOverride('pb5.test_a', FeatureState.PUBLIC, 'notify test')

    expect(subscriber).toHaveBeenCalledTimes(1)
    expect(subscriber).toHaveBeenCalledWith({
      flagKey: 'pb5.test_a',
      oldState: FeatureState.OFF,
      newState: FeatureState.PUBLIC,
      source: 'override',
    })

    unsubscribe()
  })

  it('unsubscribe stops notifications', async () => {
    const subscriber = vi.fn()
    const unsubscribe = manager.subscribe(subscriber)
    unsubscribe()

    await manager.setOverride('pb5.test_a', FeatureState.PUBLIC, 'no notify')
    expect(subscriber).not.toHaveBeenCalled()
  })

  // ── export ──

  it('export returns all flags with current states', () => {
    const exported = manager.export()
    expect(exported).toHaveLength(3)
    const a = exported.find((f) => f.key === 'pb5.test_a')!
    expect(a.state).toBe(FeatureState.OFF)
  })

  // ── importFlags ──

  it('importFlags updates existing flag states', () => {
    manager.importFlags([
      { key: 'pb5.test_a', state: FeatureState.PUBLIC } as FeatureFlag,
    ])

    expect(manager.getState('pb5.test_a')).toBe(FeatureState.PUBLIC)
  })

  // ── 依赖关系存储 ──

  it('stores flag dependencies', () => {
    const flagC = manager.getFlag('pb5.test_c')
    expect(flagC!.dependencies).toEqual(['pb5.test_a'])
  })
})
