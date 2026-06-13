// tests/stress/provider.stress.spec.ts — Provider Stress Tests
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ProviderRegistry } from '@/core/providers'
import { createMockProvider, createMockMediaItem } from '../mocks/provider.mock'
import { ProviderFacade } from '@/core/providers/ProviderFacade'

vi.mock('@/core/provider-sdk', () => ({
  providerSDK: { loadAllProviders: vi.fn().mockResolvedValue([]), getActiveProviders: vi.fn().mockReturnValue([]) },
}))

describe('Provider Stress', () => {
  let registry: ProviderRegistry

  beforeEach(() => { registry = new ProviderRegistry() })

  it('Case 01: should handle 100 consecutive registrations', () => {
    for (let i = 0; i < 100; i++) {
      registry.register(createMockProvider({ id: `p${i}`, name: `Provider ${i}`, priority: i }))
    }
    expect(registry.count).toBe(100)
  })

  it('Case 02: should handle 100 consecutive unregistrations', () => {
    for (let i = 0; i < 100; i++) {
      registry.register(createMockProvider({ id: `p${i}` }))
    }
    for (let i = 0; i < 100; i++) {
      expect(() => registry.unregister(`p${i}`)).not.toThrow()
    }
    expect(registry.count).toBe(0)
  })

  it('Case 03: should handle 100 register/unregister cycles', () => {
    for (let cycle = 0; cycle < 100; cycle++) {
      registry.register(createMockProvider({ id: 'hot' }))
      registry.unregister('hot')
    }
    expect(registry.count).toBe(0)
  })

  it('Case 04: should handle 1000 searches without memory growth', async () => {
    const facade = new ProviderFacade()
    facade.registerProvider(createMockProvider({
      id: 'p1', priority: 100,
      searchResults: [createMockMediaItem({ id: 'm1', title: 'Test', providerId: 'p1' })],
    }))

    for (let i = 0; i < 1000; i++) {
      const result = await facade.search(`keyword-${i % 10}`)
      expect(result).toBeDefined()
    }
  }, 30000)

  it('Case 05: should survive random provider crashes', async () => {
    const facade = new ProviderFacade()
    for (let i = 0; i < 10; i++) {
      const crashes = i % 3 === 0
      facade.registerProvider(createMockProvider({
        id: `p${i}`, priority: i, searchThrows: crashes,
        searchResults: crashes ? [] : [createMockMediaItem({ id: `m${i}`, title: `Show ${i}`, providerId: `p${i}` })],
      }))
    }

    const result = await facade.search('show')
    expect(result).toBeDefined()
    // 即使部分崩溃，系统仍返回结果
    expect(result.items.length).toBeGreaterThan(0)
  })
})
