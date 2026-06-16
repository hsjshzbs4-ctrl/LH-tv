// tests/unit/player/player-store.spec.ts — PlayerStore 测试
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Mock PlayerFacade
vi.mock('@/player/playerFacade', () => {
  // 不能用 getter 语法，用普通属性模拟
  const mockFacade = {
    engine: {
      on: vi.fn(() => vi.fn()),
      loadSource: vi.fn().mockResolvedValue(undefined),
      play: vi.fn().mockResolvedValue(undefined),
      pause: vi.fn(),
      seek: vi.fn(),
      destroy: vi.fn(),
      setVolume: vi.fn(),
      setMuted: vi.fn(),
      currentTime: 0,
      duration: 1200,
      state: 'paused',
      attachElement: vi.fn(),
    },
    session: { begin: vi.fn(), end: vi.fn(), updateProgress: vi.fn() },
    resume: { loadPosition: vi.fn().mockResolvedValue(0), shouldResume: vi.fn().mockReturnValue(false), savePosition: vi.fn() },
    episodes: {
      loadEpisodeList: vi.fn(),
      selectById: vi.fn(),
      shouldAutoPlayNext: vi.fn().mockReturnValue(false),
      nextEpisode: vi.fn().mockReturnValue(null),
      currentEpisode: null,
    },
    quality: { setQuality: vi.fn(), getQuality: vi.fn(() => 'Auto') },
    subtitle: { enableSubtitle: vi.fn(), disableSubtitle: vi.fn(), switchTrack: vi.fn(), loadSubtitles: vi.fn() },
    drm: { detectDRM: vi.fn(() => 'none') },
    loadMedia: vi.fn().mockResolvedValue(undefined),
    switchEpisode: vi.fn().mockResolvedValue(undefined),
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    seek: vi.fn(),
    setVolume: vi.fn(),
    setMuted: vi.fn(),
    switchQuality: vi.fn(),
    enableSubtitle: vi.fn(),
    disableSubtitle: vi.fn(),
    on: vi.fn(() => vi.fn()),
    destroy: vi.fn(),
    currentTime: 0,
    duration: 0,
    playbackState: 'idle',
    currentMedia: null,
  }

  return {
    PlayerFacade: vi.fn(() => mockFacade),
  }
})

vi.mock('@/core/player/types/player.types', () => ({
  PlayerEvent: { READY: 'r', PLAY: 'p', PAUSE: 'pa', ENDED: 'e', ERROR: 'er', TIME_UPDATE: 't' },
  DEFAULT_PLAYER_CONFIG: {},
}))

// Mock telemetry
vi.mock('@/telemetry', () => ({
  getTelemetryService: vi.fn(() => ({
    session: { recordEvent: vi.fn() },
  })),
}))

import { usePlayerStore } from '@/stores/playerStore'
import { PlaybackState, PlaybackQuality } from '@/player/playerTypes'

describe('usePlayerStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should have correct initial values', () => {
      const store = usePlayerStore()
      expect(store.playbackState).toBe(PlaybackState.IDLE)
      expect(store.isPlaying).toBe(false)
      expect(store.isLoading).toBe(false)
      expect(store.progress).toBe(0)
      expect(store.duration).toBe(0)
      expect(store.quality).toBe(PlaybackQuality.AUTO)
      expect(store.subtitleEnabled).toBe(false)
      expect(store.muted).toBe(false)
      expect(store.volume).toBe(1)
      expect(store.showResumeDialog).toBe(false)
    })
  })

  describe('computed', () => {
    it('isPlaying should reflect playing state', () => {
      const store = usePlayerStore()
      expect(store.isPlaying).toBe(false)
      store.$patch({ playbackState: PlaybackState.PLAYING })
      expect(store.isPlaying).toBe(true)
    })

    it('progressPercent should calculate correctly', () => {
      const store = usePlayerStore()
      store.$patch({ currentTime: 300, duration: 1200 })
      expect(store.progressPercent).toBe(25)
    })
  })

  describe('controls', () => {
    it('setVolume should clamp 0-1', () => {
      const store = usePlayerStore()
      store.setVolume(0.5)
      expect(store.volume).toBe(0.5)
      store.setVolume(2)
      expect(store.volume).toBe(1)
      store.setVolume(-1)
      expect(store.volume).toBe(0)
    })

    it('toggleMute should flip muted', () => {
      const store = usePlayerStore()
      expect(store.muted).toBe(false)
      store.toggleMute()
      expect(store.muted).toBe(true)
      store.toggleMute()
      expect(store.muted).toBe(false)
    })

    it('switchQuality should update quality', () => {
      const store = usePlayerStore()
      store.switchQuality(PlaybackQuality.P720)
      expect(store.quality).toBe(PlaybackQuality.P720)
    })
  })

  describe('destroy', () => {
    it('should reset to IDLE', () => {
      const store = usePlayerStore()
      store.destroy()
      expect(store.playbackState).toBe(PlaybackState.IDLE)
    })
  })
})
