// tests/unit/core/providers/registry.spec.ts — ProviderRegistry 单元测试
// 覆盖: register/unregister/duplicate/get/getAll/getEnabled/enable/disable/health/plugin API

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ProviderRegistry } from '@/core/providers'
import { createMockProvider } from '../../../mocks/provider.mock'
import type { IProvider } from '@/core/providers/types/provider.types'

describe('ProviderRegistry', () => {
  let registry: ProviderRegistry

  beforeEach(() => {
    registry = new ProviderRegistry()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ==================== register ====================
  describe('register()', () => {
    it('should add provider to registry', () => {
      const p = createMockProvider({ id: 'p1', name: 'TestP1' })
      registry.register(p)
      expect(registry.get('p1')).toBe(p)
      expect(registry.count).toBe(1)
    })

    it('should overwrite on duplicate id', () => {
      const p1 = createMockProvider({ id: 'dup', name: 'First' })
      const p2 = createMockProvider({ id: 'dup', name: 'Second' })
      registry.register(p1)
      registry.register(p2)
      expect(registry.get('dup')?.name).toBe('Second')
      expect(registry.count).toBe(1) // 不增加
    })
  })

  // ==================== unregister ====================
  describe('unregister()', () => {
    it('should remove provider by id', () => {
      const p = createMockProvider({ id: 'p1' })
      registry.register(p)
      registry.unregister('p1')
      expect(registry.get('p1')).toBeUndefined()
      expect(registry.count).toBe(0)
    })

    it('should not throw on missing id', () => {
      expect(() => registry.unregister('nonexistent')).not.toThrow()
    })
  })

  // ==================== get ====================
  describe('get()', () => {
    it('should return provider by id', () => {
      const p = createMockProvider({ id: 'p1' })
      registry.register(p)
      expect(registry.get('p1')).toBe(p)
    })

    it('should return undefined for missing id', () => {
      expect(registry.get('nonexistent')).toBeUndefined()
    })
  })

  // ==================== getAll ====================
  describe('getAll()', () => {
    it('should return all registered providers', () => {
      registry.register(createMockProvider({ id: 'a' }))
      registry.register(createMockProvider({ id: 'b' }))
      expect(registry.getAll()).toHaveLength(2)
    })

    it('should return empty array when no providers', () => {
      expect(registry.getAll()).toEqual([])
    })
  })

  // ==================== getEnabled ====================
  describe('getEnabled()', () => {
    it('should return only enabled providers', () => {
      registry.register(createMockProvider({ id: 'enabled1', enabled: true }))
      registry.register(createMockProvider({ id: 'disabled1', enabled: false }))
      const enabled = registry.getEnabled()
      expect(enabled).toHaveLength(1)
      expect(enabled[0].id).toBe('enabled1')
    })

    it('should sort by priority ascending', () => {
      registry.register(createMockProvider({ id: 'low', priority: 300 }))
      registry.register(createMockProvider({ id: 'high', priority: 100 }))
      registry.register(createMockProvider({ id: 'mid', priority: 200 }))
      const enabled = registry.getEnabled()
      expect(enabled.map(p => p.id)).toEqual(['high', 'mid', 'low'])
    })
  })

  // ==================== getProviders ====================
  describe('getProviders()', () => {
    it('should return all providers including disabled', () => {
      registry.register(createMockProvider({ id: 'e', enabled: true }))
      registry.register(createMockProvider({ id: 'd', enabled: false }))
      expect(registry.getProviders()).toHaveLength(2)
    })
  })

  // ==================== getSearchProviders ====================
  describe('getSearchProviders()', () => {
    it('should return enabled providers', () => {
      registry.register(createMockProvider({ id: 'a', enabled: true }))
      registry.register(createMockProvider({ id: 'b', enabled: false }))
      expect(registry.getSearchProviders()).toHaveLength(1)
      expect(registry.getSearchProviders()[0].id).toBe('a')
    })
  })

  // ==================== enable/disable ====================
  describe('enable() / disable()', () => {
    it('should enable disabled provider', () => {
      const p = createMockProvider({ id: 'p1', enabled: false })
      registry.register(p)
      registry.enable('p1')
      expect(p.enabled).toBe(true)
    })

    it('should disable enabled provider', () => {
      const p = createMockProvider({ id: 'p1', enabled: true })
      registry.register(p)
      registry.disable('p1')
      expect(p.enabled).toBe(false)
    })

    it('should noop on missing provider id', () => {
      expect(() => registry.enable('missing')).not.toThrow()
      expect(() => registry.disable('missing')).not.toThrow()
    })
  })

  // ==================== Health Check ====================
  describe('checkHealth()', () => {
    it('should return health status for all enabled providers', async () => {
      registry.register(createMockProvider({ id: 'healthy', healthy: true, priority: 100 }))
      registry.register(createMockProvider({ id: 'sick', healthy: false, priority: 200, enabled: true }))
      registry.register(createMockProvider({ id: 'disabled', healthy: true, enabled: false }))

      const results = await registry.checkHealth()
      expect(results).toHaveLength(2) // only enabled
      expect(results.find(r => r.providerId === 'healthy')?.status).toBe('online')
      expect(results.find(r => r.providerId === 'sick')?.status).toBe('offline')
    })

    it('should mark provider as offline on error', async () => {
      registry.register(createMockProvider({ id: 'crash', healthy: true, priority: 100 }))
      // 覆盖 healthCheck 抛异常
      const p = registry.get('crash')!
      p.healthCheck = vi.fn().mockRejectedValue(new Error('boom'))

      const results = await registry.checkHealth()
      expect(results[0].status).toBe('offline')
    })

    it('should cache health results', async () => {
      registry.register(createMockProvider({ id: 'p1' }))
      await registry.checkHealth()
      const cache = registry.getHealthCache()
      expect(cache).toHaveLength(1)
      expect(cache[0].providerId).toBe('p1')
    })
  })

  // ==================== Periodic Health ====================
  describe('startPeriodicHealthCheck() / stopPeriodicHealthCheck()', () => {
    it('should start and stop periodic health check', () => {
      vi.useFakeTimers()
      registry.register(createMockProvider({ id: 'p1' }))
      registry.startPeriodicHealthCheck()
      // 快进 10 分钟
      vi.advanceTimersByTime(10 * 60 * 1000)
      registry.stopPeriodicHealthCheck()
      // 不应崩溃
      expect(true).toBe(true)
    })
  })

  // ==================== Statistics ====================
  describe('count / enabledCount', () => {
    it('should report correct counts', () => {
      registry.register(createMockProvider({ id: 'a', enabled: true }))
      registry.register(createMockProvider({ id: 'b', enabled: true }))
      registry.register(createMockProvider({ id: 'c', enabled: false }))
      expect(registry.count).toBe(3)
      expect(registry.enabledCount).toBe(2)
    })
  })

  // ==================== Plugin API ====================
  describe('registerPlugin() / unregisterPlugin()', () => {
    it('should register plugin provider', () => {
      const p = createMockProvider({ id: 'plugin-1' })
      registry.registerPlugin(p)
      expect(registry.get('plugin-1')).toBe(p)
    })

    it('should unregister plugin provider', () => {
      const p = createMockProvider({ id: 'plugin-1' })
      registry.registerPlugin(p)
      registry.unregisterPlugin('plugin-1')
      expect(registry.get('plugin-1')).toBeUndefined()
    })
  })
})
