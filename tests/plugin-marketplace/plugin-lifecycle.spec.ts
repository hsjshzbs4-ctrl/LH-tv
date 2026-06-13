// tests/plugin-marketplace/plugin-lifecycle.spec.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { PluginLifecycleManager } from '@/plugin-marketplace/runtime/PluginLifecycleManager'
import { pluginStorage } from '@/plugin-marketplace/storage/PluginStorage'
import { storageService } from '@/shared/storage/storage.service'
import { PluginState } from '@/plugin-marketplace/storage/types'

describe('PluginLifecycleManager', () => {
  let mgr: PluginLifecycleManager

  beforeEach(async () => {
    vi.spyOn(storageService, 'getSettings').mockResolvedValue({})
    vi.spyOn(storageService, 'setSettings').mockResolvedValue()
    await pluginStorage.load()
    mgr = new PluginLifecycleManager()
  })
  afterEach(() => { vi.restoreAllMocks() })

  it('should start in INSTALLED state', () => {
    mgr.getOrCreate('p1')
    expect(mgr.getState('p1')).toBe(PluginState.INSTALLED)
  })

  it('should enable and disable plugin', async () => {
    mgr.getOrCreate('p1')
    await mgr.enable('p1')
    expect(mgr.getState('p1')).toBe(PluginState.ENABLED)

    await mgr.disable('p1')
    expect(mgr.getState('p1')).toBe(PluginState.DISABLED)
  })

  it('should invoke enable/disable hooks', async () => {
    let enabled = false
    let disabled = false
    mgr.getOrCreate('p1', {
      onEnable: async () => { enabled = true },
      onDisable: async () => { disabled = true },
    })

    await mgr.enable('p1')
    expect(enabled).toBe(true)

    await mgr.disable('p1')
    expect(disabled).toBe(true)
  })

  it('should track state change count', async () => {
    mgr.getOrCreate('p1')
    await mgr.enable('p1')
    await mgr.disable('p1')
    const metrics = mgr.getMetrics('p1')
    expect(metrics.stateChanges).toBe(2)
  })

  it('should record errors', () => {
    mgr.getOrCreate('p1')
    mgr.recordError('p1', 'test error')
    const metrics = mgr.getMetrics('p1')
    expect(metrics.errors).toBe(1)
    expect(metrics.lastError).toBe('test error')
  })

  it('should notify subscribers on state change', async () => {
    const states: string[] = []
    mgr.subscribe((_, state) => states.push(state))
    mgr.getOrCreate('p1')
    await mgr.enable('p1')
    expect(states).toContain(PluginState.ENABLED)
  })
})
