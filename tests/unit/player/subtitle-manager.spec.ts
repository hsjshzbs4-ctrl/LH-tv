// tests/unit/player/subtitle-manager.spec.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { SubtitleManager } from '@/player/subtitleManager'

function makeTrack(overrides: Record<string, unknown> = {}) {
  return {
    id: 't1', label: 'Chinese', language: 'zh',
    url: '/sub.vtt', format: 'vtt' as const, enabled: true,
    ...overrides,
  }
}

describe('SubtitleManager', () => {
  let manager: SubtitleManager

  beforeEach(() => { manager = new SubtitleManager() })

  describe('default state', () => {
    it('should start disabled', () => {
      expect(manager.enabled).toBe(false)
    })
  })

  describe('loadSubtitles()', () => {
    it('should load track list', () => {
      manager.loadSubtitles([makeTrack(), makeTrack({ id: 't2', label: 'English', language: 'en', enabled: false })])
      expect(manager.listTracks()).toHaveLength(2)
    })
  })

  describe('enable/disable', () => {
    it('should toggle enabled state', () => {
      manager.enableSubtitle()
      expect(manager.enabled).toBe(true)
      manager.disableSubtitle()
      expect(manager.enabled).toBe(false)
    })
  })

  describe('switchTrack()', () => {
    it('should switch active track', () => {
      manager.loadSubtitles([
        makeTrack({ id: 't1', enabled: true }),
        makeTrack({ id: 't2', enabled: false }),
      ])
      manager.switchTrack('t2')
      expect(manager.currentTrack?.id).toBe('t2')
    })
  })

  describe('attachVideo()', () => {
    it('should accept video element', () => {
      const video = document.createElement('video')
      expect(() => manager.attachVideo(video)).not.toThrow()
    })
  })
})
