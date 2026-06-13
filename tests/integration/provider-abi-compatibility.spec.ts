// tests/integration/provider-abi-compatibility.spec.ts — Provider ABI 兼容性验证
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockProvider } from '../mocks/provider.mock'
import { ProviderRegistry } from '@/core/providers'
import type { IProvider } from '@provider-contracts'

describe('Provider ABI Compatibility', () => {
  let registry: ProviderRegistry
  let provider: IProvider

  beforeEach(() => {
    registry = new ProviderRegistry()
    provider = createMockProvider({
      id: 'abi-test', name: 'ABI Provider', priority: 100,
      searchResults: [{ id: 'm1', title: 'Test', cover: '', providerId: 'abi-test', providerName: 'ABI', type: 'movie' }],
    })
    registry.register(provider)
  })

  it('should support basic search via IProvider interface', async () => {
    const p = registry.get('abi-test')!
    const results = await p.search('test')
    expect(results).toHaveLength(1)
    expect(results[0].title).toBe('Test')
  })

  it('should support detail via IProvider interface', async () => {
    const p = registry.get('abi-test')!
    const detail = await p.detail('any')
    expect(detail).toBeDefined()
    expect(detail.id).toBe('any')
  })

  it('should support healthCheck via IProvider interface', async () => {
    const p = registry.get('abi-test')!
    const healthy = await p.healthCheck()
    expect(healthy).toBe(true)
  })

  it('IProvider must have id, name, enabled, priority fields', () => {
    expect(provider.id).toBeDefined()
    expect(provider.name).toBeDefined()
    expect(provider.enabled).toBeDefined()
    expect(provider.priority).toBeDefined()
  })

  it('IProvider must have search, detail, healthCheck methods', () => {
    expect(typeof provider.search).toBe('function')
    expect(typeof provider.detail).toBe('function')
    expect(typeof provider.healthCheck).toBe('function')
  })
})
