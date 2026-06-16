// tests/unit/player/quality-manager.spec.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { QualityManager } from '@/player/qualityManager'
import { PlaybackQuality } from '@/player/playerTypes'

describe('QualityManager', () => {
  let manager: QualityManager

  beforeEach(() => { manager = new QualityManager() })

  describe('default', () => {
    it('should default to AUTO', () => {
      expect(manager.getQuality()).toBe(PlaybackQuality.AUTO)
    })
  })

  describe('setQuality()', () => {
    it('should change quality', () => {
      manager.setQuality(PlaybackQuality.P720)
      expect(manager.getQuality()).toBe(PlaybackQuality.P720)
    })
  })

  describe('listQualities()', () => {
    it('should return all qualities with active flag', () => {
      const list = manager.listQualities()
      expect(list.length).toBe(5)
      expect(list[0].active).toBe(true) // AUTO is default
    })

    it('should mark active quality', () => {
      manager.setQuality(PlaybackQuality.P1080)
      const list = manager.listQualities()
      const active = list.find(q => q.active)
      expect(active?.quality).toBe(PlaybackQuality.P1080)
    })
  })

  describe('bindHLS()', () => {
    it('should accept HLS instance without error', () => {
      expect(() => manager.bindHLS({})).not.toThrow()
    })
  })
})
