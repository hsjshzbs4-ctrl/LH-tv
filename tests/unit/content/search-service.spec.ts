// tests/unit/content/search-service.spec.ts — SearchService 单元测试
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SearchService } from '@/content/searchService'

const mockSearch = vi.fn()

vi.mock('@/core/providers', () => ({
  providerFacade: {
    search: (...args: unknown[]) => mockSearch(...args),
  },
}))

function makeItem(overrides: Record<string, unknown> = {}) {
  return {
    id: '1', title: 'Test', cover: '', providerId: 'p1', providerName: 'TestP', type: 'movie' as const,
    ...overrides,
  }
}

describe('SearchService', () => {
  let service: SearchService

  beforeEach(() => {
    service = new SearchService()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('search()', () => {
    it('should return aggregated results', async () => {
      const items = [makeItem({ id: '1', type: 'movie' as const }), makeItem({ id: '2', type: 'tv' as const })]
      mockSearch.mockResolvedValue({ items, providers: ['p1'], totalFromCache: 2, totalFromNetwork: 2 })
      const result = await service.search('naruto')
      expect(result.items).toHaveLength(2)
      expect(mockSearch).toHaveBeenCalledWith('naruto')
    })

    it('should filter by category', async () => {
      const items = [
        makeItem({ id: '1', type: 'movie' as const }),
        makeItem({ id: '2', type: 'tv' as const }),
        makeItem({ id: '3', type: 'anime' as const }),
      ]
      mockSearch.mockResolvedValue({ items, providers: ['p1'], totalFromCache: 3, totalFromNetwork: 3 })
      const result = await service.search('test', { category: 'movie' })
      expect(result.items).toHaveLength(1)
      expect(result.items[0].type).toBe('movie')
    })

    it('should filter by year', async () => {
      const items = [
        makeItem({ id: '1', year: 2024 }),
        makeItem({ id: '2', year: 2023 }),
      ]
      mockSearch.mockResolvedValue({ items, providers: ['p1'], totalFromCache: 2, totalFromNetwork: 2 })
      const result = await service.search('test', { year: 2024 })
      expect(result.items).toHaveLength(1)
      expect(result.items[0].year).toBe(2024)
    })

    it('should filter by providerId', async () => {
      const items = [
        makeItem({ id: '1', providerId: 'p1' }),
        makeItem({ id: '2', providerId: 'p2' }),
      ]
      mockSearch.mockResolvedValue({ items, providers: ['p1', 'p2'], totalFromCache: 2, totalFromNetwork: 2 })
      const result = await service.search('test', { providerId: 'p1' })
      expect(result.items).toHaveLength(1)
      expect(result.items[0].providerId).toBe('p1')
    })

    it('should return empty when no filter matches', async () => {
      mockSearch.mockResolvedValue({ items: [makeItem({ year: 2024 })], providers: ['p1'], totalFromCache: 1, totalFromNetwork: 1 })
      const result = await service.search('test', { year: 2099 })
      expect(result.items).toHaveLength(0)
    })
  })

  describe('searchAll()', () => {
    it('should return just the items array', async () => {
      mockSearch.mockResolvedValue({ items: [makeItem(), makeItem({ id: '2' })], providers: ['p1'], totalFromCache: 2, totalFromNetwork: 2 })
      const items = await service.searchAll('test')
      expect(items).toHaveLength(2)
    })
  })
})
