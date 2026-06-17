// tests/unit/ecosystem/marketplace-registry.spec.ts — Marketplace Registry 测试
import { describe, it, expect, beforeEach } from 'vitest'
import { MarketplaceRegistry, ExtensionType, ExtensionState } from '@ecosystem/index'

const validManifest = {
  id: 'acme.search-plugin',
  name: 'Search Plugin',
  version: '1.0.0',
  publisher: { id: 'acme', name: 'Acme Corp', email: 'dev@acme.com' },
  signature: 'sha256:abc123def456abc123def456abc123def456',
  runtimeVersion: '3.0.0',
  type: ExtensionType.PLUGIN,
  entry: './index.js',
  description: 'Enhanced search for LH-TV',
  permissions: [{ id: 'storage.read', reason: 'Store index cache' }],
  capabilities: [{ id: 'host.storage' }],
  dependencies: [],
}

describe('MarketplaceRegistry', () => {
  let registry: MarketplaceRegistry

  beforeEach(() => {
    registry = new MarketplaceRegistry()
  })

  it('registers an extension', () => {
    const result = registry.register(validManifest)
    expect(result.success).toBe(true)
    expect(result.entry).toBeDefined()
    expect(result.entry!.state).toBe(ExtensionState.REGISTERED)
  })

  it('rejects duplicate registration', () => {
    registry.register(validManifest)
    const result = registry.register(validManifest)
    expect(result.success).toBe(false)
    expect(result.error).toContain('already registered')
  })

  it('rejects invalid manifest', () => {
    const result = registry.register({ name: 'No ID' })
    expect(result.success).toBe(false)
    expect(result.error).toContain('validation failed')
  })

  it('searches by keyword', () => {
    registry.register(validManifest)
    // 第二个 manifest 不继承 description 中的 "search"
    registry.register({
      id: 'zulu.theme-dark',
      name: 'Dark Theme',
      version: '1.0.0',
      publisher: { id: 'zulu', name: 'Zulu Design' },
      signature: 'sha256:abc123',
      runtimeVersion: '3.0.0',
      type: ExtensionType.THEME,
      entry: './theme.js',
      description: 'A beautiful dark theme for LH-TV',
      permissions: [],
      capabilities: [],
      dependencies: [],
    })

    const results = registry.search({ keyword: 'search' })
    expect(results).toHaveLength(1)
    expect(results[0].manifest.id).toBe('acme.search-plugin')
  })

  it('filters by type', () => {
    registry.register(validManifest)
    registry.register({
      ...validManifest,
      id: 'zulu.dark',
      name: 'Dark Theme',
      type: ExtensionType.THEME,
    })

    const plugins = registry.search({ type: ExtensionType.PLUGIN })
    const themes = registry.search({ type: ExtensionType.THEME })
    expect(plugins).toHaveLength(1)
    expect(themes).toHaveLength(1)
  })

  it('sorts by installs', () => {
    registry.register(validManifest)
    registry.register({
      ...validManifest,
      id: 'zulu.popular',
      name: 'Popular Plugin',
    })

    registry.recordInstall('zulu.popular')
    registry.recordInstall('zulu.popular')

    const results = registry.search({ sort: 'installs' })
    expect(results[0].manifest.id).toBe('zulu.popular')
    expect(results[0].installs).toBe(2)
  })

  it('paginates results', () => {
    for (let i = 0; i < 5; i++) {
      registry.register({ ...validManifest, id: `test.plugin-${i}`, name: `Plugin ${i}` })
    }

    const page1 = registry.search({ limit: 3, offset: 0 })
    const page2 = registry.search({ limit: 3, offset: 3 })

    expect(page1).toHaveLength(3)
    expect(page2).toHaveLength(2)
  })

  it('updates rating', () => {
    registry.register(validManifest)
    registry.updateRating(validManifest.id, 4.5)
    const entry = registry.get(validManifest.id)
    expect(entry!.rating).toBe(4.5)
  })

  it('clamps rating 0-5', () => {
    registry.register(validManifest)
    registry.updateRating(validManifest.id, 10)
    expect(registry.get(validManifest.id)!.rating).toBe(5)

    registry.updateRating(validManifest.id, -1)
    expect(registry.get(validManifest.id)!.rating).toBe(0)
  })

  it('unregisters extension', () => {
    registry.register(validManifest)
    expect(registry.has(validManifest.id)).toBe(true)
    registry.unregister(validManifest.id)
    expect(registry.has(validManifest.id)).toBe(false)
  })

  it('provides stats', () => {
    registry.register(validManifest)
    registry.register({ ...validManifest, id: 'dark.theme', type: ExtensionType.THEME })

    const stats = registry.stats()
    expect(stats.total).toBe(2)
    expect(stats.byType.plugin).toBe(1)
    expect(stats.byType.theme).toBe(1)
  })
})
