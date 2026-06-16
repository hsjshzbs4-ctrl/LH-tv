// tests/unit/player/episode-manager.spec.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { EpisodeManager } from '@/player/episodeManager'

function makeEp(id: string, num: number, title?: string) {
  return { id, title: title || `第${num}集`, episodeNumber: num }
}

describe('EpisodeManager', () => {
  let manager: EpisodeManager

  beforeEach(() => { manager = new EpisodeManager() })

  describe('loadEpisodeList()', () => {
    it('should load and auto-select first episode', () => {
      const eps = [makeEp('e1', 1), makeEp('e2', 2), makeEp('e3', 3)]
      manager.loadEpisodeList(eps)
      expect(manager.episodeCount).toBe(3)
      expect(manager.currentIndex).toBe(0)
      expect(manager.currentEpisode?.id).toBe('e1')
    })

    it('should handle empty list', () => {
      manager.loadEpisodeList([])
      expect(manager.episodeCount).toBe(0)
      expect(manager.currentIndex).toBe(-1)
    })
  })

  describe('selectEpisode()', () => {
    it('should select by index', () => {
      manager.loadEpisodeList([makeEp('e1', 1), makeEp('e2', 2)])
      const ep = manager.selectEpisode(1)
      expect(ep?.id).toBe('e2')
      expect(manager.currentIndex).toBe(1)
    })

    it('should return null for out-of-bounds', () => {
      manager.loadEpisodeList([makeEp('e1', 1)])
      expect(manager.selectEpisode(-1)).toBeNull()
      expect(manager.selectEpisode(99)).toBeNull()
    })
  })

  describe('selectById()', () => {
    it('should find by id', () => {
      manager.loadEpisodeList([makeEp('e1', 1), makeEp('e2', 2)])
      expect(manager.selectById('e2')?.id).toBe('e2')
    })

    it('should return null when not found', () => {
      manager.loadEpisodeList([makeEp('e1', 1)])
      expect(manager.selectById('nonexistent')).toBeNull()
    })
  })

  describe('navigation', () => {
    beforeEach(() => {
      manager.loadEpisodeList([makeEp('e1', 1), makeEp('e2', 2), makeEp('e3', 3)])
    })

    it('nextEpisode should advance', () => {
      expect(manager.nextEpisode()?.id).toBe('e2')
      expect(manager.nextEpisode()?.id).toBe('e3')
      expect(manager.nextEpisode()).toBeNull()
    })

    it('previousEpisode should go back', () => {
      manager.selectEpisode(2)
      expect(manager.previousEpisode()?.id).toBe('e2')
      expect(manager.previousEpisode()?.id).toBe('e1')
      expect(manager.previousEpisode()).toBeNull()
    })
  })

  describe('autoPlayNext', () => {
    it('should be true by default', () => {
      expect(manager.autoPlayNext).toBe(true)
    })

    it('shouldReturnAutoPlayWhenHasNext', () => {
      manager.loadEpisodeList([makeEp('e1', 1), makeEp('e2', 2)])
      expect(manager.shouldAutoPlayNext()).toBe(true)
    })

    it('should return false on last episode', () => {
      manager.loadEpisodeList([makeEp('e1', 1)])
      expect(manager.shouldAutoPlayNext()).toBe(false)
    })
  })
})
