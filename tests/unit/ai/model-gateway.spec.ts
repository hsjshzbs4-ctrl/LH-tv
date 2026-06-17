// tests/unit/ai/model-gateway.spec.ts — ModelGateway 测试

import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@platform/flags', () => ({
  featureFlagManager: { isEnabled: vi.fn().mockReturnValue(true) },
  FeatureState: { OFF: 'OFF', INTERNAL: 'INTERNAL', PUBLIC: 'PUBLIC' },
}))

import { ModelGateway } from '@ai/provider/ModelGateway'
import { MockAIProvider } from '@ai/provider/MockAIProvider'

describe('ModelGateway', () => {
  let gateway: ModelGateway

  beforeEach(() => {
    gateway = new ModelGateway()
  })

  it('registers whitelisted providers', () => {
    const result = gateway.register('mock', new MockAIProvider())
    expect(result.success).toBe(true)
  })

  it('rejects non-whitelisted providers', () => {
    const result = gateway.register('evil-ai', new MockAIProvider())
    expect(result.success).toBe(false)
    expect(result.reason).toContain('whitelist')
  })

  it('lists registered providers', () => {
    gateway.register('mock', new MockAIProvider())
    expect(gateway.listProviders()).toContain('mock')
  })

  it('retrieves registered providers', () => {
    const provider = new MockAIProvider()
    gateway.register('mock', provider)
    expect(gateway.getProvider('mock')).toBe(provider)
  })

  it('returns null for unregistered providers', () => {
    expect(gateway.getProvider('nonexistent')).toBeNull()
  })

  it('unregisters providers', () => {
    gateway.register('mock', new MockAIProvider())
    gateway.unregister('mock')
    expect(gateway.getProvider('mock')).toBeNull()
  })

  it('throws when completing with unregistered provider', async () => {
    await expect(
      gateway.complete({
        prompt: 'test',
        providerName: 'nonexistent',
        config: { provider: 'nonexistent' as never },
        caller: 'TestHarness',
      }),
    ).rejects.toThrow()
  })

  it('completes successfully with mock provider', async () => {
    const provider = new MockAIProvider()
    await provider.initialize({ provider: 'mock' })
    gateway.register('mock', provider)

    const result = await gateway.complete({
      prompt: 'Hello',
      providerName: 'mock',
      config: { provider: 'mock' },
      caller: 'TestHarness',
    })

    expect(result.response).toBeDefined()
    expect(result.auditId).toContain('gw_')
  })

  it('rejects calls from unauthorized callers', async () => {
    const provider = new MockAIProvider()
    await provider.initialize({ provider: 'mock' })
    gateway.register('mock', provider)

    await expect(
      gateway.complete({
        prompt: 'test',
        providerName: 'mock',
        config: { provider: 'mock' },
        caller: 'AIChatPanel', // UI 直接调用 → 应被拒绝
      }),
    ).rejects.toThrow('Call path rejected')
  })

  it('disposes all providers', async () => {
    const provider = new MockAIProvider()
    await provider.initialize({ provider: 'mock' })
    gateway.register('mock', provider)

    await gateway.disposeAll()
    expect(gateway.listProviders()).toHaveLength(0)
  })
})
