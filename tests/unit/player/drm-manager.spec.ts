// tests/unit/player/drm-manager.spec.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { DRMManager } from '@/player/drmManager'
import { DRMType } from '@/player/playerTypes'

describe('DRMManager', () => {
  let manager: DRMManager

  beforeEach(() => { manager = new DRMManager() })

  describe('detectDRM()', () => {
    it('should detect widevine in URL', () => {
      expect(manager.detectDRM('https://cdn.example.com/video.wvm')).toBe(DRMType.WIDEVINE)
    })

    it('should detect fairplay in URL', () => {
      expect(manager.detectDRM('https://cdn.example.com/video_fp.m3u8')).toBe(DRMType.FAIRPLAY)
    })

    it('should detect playready in URL', () => {
      expect(manager.detectDRM('https://cdn.example.com/video_pr.ism')).toBe(DRMType.PLAYREADY)
    })

    it('should return NONE for regular URL', () => {
      expect(manager.detectDRM('https://cdn.example.com/video.mp4')).toBe(DRMType.NONE)
    })
  })

  describe('getDRMSupport()', () => {
    it('should return all DRM types with support status', () => {
      const support = manager.getDRMSupport()
      expect(support).toHaveLength(3)
      expect(support[0].type).toBe(DRMType.WIDEVINE)
      expect(support[1].type).toBe(DRMType.FAIRPLAY)
      expect(support[2].type).toBe(DRMType.PLAYREADY)
    })
  })

  describe('stub methods', () => {
    it('isWidevineSupported should return boolean', () => {
      expect(typeof manager.isWidevineSupported()).toBe('boolean')
    })

    it('isFairPlaySupported should return boolean', () => {
      expect(typeof manager.isFairPlaySupported()).toBe('boolean')
    })

    it('isPlayReadySupported should return boolean', () => {
      expect(typeof manager.isPlayReadySupported()).toBe('boolean')
    })
  })
})
