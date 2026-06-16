// tests/unit/content/content-store.spec.ts — ContentStore 单元测试
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useContentStore } from '@/stores/contentStore'

// Mock all content services
vi.mock('@/content/mediaLibrary', () => ({
  mediaLibraryService: {
    getHome: vi.fn().mockResolvedValue([]),
    getTrending: vi.fn().mockResolvedValue([]),
    getLatest: vi.fn().mockResolvedValue([]),
    getDetail: vi.fn().mockResolvedValue(null),
    getCatalog: vi.fn().mockResolvedValue([]),
    getCatalogAll: vi.fn().mockResolvedValue([]),
  },
}))

vi.mock('@/content/searchService', () => ({
  searchService: {
    search: vi.fn().mockResolvedValue({ items: [], providers: [], totalFromCache: 0, totalFromNetwork: 0 }),
    searchAll: vi.fn().mockResolvedValue([]),
  },
}))

vi.mock('@/content/categoryService', () => ({
  categoryService: {
    getCategory: vi.fn().mockResolvedValue([]),
    getSubCategories: vi.fn().mockReturnValue(['cn', 'us', 'kr']),
    getCategoryLabel: vi.fn((c: string) => c),
    getAllCategories: vi.fn().mockReturnValue(['movie', 'tv', 'anime', 'variety', 'documentary']),
    getCategoryAll: vi.fn().mockResolvedValue([]),
  },
}))

vi.mock('@/content/favoriteService', () => ({
  favoriteService: {
    addFavorite: vi.fn(),
    removeFavorite: vi.fn(),
    toggleFavorite: vi.fn(),
    isFavorite: vi.fn().mockReturnValue(false),
    getFavorites: vi.fn().mockReturnValue([]),
    search: vi.fn().mockReturnValue([]),
    subscribe: vi.fn().mockReturnValue(() => {}),
  },
}))

vi.mock('@/content/historyService', () => ({
  historyService: {
    recordHistory: vi.fn(),
    updateProgress: vi.fn(),
    removeHistory: vi.fn(),
    clearHistory: vi.fn(),
    getHistory: vi.fn().mockReturnValue([]),
    getContinueWatching: vi.fn().mockReturnValue([]),
    getPlaybackPosition: vi.fn().mockReturnValue(0),
    search: vi.fn().mockReturnValue([]),
    subscribe: vi.fn().mockReturnValue(() => {}),
  },
}))

describe('useContentStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should have correct initial values', () => {
      const store = useContentStore()
      expect(store.isLoaded).toBe(false)
      expect(store.homeSections).toEqual([])
      expect(store.searchResults).toEqual([])
      expect(store.categoryItems).toEqual([])
      expect(store.favorites).toEqual([])
      expect(store.history).toEqual([])
      expect(store.continueWatching).toEqual([])
      expect(store.error).toBeNull()
      expect(store.homeLoading).toBe(false)
      expect(store.searchLoading).toBe(false)
      expect(store.hasSearchResults).toBe(false)
    })
  })

  describe('initialize()', () => {
    it('should set isLoaded and sync data', async () => {
      const store = useContentStore()
      await store.initialize()
      expect(store.isLoaded).toBe(true)
    })

    it('should be idempotent', async () => {
      const store = useContentStore()
      await store.initialize()
      await store.initialize()
      expect(store.isLoaded).toBe(true)
    })
  })

  describe('loadHome()', () => {
    it('should set homeLoading during load', async () => {
      const store = useContentStore()
      const promise = store.loadHome()
      expect(store.homeLoading).toBe(true)
      await promise
      expect(store.homeLoading).toBe(false)
    })
  })

  describe('search()', () => {
    it('should set searchLoading and update keyword', async () => {
      const store = useContentStore()
      await store.search('naruto')
      expect(store.lastSearchKeyword).toBe('naruto')
      expect(store.searchLoading).toBe(false)
    })
  })

  describe('loadCategory()', () => {
    it('should set activeCategory and activeSubCategory', async () => {
      const store = useContentStore()
      await store.loadCategory('anime', 'jp')
      expect(store.activeCategory).toBe('anime')
      expect(store.activeSubCategory).toBe('jp')
    })

    it('should use default sub when not specified', async () => {
      const store = useContentStore()
      await store.loadCategory('movie')
      expect(store.activeCategory).toBe('movie')
      expect(store.activeSubCategory).toBe('cn')
    })
  })

  describe('error handling', () => {
    it('should clear error', () => {
      const store = useContentStore()
      // Force error state
      store.$patch({ error: 'test error' })
      expect(store.error).toBe('test error')
      store.clearError()
      expect(store.error).toBeNull()
    })
  })

  describe('computed properties', () => {
    it('categorySubs should return sub-categories', () => {
      const store = useContentStore()
      expect(store.categorySubs).toContain('cn')
    })

    it('favoriteCount should reflect favorites length', () => {
      const store = useContentStore()
      expect(store.favoriteCount).toBe(0)
    })
  })
})
