// tests/unit/platform/plugins/plugin-manager.spec.ts — S5-4 统一插件测试

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PluginManager } from '@platform/plugins/manager/PluginManager'
import { PluginRegistry } from '@platform/plugins/manager/PluginRegistry'
import { PluginSandbox } from '@platform/plugins/sandbox/PluginSandbox'
import {
  PluginType,
  PluginState,
  type PluginManifest,
} from '@platform/plugins/types/plugin.types'
import {
  adaptProviderToPlugin,
  adaptRecommendationProviderToPlugin,
} from '@platform/plugins/adapters/ProviderPluginAdapter'

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

function makeManifest(overrides?: Partial<PluginManifest>): PluginManifest {
  return {
    id: 'test-plugin',
    name: 'Test Plugin',
    version: '1.0.0',
    type: PluginType.METADATA_PROVIDER,
    description: 'A test plugin',
    author: 'tester',
    permissions: ['network_access'],
    dependencies: [],
    state: PluginState.INSTALLED,
    installedAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  }
}

describe('PluginManager', () => {
  let manager: PluginManager
  let registry: PluginRegistry

  beforeEach(async () => {
    registry = new PluginRegistry()
    registry.clear()
    manager = new PluginManager()
    await manager.initialize()
  })

  it('installs and lists plugins', async () => {
    const manifest = makeManifest()
    await manager.install(manifest)

    const plugins = manager.listPlugins()
    expect(plugins).toHaveLength(1)
    expect(plugins[0].name).toBe('Test Plugin')
  })

  it('enables and disables plugins', async () => {
    await manager.install(makeManifest())

    await manager.enable('test-plugin')
    expect(manager.getPlugin('test-plugin')?.state).toBe(PluginState.ENABLED)

    await manager.disable('test-plugin')
    expect(manager.getPlugin('test-plugin')?.state).toBe(PluginState.DISABLED)
  })

  it('uninstalls plugins', async () => {
    await manager.install(makeManifest())
    await manager.uninstall('test-plugin')

    expect(manager.getPlugin('test-plugin')).toBeNull()
  })

  it('queries plugins by type', async () => {
    await manager.install(makeManifest({ id: 'p1', type: PluginType.METADATA_PROVIDER }))
    await manager.install(makeManifest({ id: 'p2', type: PluginType.SUBTITLE_PROVIDER }))

    const metaPlugins = manager.getPluginsByType(PluginType.METADATA_PROVIDER)
    expect(metaPlugins).toHaveLength(1)
  })

  it('subscribes to changes', async () => {
    const sub = vi.fn()
    const unsub = manager.subscribe(sub)

    await manager.install(makeManifest())
    expect(sub).toHaveBeenCalledTimes(1)

    unsub()
  })
})

describe('PluginSandbox', () => {
  it('isolates and releases plugins', () => {
    const sandbox = new PluginSandbox({ isolated: true })
    sandbox.isolate('p1')
    expect(sandbox.isIsolated('p1')).toBe(true)

    sandbox.release('p1')
    expect(sandbox.isIsolated('p1')).toBe(false)
  })

  it('does not isolate when config disabled', () => {
    const sandbox = new PluginSandbox({ isolated: false })
    sandbox.isolate('p1')
    expect(sandbox.isIsolated('p1')).toBe(false)
  })
})

describe('ProviderPluginAdapter', () => {
  it('adapts provider to plugin manifest', () => {
    const manifest = adaptProviderToPlugin(
      'apple-cms', 'AppleCMS', '1.0.0', 'AppleCMS provider', 'lin', ['search'],
    )
    expect(manifest.id).toBe('provider:apple-cms')
    expect(manifest.type).toBe(PluginType.METADATA_PROVIDER)
    expect(manifest.metadata?.source).toBe('provider-sdk')
  })

  it('adapts recommendation provider to plugin', () => {
    const manifest = adaptRecommendationProviderToPlugin('local-rec', 'Local', '1.0.0')
    expect(manifest.type).toBe(PluginType.RECOMMENDATION_PROVIDER)
    expect(manifest.metadata?.source).toBe('ce9-recommendation')
  })
})
