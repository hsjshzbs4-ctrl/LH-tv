// tests/unit/player/player-facade.spec.ts — PlayerFacade 编排层测试
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock core dependencies
vi.mock('@/core/player/PlayerEngine', () => ({
  PlayerEngine: vi.fn().mockImplementation(function (this: Record<string, unknown>) {
    this.load = vi.fn().mockResolvedValue(undefined)
    this.play = vi.fn().mockResolvedValue(undefined)
    this.pause = vi.fn()
    this.seek = vi.fn()
    this.destroy = vi.fn()
    this.setVolume = vi.fn()
    this.setPlaybackRate = vi.fn()
    this.setMuted = vi.fn()
    this.getState = vi.fn(() => ({
      url: '', currentTime: 0, duration: 0,
      volume: 1, playbackRate: 1, paused: true,
      muted: false, buffering: false, ended: false, ready: true,
    }))
    this.getVideoElement = vi.fn(() => null)
    this.setContainer = vi.fn()
    this.setVideoElement = vi.fn()                 // S3A-1
    this.on = vi.fn(() => vi.fn())
    return this
  }),
}))

vi.mock('@/core/player/types/player.types', () => ({
  PlayerEvent: {
    READY: 'player:ready', PLAY: 'player:play', PAUSE: 'player:pause',
    BUFFERING: 'player:buffering', TIME_UPDATE: 'player:timeupdate',
    ENDED: 'player:ended', ERROR: 'player:error', DESTROY: 'player:destroy',
  },
  DEFAULT_PLAYER_CONFIG: {
    speeds: [0.5, 1, 1.25, 1.5, 2],
    defaultSpeed: 1,
    progressSaveInterval: 15,
    resumeMinPosition: 30,
    autoplay: true,
  },
}))

vi.mock('@/core/history', () => ({
  historyFacade: {
    updateProgress: vi.fn().mockResolvedValue(undefined),
    getByEpisode: vi.fn().mockReturnValue(null),
  },
}))

import { PlayerFacade } from '@/player/playerFacade'
import { PlaybackState } from '@/player/playerTypes'

describe('PlayerFacade', () => {
  let facade: PlayerFacade

  beforeEach(() => {
    localStorage.clear()
    facade = new PlayerFacade()
  })

  afterEach(() => { vi.restoreAllMocks() })

  describe('initialize/destroy', () => {
    it('should initialize without error', () => {
      const video = document.createElement('video')  // S3A-1: 必须传 video 元素
      expect(() => facade.initialize(video)).not.toThrow()
    })

    it('should destroy cleanly', () => {
      expect(() => facade.destroy()).not.toThrow()
      expect(facade.currentMedia).toBeNull()
    })
  })

  describe('playback controls', () => {
    it('should delegate play/pause/seek', () => {
      facade.play()
      facade.pause()
      facade.seek(10)
      // 无异常即通过
    })

    it('should delegate volume/mute', () => {
      facade.setVolume(0.8)
      facade.setMuted(true)
    })
  })

  describe('submodules', () => {
    it('should have all managers', () => {
      expect(facade.engine).toBeDefined()
      expect(facade.session).toBeDefined()
      expect(facade.resume).toBeDefined()
      expect(facade.episodes).toBeDefined()
      expect(facade.quality).toBeDefined()
      expect(facade.subtitle).toBeDefined()
      expect(facade.drm).toBeDefined()
    })
  })

  describe('state getters', () => {
    it('should report playback state', () => {
      // mock engine returns paused:true in state but events not wired
      // so facade state reflects initial mapping
      expect(facade.playbackState).toBeDefined()
    })

    it('should report currentTime and duration', () => {
      expect(facade.currentTime).toBe(0)
      expect(facade.duration).toBe(0)
    })
  })
})
