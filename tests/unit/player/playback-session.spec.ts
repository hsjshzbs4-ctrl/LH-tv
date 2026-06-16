// tests/unit/player/playback-session.spec.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { PlaybackSessionTracker } from '@/player/playbackSession'

describe('PlaybackSessionTracker', () => {
  let tracker: PlaybackSessionTracker

  beforeEach(() => {
    tracker = new PlaybackSessionTracker()
    sessionStorage.clear()
  })

  afterEach(() => { vi.restoreAllMocks() })

  describe('begin()', () => {
    it('should start a new session', () => {
      const s = tracker.begin('m1', 'ep1', 'p1', 1200)
      expect(s.mediaId).toBe('m1')
      expect(s.episodeId).toBe('ep1')
      expect(s.progress).toBe(0)
      expect(tracker.isActive()).toBe(true)
    })

    it('should end previous session on new begin', () => {
      tracker.begin('m1', 'ep1', 'p1')
      tracker.begin('m2', 'ep2', 'p1')
      expect(tracker.getSession()?.mediaId).toBe('m2')
    })
  })

  describe('updateProgress()', () => {
    it('should update progress and lastPosition', () => {
      tracker.begin('m1', 'ep1', 'p1', 1200)
      tracker.updateProgress(600, 1200)
      const s = tracker.getSession()
      expect(s?.progress).toBe(0.5)
      expect(s?.lastPosition).toBe(600)
    })

    it('should handle zero duration', () => {
      tracker.begin('m1', 'ep1', 'p1', 0)
      tracker.updateProgress(100, 0)
      expect(tracker.getSession()?.progress).toBe(0)
    })
  })

  describe('end()', () => {
    it('should end session and persist', () => {
      tracker.begin('m1', 'ep1', 'p1')
      tracker.end()
      expect(tracker.isActive()).toBe(false)
      expect(tracker.getSession()).toBeNull()
    })
  })
})
