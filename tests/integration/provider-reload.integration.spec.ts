// tests/integration/provider-reload.integration.spec.ts — Provider 热重载集成测试
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ProviderRegistry } from '@/core/providers'
import { createMockProvider, createMockMediaItem } from '../mocks/provider.mock'

describe('Provider Reload Integration', () => {
  let registry: ProviderRegistry

  beforeEach(() => { registry = new ProviderRegistry() })

  it('should survive Load → Search → Unload → Reload → Search cycle', async () => {
    // Load
    const p = createMockProvider({
      id: 'reload-test', priority: 100,
      searchResults: [createMockMediaItem({ id: 'm1', title: 'Reload Test', providerId: 'reload-test' })],
    })
    registry.register(p)

    // Search
    const provider = registry.get('reload-test')!
    const results1 = await provider.search('test')
    expect(results1).toHaveLength(1)

    // Unload
    registry.unregister('reload-test')
    expect(registry.get('reload-test')).toBeUndefined()

    // Reload
    const p2 = createMockProvider({
      id: 'reload-test', priority: 100,
      searchResults: [createMockMediaItem({ id: 'm2', title: 'Reloaded', providerId: 'reload-test' })],
    })
    registry.register(p2)

    // Search again
    const provider2 = registry.get('reload-test')!
    const results2 = await provider2.search('test')
    expect(results2).toHaveLength(1)
    expect(results2[0].title).toBe('Reloaded') // 使用新的 provider
  })

  it('should handle multiple reload cycles', () => {
    for (let cycle = 0; cycle < 10; cycle++) {
      const p = createMockProvider({ id: 'cycle-test', priority: cycle })
      registry.register(p)
      expect(registry.get('cycle-test')).toBeDefined()
      registry.unregister('cycle-test')
      expect(registry.get('cycle-test')).toBeUndefined()
    }
  })

  it('should maintain other providers during reload', () => {
    registry.register(createMockProvider({ id: 'stable', priority: 50 }))
    registry.register(createMockProvider({ id: 'volatile', priority: 100 }))

    registry.unregister('volatile')
    registry.register(createMockProvider({ id: 'volatile', priority: 100, name: 'Reloaded' }))

    expect(registry.get('stable')).toBeDefined()
    expect(registry.get('volatile')).toBeDefined()
    expect(registry.get('volatile')?.name).toBe('Reloaded')
  })
})
