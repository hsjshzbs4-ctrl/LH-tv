// tests/unit/content/category-service.spec.ts — CategoryService 单元测试
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { CategoryService } from '@/content/categoryService'

const mockCatalog = vi.fn()
const mockCatalogAll = vi.fn()

vi.mock('@/core/providers', () => ({
  providerFacade: {
    catalog: (...args: unknown[]) => mockCatalog(...args),
    catalogAll: (...args: unknown[]) => mockCatalogAll(...args),
  },
}))

describe('CategoryService', () => {
  let service: CategoryService

  beforeEach(() => {
    service = new CategoryService()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getCategory()', () => {
    it('should call catalog with correct provider and type', async () => {
      mockCatalog.mockResolvedValue([{ id: '1', title: 'Movie' }])
      const items = await service.getCategory('movie', 'cn')
      expect(items).toHaveLength(1)
      expect(mockCatalog).toHaveBeenCalledWith('applecms', 'movie', 'cn')
    })

    it('should use default sub-category if not specified', async () => {
      mockCatalog.mockResolvedValue([])
      await service.getCategory('movie')
      expect(mockCatalog).toHaveBeenCalledWith('applecms', 'movie', 'cn')
    })

    it('should handle provider errors', async () => {
      mockCatalog.mockRejectedValue(new Error('timeout'))
      const items = await service.getCategory('movie')
      expect(items).toEqual([])
    })
  })

  describe('getSubCategories()', () => {
    it('should return sub-categories for movie', () => {
      const subs = service.getSubCategories('movie')
      expect(subs).toContain('cn')
      expect(subs).toContain('us')
    })

    it('should return sub-categories for anime', () => {
      const subs = service.getSubCategories('anime')
      expect(subs).toContain('jp')
    })
  })

  describe('getCategoryLabel()', () => {
    it('should return Chinese labels', () => {
      expect(service.getCategoryLabel('movie')).toBe('电影')
      expect(service.getCategoryLabel('tv')).toBe('电视剧')
      expect(service.getCategoryLabel('documentary')).toBe('纪录片')
    })
  })

  describe('getAllCategories()', () => {
    it('should return all 5 categories', () => {
      const cats = service.getAllCategories()
      expect(cats).toHaveLength(5)
      expect(cats).toContain('movie')
      expect(cats).toContain('tv')
      expect(cats).toContain('anime')
      expect(cats).toContain('variety')
      expect(cats).toContain('documentary')
    })
  })

  describe('getCategoryAll()', () => {
    it('should aggregate from all providers', async () => {
      mockCatalogAll.mockResolvedValue([{ id: '1' }, { id: '2' }])
      const items = await service.getCategoryAll('movie', 'cn')
      expect(items).toHaveLength(2)
    })

    it('should handle errors', async () => {
      mockCatalogAll.mockRejectedValue(new Error('fail'))
      const items = await service.getCategoryAll('movie')
      expect(items).toEqual([])
    })
  })
})
