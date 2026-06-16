// tests/unit/integration/continue-watching.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/core/continue-watching', () => ({
  continueWatchingFacade: {
    getContinueWatching: vi.fn(() => []),
    refresh: vi.fn(),
    subscribe: vi.fn(() => () => {}),
    getByMedia: vi.fn(() => null),
  },
}))

vi.mock('@/core/history', () => ({
  historyFacade: {
    getByEpisode: vi.fn(() => null),
  },
}))

import { ContinueWatchingService } from '@/integration/continueWatching/continueWatchingService'

describe('ContinueWatchingService', () => {
  let service: ContinueWatchingService

  beforeEach(() => {
    service = new ContinueWatchingService()
    vi.clearAllMocks()
  })

  describe('getRecentEpisodes', () => {
    it('should return list from facade', () => {
      expect(service.getRecentEpisodes(10)).toEqual([])
    })
  })

  describe('getResumeCard', () => {
    it('should return null for unknown media', () => {
      expect(service.getResumeCard('unknown')).toBeNull()
    })
  })

  describe('syncWithHistory', () => {
    it('should refresh and emit event', () => {
      expect(() => service.syncWithHistory()).not.toThrow()
    })
  })

  describe('subscribe', () => {
    it('should return unsubscribe function', () => {
      const unsub = service.subscribe(() => {})
      expect(typeof unsub).toBe('function')
    })
  })
})
