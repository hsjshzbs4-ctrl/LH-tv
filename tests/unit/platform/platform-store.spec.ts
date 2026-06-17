// tests/unit/platform/platform-store.spec.ts — Platform Store 单元测试

import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePlatformStore } from '@/stores/platformStore'
import { PluginType, PluginState, type PluginManifest } from '@platform/plugins/types/plugin.types'
import { SyncStatus } from '@platform/cloud/types/cloud.types'
import { FeatureState, PB5Subsystem } from '@platform/flags/types/flag.types'

describe('PlatformStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with empty state', () => {
    const store = usePlatformStore()
    expect(store.dailyMetrics).toBeNull()
    expect(store.plugins).toEqual([])
    expect(store.flags).toEqual([])
    expect(store.syncStatus).toBe(SyncStatus.IDLE)
  })

  it('sets and reads metrics', () => {
    const store = usePlatformStore()
    const daily = {
      date: '2026-06-17',
      totalEvents: 100,
      activeUsers: 10,
      totalWatchTimeMs: 3600000,
      playbackStarts: 50,
      playbackErrors: 2,
      crashCount: 1,
      recoveryCount: 0,
      avgSessionDurationMs: 600000,
      categoryBreakdown: { playback: 80 },
    }

    store.setMetrics(daily, { timestamp: Date.now(), eventsPerMinute: 5, activeUsersLast5Min: 3, errorsLast5Min: 0, ingestBacklog: 0 })
    expect(store.totalEvents).toBe(100)
    expect(store.activeUsers).toBe(10)
    expect(store.crashCount).toBe(1)
  })

  it('computes active flags correctly', () => {
    const store = usePlatformStore()
    store.setFlags([
      { key: 'pb5.ai', state: FeatureState.OFF, description: '', subsystem: PB5Subsystem.AI, runtimeToggle: false },
      { key: 'pb5.cloud', state: FeatureState.INTERNAL, description: '', subsystem: PB5Subsystem.CLOUD, runtimeToggle: true },
    ])
    expect(store.activeFlags).toHaveLength(1)
  })

  it('computes enabled plugins correctly', () => {
    const store = usePlatformStore()
    const manifest: PluginManifest = {
      id: 'p1', name: 'P1', version: '1.0', type: PluginType.METADATA_PROVIDER,
      description: '', author: '', permissions: [], dependencies: [],
      state: PluginState.ENABLED, installedAt: 0, updatedAt: 0,
    }
    store.setPlugins([manifest])
    expect(store.enabledPlugins).toHaveLength(1)
  })

  it('resets to initial state', () => {
    const store = usePlatformStore()
    store.setMetrics(
      { date: '', totalEvents: 1, activeUsers: 1, totalWatchTimeMs: 0, playbackStarts: 0, playbackErrors: 0, crashCount: 0, recoveryCount: 0, avgSessionDurationMs: 0, categoryBreakdown: {} },
      null,
    )
    store.reset()
    expect(store.totalEvents).toBe(0)
  })
})
