// tests/unit/core/providers/provider-facade.spec.ts — ProviderFacade 单元测试
// 覆盖: search/detail/catalog/catalogAll/health/providers management/error handling

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { IProvider } from '@/core/providers/types/provider.types'
import type { MediaItem, MediaDetail } from '@/core/providers/types/media.types'

// Mock providerSDK 模块（避免 import.meta.glob 问题）
vi.mock('@/core/provider-sdk', () => ({
  providerSDK: {
    loadAllProviders: vi.fn().mockResolvedValue([]),
    getActiveProviders: vi.fn().mockReturnValue([]),
    getInstalledProviders: vi.fn().mockReturnValue([]),
    enableProvider: vi.fn(),
    disableProvider: vi.fn(),
    reloadProvider: vi.fn(),
  },
}))

import { ProviderFacade } from '@/core/providers/ProviderFacade'
import { createMockProvider, createMockMediaItem, createMockMediaDetail } from '../../../mocks/provider.mock'

function makeProvider(overrides: Record<string, unknown> = {}): IProvider {
  return createMockProvider({
    id: overrides.id as string || 'test-p1',
    name: overrides.name as string || 'Test Provider',
    enabled: overrides.enabled !== false,
    priority: overrides.priority as number || 100,
    searchResults: (overrides.searchResults as MediaItem[]) || [
      createMockMediaItem({ id: 'media-1', title: 'Test Show', providerId: (overrides.id as string) || 'test-p1' }),
    ],
    detailResult: overrides.detailResult as MediaDetail | undefined,
    healthy: overrides.healthy !== false,
    searchThrows: overrides.searchThrows === true,
  })
}

// ============================================================

describe('ProviderFacade', () => {
  let facade: ProviderFacade

  beforeEach(() => {
    facade = new ProviderFacade()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // ==================== search ====================
  describe('search()', () => {
    it('should return empty when no providers registered', async () => {
      const result = await facade.search('naruto')
      expect(result.items).toEqual([])
      expect(result.providers).toEqual([])
    })

    it('should aggregate results from single provider', async () => {
      facade.registerProvider(makeProvider({ id: 'p1' }))
      const result = await facade.search('naruto')
      expect(result.items).toHaveLength(1)
      expect(result.providers).toContain('Test Provider')
    })

    it('should aggregate and deduplicate results from multiple providers', async () => {
      facade.registerProvider(makeProvider({
        id: 'p1',
        searchResults: [createMockMediaItem({ id: '1', title: 'Same Show', type: 'movie', providerId: 'p1' })],
      }))
      facade.registerProvider(makeProvider({
        id: 'p2',
        searchResults: [createMockMediaItem({ id: '2', title: 'Same Show', type: 'movie', providerId: 'p2' })],
      }))

      const result = await facade.search('same show')
      // 去重后只剩 1 条
      expect(result.items).toHaveLength(1)
    })

    it('should sort by score DESC then year DESC', async () => {
      facade.registerProvider(makeProvider({
        id: 'p1',
        searchResults: [
          createMockMediaItem({ id: '1', title: 'Low Score', score: 5, year: 2024, providerId: 'p1' }),
          createMockMediaItem({ id: '2', title: 'High Score', score: 9, year: 2023, providerId: 'p1' }),
        ],
      }))

      const result = await facade.search('test')
      expect(result.items[0].title).toBe('High Score')
      expect(result.items[1].title).toBe('Low Score')
    })

    it('should handle single provider throwing error gracefully', async () => {
      facade.registerProvider(makeProvider({ id: 'healthy', searchResults: [createMockMediaItem({ id: '1', title: 'OK', providerId: 'healthy' })] }))
      facade.registerProvider(makeProvider({ id: 'broken', searchThrows: true }))

      const result = await facade.search('test')
      expect(result.items).toHaveLength(1)
      expect(result.items[0].title).toBe('OK')
    })

    it('should return empty when all providers fail', async () => {
      facade.registerProvider(makeProvider({ id: 'broken1', searchThrows: true }))
      facade.registerProvider(makeProvider({ id: 'broken2', searchThrows: true }))

      const result = await facade.search('test')
      expect(result.items).toEqual([])
    })

    it('should return empty when all providers return empty arrays', async () => {
      facade.registerProvider(makeProvider({ id: 'p1', searchResults: [] }))
      facade.registerProvider(makeProvider({ id: 'p2', searchResults: [] }))

      const result = await facade.search('no results')
      expect(result.items).toEqual([])
    })

    it('should not include disabled providers in search', async () => {
      facade.registerProvider(makeProvider({ id: 'enabled', enabled: true }))
      facade.registerProvider(makeProvider({ id: 'disabled', enabled: false }))

      const result = await facade.search('test')
      expect(result.providers).toHaveLength(1)
    })
  })

  // ==================== detail ====================
  describe('detail()', () => {
    it('should return detail from specified provider', async () => {
      const detail = createMockMediaDetail({ id: 'media-1', title: 'Test Detail' })
      facade.registerProvider(makeProvider({ id: 'p1', detailResult: detail }))
      const result = await facade.detail('p1', 'media-1')
      expect(result.title).toBe('Test Detail')
    })

    it('should throw when provider not found', async () => {
      await expect(facade.detail('nonexistent', 'id')).rejects.toThrow('不存在')
    })
  })

  // ==================== catalog ====================
  describe('catalog()', () => {
    it('should return catalog items from specified provider', async () => {
      const p = makeProvider({ id: 'p1' })
      p.catalog = vi.fn().mockResolvedValue([createMockMediaItem({ title: 'Catalog Item' })])
      facade.registerProvider(p)

      const result = await facade.catalog('p1', 'movie', 'action')
      expect(result).toHaveLength(1)
      expect(p.catalog).toHaveBeenCalledWith('movie', 'action')
    })

    it('should return empty for provider without catalog method', async () => {
      const p = makeProvider({ id: 'p1' })
      p.catalog = undefined
      facade.registerProvider(p)

      const result = await facade.catalog('p1', 'movie', 'action')
      expect(result).toEqual([])
    })

    it('should return empty for unknown provider', async () => {
      const result = await facade.catalog('missing', 'movie', 'action')
      expect(result).toEqual([])
    })
  })

  // ==================== catalogAll ====================
  describe('catalogAll()', () => {
    it('should aggregate catalog from all providers', async () => {
      const p1 = makeProvider({ id: 'p1' })
      p1.catalog = vi.fn().mockResolvedValue([createMockMediaItem({ title: 'P1 Item' })])
      const p2 = makeProvider({ id: 'p2' })
      p2.catalog = vi.fn().mockResolvedValue([createMockMediaItem({ title: 'P2 Item' })])
      facade.registerProvider(p1)
      facade.registerProvider(p2)

      const result = await facade.catalogAll('movie', 'all')
      expect(result).toHaveLength(2)
    })

    it('should handle failed providers gracefully', async () => {
      const p1 = makeProvider({ id: 'p1' })
      p1.catalog = vi.fn().mockRejectedValue(new Error('fail'))
      const p2 = makeProvider({ id: 'p2' })
      p2.catalog = vi.fn().mockResolvedValue([createMockMediaItem({ title: 'P2 Item' })])
      facade.registerProvider(p1)
      facade.registerProvider(p2)

      const result = await facade.catalogAll('movie', 'all')
      expect(result).toHaveLength(1)
    })
  })

  // ==================== Provider Management ====================
  describe('getProviders()', () => {
    it('should return all providers', () => {
      facade.registerProvider(makeProvider({ id: 'a' }))
      facade.registerProvider(makeProvider({ id: 'b', enabled: false }))
      expect(facade.getProviders()).toHaveLength(2)
    })
  })

  describe('getEnabledProviders()', () => {
    it('should return only enabled', () => {
      facade.registerProvider(makeProvider({ id: 'a', enabled: true }))
      facade.registerProvider(makeProvider({ id: 'b', enabled: false }))
      expect(facade.getEnabledProviders()).toHaveLength(1)
    })
  })

  describe('healthCheck()', () => {
    it('should check health for all enabled providers', async () => {
      facade.registerProvider(makeProvider({ id: 'p1', healthy: true }))
      const results = await facade.healthCheck()
      expect(results).toHaveLength(1)
    })
  })

  describe('getHealthCache()', () => {
    it('should return empty initial cache', () => {
      expect(facade.getHealthCache()).toEqual([])
    })
  })
})
