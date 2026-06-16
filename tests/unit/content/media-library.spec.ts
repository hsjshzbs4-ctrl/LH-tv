// tests/unit/content/media-library.spec.ts — MediaLibraryService 单元测试
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MediaLibraryService } from '@/content/mediaLibrary'

const mockCatalog = vi.fn()
const mockCatalogAll = vi.fn()
const mockDetail = vi.fn()
const mockSearch = vi.fn()

vi.mock('@/core/providers', () => ({
  providerFacade: {
    search: (...args: unknown[]) => mockSearch(...args),
    catalog: (...args: unknown[]) => mockCatalog(...args),
    catalogAll: (...args: unknown[]) => mockCatalogAll(...args),
    detail: (...args: unknown[]) => mockDetail(...args),
  },
}))

function makeItem(overrides: Record<string, unknown> = {}) {
  return {
    id: '1', title: 'Test', cover: '', providerId: 'p1', providerName: 'TestP', type: 'movie' as const,
    ...overrides,
  }
}

describe('MediaLibraryService', () => {
  let service: MediaLibraryService

  beforeEach(() => {
    service = new MediaLibraryService()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('search()', () => {
    it('should delegate to providerFacade.search', async () => {
      const result = { items: [makeItem()], providers: ['p1'], totalFromCache: 1, totalFromNetwork: 1 }
      mockSearch.mockResolvedValue(result)
      const res = await service.search('test')
      expect(res).toEqual(result)
      expect(mockSearch).toHaveBeenCalledWith('test')
    })
  })

  describe('getHome()', () => {
    it('should return home sections', async () => {
      mockCatalog.mockResolvedValue([makeItem(), makeItem({ id: '2', title: 'Test2' })])
      const sections = await service.getHome()
      expect(sections.length).toBeGreaterThan(0)
      expect(sections[0]).toHaveProperty('category')
      expect(sections[0]).toHaveProperty('label')
      expect(sections[0]).toHaveProperty('items')
    })

    it('should handle provider errors gracefully', async () => {
      mockCatalog.mockRejectedValue(new Error('fail'))
      const sections = await service.getHome()
      // Should not throw, just return fewer sections
      expect(Array.isArray(sections)).toBe(true)
    })
  })

  describe('getTrending()', () => {
    it('should return sorted items', async () => {
      mockCatalog.mockResolvedValue([
        makeItem({ id: '1', score: 7 }),
        makeItem({ id: '2', score: 9 }),
        makeItem({ id: '3', score: 8 }),
      ])
      const items = await service.getTrending('movie', 'cn', 10)
      expect(items.length).toBeLessThanOrEqual(10)
      // Should be sorted by score desc
      for (let i = 0; i < items.length - 1; i++) {
        expect((items[i].score || 0)).toBeGreaterThanOrEqual((items[i + 1].score || 0))
      }
    })
  })

  describe('getLatest()', () => {
    it('should return sorted by year desc', async () => {
      mockCatalog.mockResolvedValue([
        makeItem({ id: '1', year: 2020 }),
        makeItem({ id: '2', year: 2024 }),
        makeItem({ id: '3', year: 2022 }),
      ])
      const items = await service.getLatest('movie', 'cn', 10)
      expect(items.length).toBeLessThanOrEqual(10)
      for (let i = 0; i < items.length - 1; i++) {
        expect((items[i].year || 0)).toBeGreaterThanOrEqual((items[i + 1].year || 0))
      }
    })
  })

  describe('getDetail()', () => {
    it('should delegate to providerFacade.detail', async () => {
      mockDetail.mockResolvedValue({ id: 'm1', title: 'Movie', cover: '', description: '', providerId: 'p1', episodes: [] })
      const detail = await service.getDetail('p1', 'm1')
      expect(detail.id).toBe('m1')
      expect(mockDetail).toHaveBeenCalledWith('p1', 'm1')
    })
  })

  describe('getCatalog()', () => {
    it('should delegate to providerFacade.catalog', async () => {
      mockCatalog.mockResolvedValue([makeItem()])
      const items = await service.getCatalog('p1', 'movie', 'cn')
      expect(items).toHaveLength(1)
      expect(mockCatalog).toHaveBeenCalledWith('p1', 'movie', 'cn')
    })
  })

  describe('getCatalogAll()', () => {
    it('should delegate to providerFacade.catalogAll', async () => {
      mockCatalogAll.mockResolvedValue([makeItem()])
      const items = await service.getCatalogAll('movie', 'cn')
      expect(items).toHaveLength(1)
      expect(mockCatalogAll).toHaveBeenCalledWith('movie', 'cn')
    })
  })
})
