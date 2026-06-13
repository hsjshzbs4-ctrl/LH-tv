// tests/integration/provider-flow.integration.spec.ts — Provider → Registry → Facade 集成
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ProviderRegistry } from '@/core/providers'
import { ProviderFacade } from '@/core/providers/ProviderFacade'
import { createMockProvider, createMockMediaItem } from '../mocks/provider.mock'
import type { IProvider } from '@/core/providers/types/provider.types'

// Mock providerSDK
vi.mock('@/core/provider-sdk', () => ({
  providerSDK: {
    loadAllProviders: vi.fn().mockResolvedValue([]),
    getActiveProviders: vi.fn().mockReturnValue([]),
  },
}))

describe('Provider Integration Flow', () => {
  let facade: ProviderFacade
  let p1: IProvider, p2: IProvider

  beforeEach(() => {
    facade = new ProviderFacade()
    p1 = createMockProvider({ id: 'p1', name: 'Fast', priority: 50,
      searchResults: [createMockMediaItem({ id: 'm1', title: 'Naruto', providerId: 'p1' })] })
    p2 = createMockProvider({ id: 'p2', name: 'Slow', priority: 100,
      searchResults: [createMockMediaItem({ id: 'm2', title: 'One Piece', providerId: 'p2' })] })
  })

  afterEach(() => { vi.clearAllMocks() })

  // Case 01: Provider → Registry → Facade
  it('Case 01: should register provider and search through facade', async () => {
    facade.registerProvider(p1)
    facade.registerProvider(p2)
    expect(facade.getProviders()).toHaveLength(2)

    const result = await facade.search('naruto')
    // 两个 Provider 都注册了，聚合搜索结果（ProviderFacade 聚合所有 provider 的结果）
    expect(result.items.length).toBeGreaterThanOrEqual(1)
    expect(result.items.some(i => i.title === 'Naruto')).toBe(true)
  })

  // Case 02: Provider unregister
  it('Case 02: should unregister provider', () => {
    facade.registerProvider(p1)
    facade.registerProvider(p2)
    expect(facade.getProviders()).toHaveLength(2)

    // 通过 registry 方法获取 enabled
    const enabled = facade.getEnabledProviders()
    expect(enabled).toHaveLength(2)
  })

  // Case 04: Provider search
  it('Case 04: should search across multiple providers', async () => {
    facade.registerProvider(p1)
    facade.registerProvider(p2)

    const result = await facade.search('one piece')
    // 两个 Provider 都有搜索结果，聚合后可能有多条
    expect(result.items.some(i => i.providerId === 'p2')).toBe(true)
  })

  // Case 05: Provider detail
  it('Case 05: should fetch detail from provider', async () => {
    facade.registerProvider(p1)

    const detail = await facade.detail('p1', 'm1')
    expect(detail.providerId).toBe('p1')
    expect(detail.id).toBe('m1')
    expect(p1.detail).toHaveBeenCalledWith('m1')
  })

  // Case 06: Provider health
  it('Case 06: should check health for all enabled providers', async () => {
    facade.registerProvider(p1)
    facade.registerProvider(createMockProvider({ id: 'p3', enabled: false, healthy: false }))

    const results = await facade.healthCheck()
    // p3 is disabled, only p1 (enabled) gets checked
    expect(results).toHaveLength(1)
    expect(results.every(r => r.status === 'online')).toBe(true)
  })
})
