// tests/unit/content/favorite-service.spec.ts — FavoriteService 单元测试
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { FavoriteService } from '@/content/favoriteService'
import { favoritesFacade } from '@/core/favorites'

vi.mock('@/core/favorites', () => ({
  favoritesFacade: {
    addFavorite: vi.fn(),
    removeFavorite: vi.fn(),
    toggleFavorite: vi.fn(),
    isFavorite: vi.fn(),
    getFavorites: vi.fn(),
    search: vi.fn(),
    subscribe: vi.fn(),
  },
}))

function makeMediaItem(overrides: Record<string, unknown> = {}) {
  return {
    id: 'm1',
    title: 'Test Movie',
    cover: '',
    providerId: 'p1',
    providerName: 'TestP',
    type: 'movie' as const,
    ...overrides,
  }
}

describe('FavoriteService', () => {
  let service: FavoriteService

  beforeEach(() => {
    service = new FavoriteService()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('addFavorite()', () => {
    it('should convert MediaItem and call facade', async () => {
      vi.mocked(favoritesFacade.addFavorite).mockResolvedValue()
      await service.addFavorite(makeMediaItem())
      expect(favoritesFacade.addFavorite).toHaveBeenCalledWith(
        expect.objectContaining({ mediaId: 'm1', title: 'Test Movie' })
      )
    })
  })

  describe('removeFavorite()', () => {
    it('should delegate to facade', async () => {
      vi.mocked(favoritesFacade.removeFavorite).mockResolvedValue()
      await service.removeFavorite('m1')
      expect(favoritesFacade.removeFavorite).toHaveBeenCalledWith('m1')
    })
  })

  describe('toggleFavorite()', () => {
    it('should delegate to facade', async () => {
      vi.mocked(favoritesFacade.toggleFavorite).mockResolvedValue()
      await service.toggleFavorite(makeMediaItem())
      expect(favoritesFacade.toggleFavorite).toHaveBeenCalled()
    })
  })

  describe('isFavorite()', () => {
    it('should return facade result', () => {
      vi.mocked(favoritesFacade.isFavorite).mockReturnValue(true)
      expect(service.isFavorite('m1')).toBe(true)
      vi.mocked(favoritesFacade.isFavorite).mockReturnValue(false)
      expect(service.isFavorite('m2')).toBe(false)
    })
  })

  describe('getFavorites()', () => {
    it('should return facade favorites', () => {
      const favList = [
        { id: 'f1', mediaId: 'm1', providerId: 'p1', title: 'T1', cover: '', favoritedAt: Date.now() },
      ]
      vi.mocked(favoritesFacade.getFavorites).mockReturnValue(favList)
      expect(service.getFavorites()).toEqual(favList)
    })
  })

  describe('search()', () => {
    it('should delegate to facade', () => {
      vi.mocked(favoritesFacade.search).mockReturnValue([])
      expect(service.search('test')).toEqual([])
      expect(favoritesFacade.search).toHaveBeenCalledWith('test')
    })
  })

  describe('subscribe()', () => {
    it('should delegate to facade', () => {
      const cb = vi.fn()
      vi.mocked(favoritesFacade.subscribe).mockReturnValue(() => {})
      const unsub = service.subscribe(cb)
      expect(typeof unsub).toBe('function')
      expect(favoritesFacade.subscribe).toHaveBeenCalledWith(cb)
    })
  })
})
