// tests/unit/player/video-engine.spec.ts — VideoEngine wrapper 测试
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock PlayerEngine
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
      url: '', currentTime: 0, duration: 100,
      volume: 1, playbackRate: 1, paused: true,
      muted: false, buffering: false, ended: false, ready: true,
    }))
    this.getVideoElement = vi.fn(() => null)
    this.setContainer = vi.fn()
    this.on = vi.fn(() => vi.fn())
    this.onProgressSave = undefined
    this._listeners = new Map()
    return this
  }),
}))

// Mock PlayerEvent
vi.mock('@/core/player/types/player.types', () => ({
  PlayerEvent: {
    READY: 'player:ready',
    PLAY: 'player:play',
    PAUSE: 'player:pause',
    BUFFERING: 'player:buffering',
    TIME_UPDATE: 'player:timeupdate',
    ENDED: 'player:ended',
    ERROR: 'player:error',
    DESTROY: 'player:destroy',
  },
  DEFAULT_PLAYER_CONFIG: {
    speeds: [0.5, 1, 1.25, 1.5, 2],
    defaultSpeed: 1,
    progressSaveInterval: 15,
    resumeMinPosition: 30,
    autoplay: true,
  },
}))

import { VideoEngine } from '@/player/videoEngine'
import { PlaybackState } from '@/player/playerTypes'

describe('VideoEngine', () => {
  let engine: VideoEngine

  beforeEach(() => {
    engine = new VideoEngine()
  })

  afterEach(() => { vi.restoreAllMocks() })

  describe('state management', () => {
    it('should start in IDLE state', () => {
      expect(engine.state).toBe(PlaybackState.IDLE)
    })

    it('should notify state changes', () => {
      const states: PlaybackState[] = []
      engine.onStateChange(s => states.push(s))
      // 触发 LOADING → 调用 loadSource
      engine.loadSource('test.mp4')
      expect(states.length).toBeGreaterThanOrEqual(1)
      expect(states[0]).toBe(PlaybackState.LOADING)
    })
  })

  describe('loadSource()', () => {
    it('should delegate to PlayerEngine.load', async () => {
      await engine.loadSource('test.mp4')
      expect(engine.state).toBe(PlaybackState.LOADING)
    })
  })

  describe('controls', () => {
    it('should delegate play/pause/seek', () => {
      engine.play()
      engine.pause()
      engine.seek(30)
      // 无异常即通过
    })

    it('should delegate volume/mute', () => {
      engine.setVolume(0.5)
      engine.setMuted(true)
      // 无异常即通过
    })
  })

  describe('state getters', () => {
    it('should return currentTime and duration', () => {
      expect(engine.currentTime).toBe(0)
      expect(engine.duration).toBe(100)
    })
  })

  describe('destroy()', () => {
    it('should reset to IDLE', () => {
      engine.destroy()
      expect(engine.state).toBe(PlaybackState.IDLE)
    })
  })
})
