// tests/unit/ecosystem/lifecycle-manager.spec.ts — 生命周期管理器测试
import { describe, it, expect, beforeEach } from 'vitest'
import {
  LifecycleManager,
  ExtensionState,
  ExtensionType,
  type ExtensionManifest,
} from '@ecosystem/index'

const manifest: ExtensionManifest = {
  id: 'test.extension',
  name: 'Test Extension',
  version: '1.0.0',
  publisher: { id: 'test', name: 'Test Publisher' },
  signature: 'sha256:abc123',
  runtimeVersion: '3.0.0',
  type: ExtensionType.PLUGIN,
  kind: ExtensionType.PLUGIN,
  entry: './index.js',
  description: 'Test',
  permissions: [],
  capabilities: [],
  dependencies: [],
}

describe('LifecycleManager', () => {
  let lm: LifecycleManager

  beforeEach(() => {
    lm = new LifecycleManager()
  })

  it('registers an extension', () => {
    const result = lm.register(manifest)
    expect(result.success).toBe(true)
    const instance = lm.get(manifest.id)
    expect(instance).not.toBeNull()
    expect(instance!.state).toBe(ExtensionState.REGISTERED)
  })

  it('rejects duplicate registration', () => {
    lm.register(manifest)
    const result = lm.register(manifest)
    expect(result.success).toBe(false)
    expect(result.error).toContain('already registered')
  })

  it('transitions REGISTERED → INSTALLED', async () => {
    lm.register(manifest)
    const result = await lm.transition(manifest.id, ExtensionState.INSTALLED)
    expect(result.success).toBe(true)
    expect(lm.get(manifest.id)!.state).toBe(ExtensionState.INSTALLED)
  })

  it('transitions full chain: REGISTERED → INSTALLED → LOADED → RUNNING', async () => {
    lm.register(manifest)
    await lm.transition(manifest.id, ExtensionState.INSTALLED)
    await lm.transition(manifest.id, ExtensionState.LOADED)
    await lm.transition(manifest.id, ExtensionState.RUNNING)
    expect(lm.get(manifest.id)!.state).toBe(ExtensionState.RUNNING)
  })

  it('transitions RUNNING → STOPPED → RUNNING', async () => {
    lm.register(manifest)
    await lm.transition(manifest.id, ExtensionState.INSTALLED)
    await lm.transition(manifest.id, ExtensionState.LOADED)
    await lm.transition(manifest.id, ExtensionState.RUNNING)
    await lm.transition(manifest.id, ExtensionState.STOPPED)
    expect(lm.get(manifest.id)!.state).toBe(ExtensionState.STOPPED)
    await lm.transition(manifest.id, ExtensionState.RUNNING)
    expect(lm.get(manifest.id)!.state).toBe(ExtensionState.RUNNING)
  })

  it('rejects invalid transitions', async () => {
    lm.register(manifest)
    // REGISTERED → RUNNING is invalid (must go through INSTALLED and LOADED)
    const result = await lm.transition(manifest.id, ExtensionState.RUNNING)
    expect(result.success).toBe(false)
    expect(result.error).toContain('Invalid transition')
  })

  it('lists by state', async () => {
    lm.register(manifest)
    const m2 = { ...manifest, id: 'test.extension2' }
    lm.register(m2)
    await lm.transition(m2.id, ExtensionState.INSTALLED)

    const registered = lm.listByState(ExtensionState.REGISTERED)
    const installed = lm.listByState(ExtensionState.INSTALLED)
    expect(registered).toHaveLength(1)
    expect(installed).toHaveLength(1)
  })

  it('executes lifecycle hooks', async () => {
    const calls: string[] = []
    lm.register(manifest)
    lm.setHooks(manifest.id, {
      onInstall: async () => { calls.push('install') },
      onLoad: async () => { calls.push('load') },
      onStart: async () => { calls.push('start') },
    })

    await lm.transition(manifest.id, ExtensionState.INSTALLED)
    await lm.transition(manifest.id, ExtensionState.LOADED)
    await lm.transition(manifest.id, ExtensionState.RUNNING)

    expect(calls).toEqual(['install', 'load', 'start'])
  })

  it('emits state change events', async () => {
    const events: Array<{ from: ExtensionState; to: ExtensionState }> = []
    lm.onStateChange((_instance, from, to) => events.push({ from, to }))

    lm.register(manifest)
    await lm.transition(manifest.id, ExtensionState.INSTALLED)
    await lm.transition(manifest.id, ExtensionState.LOADED)

    expect(events).toHaveLength(2)
    expect(events[0]).toEqual({ from: ExtensionState.REGISTERED, to: ExtensionState.INSTALLED })
    expect(events[1]).toEqual({ from: ExtensionState.INSTALLED, to: ExtensionState.LOADED })
  })

  it('provides stats', () => {
    lm.register(manifest)
    const m2 = { ...manifest, id: 'test.extension2' }
    lm.register(m2)

    const stats = lm.stats()
    expect(stats[ExtensionState.REGISTERED]).toBe(2)
  })
})
