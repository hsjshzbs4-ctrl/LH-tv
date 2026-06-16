// tests/unit/content/provider-manager.spec.ts — ProviderManagerService 单元测试
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ProviderManagerService } from '@/content/providerManager'
import * as providerModule from '@/core/providers'

// Mock provider facade
vi.mock('@/core/providers', () => {
  const mockProvider = (id: string, name: string, enabled: boolean, priority: number) => ({
    id, name, enabled, priority,
    search: vi.fn().mockResolvedValue([]),
    detail: vi.fn().mockResolvedValue({}),
    healthCheck: vi.fn().mockResolvedValue(true),
    catalog: vi.fn().mockResolvedValue([]),
  })

  const providers = [
    mockProvider('p1', 'Provider 1', true, 10),
    mockProvider('p2', 'Provider 2', false, 5),
    mockProvider('p3', 'Provider 3', true, 8),
  ]

  return {
    providerFacade: {
      getProviders: vi.fn(() => providers),
      getEnabledProviders: vi.fn(() => providers.filter(p => p.enabled)),
      getHealthCache: vi.fn(() => [
        { providerId: 'p1', status: 'online', lastCheck: Date.now(), responseTime: 120 },
        { providerId: 'p2', status: 'offline', lastCheck: Date.now() - 60000 },
        { providerId: 'p3', status: 'online', lastCheck: Date.now(), responseTime: 200 },
      ]),
      healthCheck: vi.fn().mockResolvedValue([
        { providerId: 'p1', status: 'online', lastCheck: Date.now(), responseTime: 100 },
        { providerId: 'p2', status: 'offline', lastCheck: Date.now() },
        { providerId: 'p3', status: 'online', lastCheck: Date.now(), responseTime: 180 },
      ]),
      registerProvider: vi.fn(),
    },
  }
})

describe('ProviderManagerService', () => {
  let service: ProviderManagerService

  beforeEach(() => {
    service = new ProviderManagerService()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getProviders()', () => {
    it('should return all providers with health info', () => {
      const providers = service.getProviders()
      expect(providers).toHaveLength(3)
      expect(providers[0]).toHaveProperty('id', 'p1')
      expect(providers[0]).toHaveProperty('healthStatus', 'online')
      expect(providers[0]).toHaveProperty('responseTime', 120)
    })

    it('should map health status correctly', () => {
      const providers = service.getProviders()
      const offline = providers.find(p => p.id === 'p2')
      expect(offline?.healthStatus).toBe('offline')
    })
  })

  describe('getEnabledProviders()', () => {
    it('should return only enabled providers', () => {
      const enabled = service.getEnabledProviders()
      expect(enabled).toHaveLength(2)
      expect(enabled.every(p => p.enabled)).toBe(true)
    })
  })

  describe('enableProvider()', () => {
    it('should set enabled to true', () => {
      service.enableProvider('p2')
      const p = service.getProviders().find(pr => pr.id === 'p2')
      expect(p?.enabled).toBe(true)
    })

    it('should throw for non-existent provider', () => {
      expect(() => service.enableProvider('nonexistent')).toThrow('不存在')
    })
  })

  describe('disableProvider()', () => {
    it('should set enabled to false', () => {
      service.disableProvider('p1')
      const p = service.getProviders().find(pr => pr.id === 'p1')
      expect(p?.enabled).toBe(false)
    })
  })

  describe('setPriority()', () => {
    it('should update priority', () => {
      service.setPriority('p1', 99)
      const p = service.getProviders().find(pr => pr.id === 'p1')
      expect(p?.priority).toBe(99)
    })
  })

  describe('checkHealth()', () => {
    it('should run async health check', async () => {
      const results = await service.checkHealth()
      expect(results).toHaveLength(3)
      expect(results[0].healthStatus).toBe('online')
    })
  })

  describe('getHealthCache()', () => {
    it('should return cached health data', () => {
      const cached = service.getHealthCache()
      expect(cached).toHaveLength(3)
    })
  })

  describe('registerProvider()', () => {
    it('should delegate to providerFacade', () => {
      const mockProvider = { id: 'p4', name: 'New', enabled: true, priority: 1, search: vi.fn(), detail: vi.fn(), healthCheck: vi.fn() }
      service.registerProvider(mockProvider as unknown as Parameters<typeof service.registerProvider>[0])
      expect(providerModule.providerFacade.registerProvider).toHaveBeenCalledWith(mockProvider)
    })
  })
})
