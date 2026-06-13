// tests/integration/provider-isolation.integration.spec.ts — Provider 运行时隔离测试
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ProviderRegistry } from '@/core/providers'
import { ProviderFacade } from '@/core/providers/ProviderFacade'
import { createMockProvider, createMockMediaItem } from '../mocks/provider.mock'
import type { IProvider } from '@provider-contracts'

vi.mock('@/core/provider-sdk', () => ({
  providerSDK: {
    loadAllProviders: vi.fn().mockResolvedValue([]),
    getActiveProviders: vi.fn().mockReturnValue([]),
  },
}))

describe('Provider Isolation Integration', () => {
  let facade: ProviderFacade
  let healthy: IProvider
  let crashing: IProvider

  beforeEach(() => {
    facade = new ProviderFacade()
    healthy = createMockProvider({
      id: 'healthy', name: 'Healthy', priority: 100,
      searchResults: [createMockMediaItem({ id: 'm-h', title: 'Healthy Result', providerId: 'healthy' })],
    })
    crashing = createMockProvider({
      id: 'crashing', name: 'Crashing', priority: 200,
      searchThrows: true,
    })
  })

  it('should allow healthy provider to work after crash of another', async () => {
    facade.registerProvider(healthy)
    facade.registerProvider(crashing)

    // Search should work despite crashing provider
    const result = await facade.search('test')
    // 至少有一个成功的 provider 返回结果
    expect(result.items.length).toBeGreaterThanOrEqual(1)
    expect(result.items.some(i => i.providerId === 'healthy')).toBe(true)
  })

  it('should allow all operations when one provider crashes', async () => {
    facade.registerProvider(healthy)
    facade.registerProvider(crashing)

    // Search still works
    const searchResult = await facade.search('test')
    expect(searchResult).toBeDefined()

    // Detail from healthy still works
    const detail = await facade.detail('healthy', 'm-h')
    expect(detail).toBeDefined()

    // Health check reports both
    const health = await facade.healthCheck()
    expect(health.length).toBeGreaterThanOrEqual(1)
  })

  it('should not crash when only crashing providers are registered', async () => {
    facade.registerProvider(crashing)
    facade.registerProvider(createMockProvider({ id: 'crashing-2', priority: 300, searchThrows: true }))

    const result = await facade.search('test')
    expect(result.items).toEqual([])
    // 不应抛异常
  })
})
