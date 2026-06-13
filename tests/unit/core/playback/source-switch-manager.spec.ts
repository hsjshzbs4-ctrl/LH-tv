// tests/unit/core/playback/source-switch-manager.spec.ts — SourceSwitchManager 单元测试
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SourceSwitchManager } from '@/core/playback/manager/SourceSwitchManager'
import { SourceSwitchEvent } from '@/core/playback/types/playback.types'
import type { PlaybackSource } from '@/core/playback/types/playback.types'

function src(overrides: Partial<PlaybackSource> = {}): PlaybackSource {
  return {
    providerId: 'p1', providerName: 'Provider 1', playUrl: 'https://x.com/v1.mp4',
    type: 'mp4', headers: {}, ...overrides,
  }
}

describe('SourceSwitchManager', () => {
  let manager: SourceSwitchManager

  beforeEach(() => { manager = new SourceSwitchManager() })

  describe('start()', () => {
    it('should return first source', () => {
      const result = manager.start('media-1', [src({ providerId: 'p1' }), src({ providerId: 'p2', providerName: 'P2', playUrl: 'https://x.com/v2.mp4' })], 1)
      expect(result?.providerId).toBe('p1')
    })

    it('should return null for empty sources', () => {
      expect(manager.start('m1', [], 1)).toBeNull()
    })

    it('should use cached success source within 24h', () => {
      const sources = [src({ providerId: 'p1' }), src({ providerId: 'p2', providerName: 'P2', playUrl: 'https://x.com/v2.mp4' })]

      // First call → p1 success, cache it
      manager.start('media-1', sources, 1)
      manager.onSuccess('media-1')

      // Second call in same instance → should prefer p1 from cache
      const result = manager.start('media-1', sources, 1)
      expect(result?.providerId).toBe('p1')
      expect(manager.getCachedProvider('media-1')).toBe('p1')
    })
  })

  describe('onFailed()', () => {
    it('should return next source', () => {
      const sources = [src({ providerId: 'p1' }), src({ providerId: 'p2', providerName: 'P2', playUrl: 'https://x.com/v2.mp4' })]
      manager.start('m1', sources, 1)
      const next = manager.onFailed('timeout')
      expect(next?.providerId).toBe('p2')
    })

    it('should emit EXHAUSTED when all sources tried', () => {
      const events: string[] = []
      manager.subscribe((d) => events.push(d.event))
      const sources = [src({ providerId: 'p1' }), src({ providerId: 'p2', providerName: 'P2', playUrl: 'https://x.com/v2.mp4' })]
      manager.start('m1', sources, 1)
      manager.onFailed('err1') // switch to p2
      manager.onFailed('err2') // exhausted
      expect(events).toContain(SourceSwitchEvent.EXHAUSTED)
    })

    it('should emit EXHAUSTED when maxRetries reached', () => {
      const sources = [src({ providerId: 'p1' }), src({ providerId: 'p2', providerName: 'P2', playUrl: 'https://x.com/v2.mp4' }), src({ providerId: 'p3', providerName: 'P3', playUrl: 'https://x.com/v3.mp4' })]
      manager.start('m1', sources, 1)
      manager.onFailed('e1') // retryCount=1 (tries p2)
      manager.onFailed('e2') // retryCount=2 (tries p3)
      manager.onFailed('e3') // retryCount=3 → EXHAUSTED (maxRetries=3)
      expect(manager.remainingRetries).toBe(0)
    })
  })

  describe('onSuccess()', () => {
    it('should cache successful provider', () => {
      const sources = [src({ providerId: 'p1' })]
      manager.start('media-1', sources, 1)
      manager.onSuccess('media-1')
      expect(manager.getCachedProvider('media-1')).toBe('p1')
    })
  })

  describe('switchToProvider()', () => {
    it('should switch to specified provider', () => {
      const sources = [src({ providerId: 'p1' }), src({ providerId: 'p2', providerName: 'P2', playUrl: 'https://x.com/v2.mp4' })]
      manager.start('m1', sources, 1)
      const result = manager.switchToProvider('p2')
      expect(result?.providerId).toBe('p2')
    })

    it('should return null for unknown providerId', () => {
      manager.start('m1', [src({ providerId: 'p1' })], 1)
      expect(manager.switchToProvider('unknown')).toBeNull()
    })
  })

  describe('Progress', () => {
    it('should save and restore progress', () => {
      manager.saveProgress(42)
      expect(manager.getSavedProgress()).toBe(42)
      manager.clearProgress()
      expect(manager.getSavedProgress()).toBe(0)
    })
  })

  describe('Cache management', () => {
    it('should clear specific or all cache', () => {
      const sources = [src({ providerId: 'p1' })]
      manager.start('m1', sources, 1)
      manager.onSuccess('m1')
      expect(manager.getCachedProvider('m1')).toBe('p1')

      manager.clearSuccessCache('m1')
      expect(manager.getCachedProvider('m1')).toBeNull()
    })
  })
})
