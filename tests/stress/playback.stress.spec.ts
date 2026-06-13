// tests/stress/playback.stress.spec.ts — Playback Stress Tests
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { PlayerEngine } from '@/core/player/PlayerEngine'
import { SourceSwitchManager } from '@/core/playback/manager/SourceSwitchManager'
import type { PlaybackSource } from '@/core/playback/types/playback.types'

vi.mock('@/core/player/adapters/MP4Adapter', () => ({
  MP4Adapter: vi.fn().mockImplementation(function (this: Record<string, unknown>, _c: HTMLElement, cb: Record<string, Function>) {
    this._t = 0; this._paused = true
    this.load = vi.fn().mockImplementation(async () => { cb.onReady?.() })
    this.play = vi.fn().mockImplementation(async () => { this._paused = false; cb.onPlay?.() })
    this.pause = vi.fn().mockImplementation(() => { this._paused = true })
    this.seek = vi.fn().mockImplementation((t: number) => { this._t = t; cb.onTimeUpdate?.(t) })
    this.setVolume = vi.fn(); this.setPlaybackRate = vi.fn(); this.setMuted = vi.fn()
    this.getCurrentTime = vi.fn(() => this._t); this.getDuration = vi.fn(() => 3600)
    this.isPaused = vi.fn(() => this._paused); this.getVideoElement = vi.fn(() => null)
    this.destroy = vi.fn()
    return this
  }),
}))
vi.mock('@/core/player/adapters/HLSAdapter', () => ({
  HLSAdapter: vi.fn().mockImplementation(function (this: Record<string, unknown>, _c: HTMLElement, cb: Record<string, Function>) {
    this._t = 0; this._paused = true
    this.load = vi.fn().mockImplementation(async () => { cb.onReady?.() })
    this.play = vi.fn(); this.pause = vi.fn(); this.seek = vi.fn(); this.destroy = vi.fn()
    this.setVolume = vi.fn(); this.setPlaybackRate = vi.fn(); this.setMuted = vi.fn()
    this.getCurrentTime = vi.fn(() => this._t); this.getDuration = vi.fn(() => 3600)
    this.isPaused = vi.fn(() => this._paused); this.getVideoElement = vi.fn(() => null)
    return this
  }),
}))
const mockEl = { innerHTML: '', id: '', style: {} } as unknown as HTMLElement
vi.spyOn(document, 'getElementById').mockReturnValue(mockEl)
vi.spyOn(document, 'createElement').mockReturnValue(mockEl)

function src(id: string): PlaybackSource {
  return { providerId: id, providerName: `P${id}`, playUrl: `https://x.com/${id}.mp4`, type: 'mp4', headers: {} }
}

describe('Playback Stress', () => {
  afterEach(() => { vi.clearAllMocks() })

  it('Case 01: should handle 1000 play/pause cycles', async () => {
    const engine = new PlayerEngine({ autoplay: false, progressSaveInterval: 999 })
    await engine.load('https://test.com/video.mp4')
    for (let i = 0; i < 1000; i++) {
      if (i % 2 === 0) await engine.play()
      else engine.pause()
    }
    engine.destroy()
    expect(true).toBe(true) // no crash
  }, 15000)

  it('Case 02: should handle 1000 seek operations', async () => {
    const engine = new PlayerEngine({ autoplay: false, progressSaveInterval: 999 })
    await engine.load('https://test.com/video.mp4')
    for (let i = 0; i < 1000; i++) {
      engine.seek(i % 3600)
    }
    engine.destroy()
    expect(true).toBe(true)
  }, 15000)

  it('Case 03: should handle 500 media switches', async () => {
    const engine = new PlayerEngine({ autoplay: false })
    for (let i = 0; i < 500; i++) {
      await engine.load(`https://test.com/video${i % 10}.mp4`)
    }
    engine.destroy()
    expect(true).toBe(true)
  }, 30000)

  it('Case 04: should handle 200 source switches during playback', () => {
    const mgr = new SourceSwitchManager()
    const sources = Array.from({ length: 10 }, (_, i) => src(`p${i}`))

    for (let round = 0; round < 20; round++) {
      mgr.start(`media-${round}`, sources, 1)
      for (let fail = 0; fail < 3; fail++) {
        const next = mgr.onFailed('timeout')
        if (!next) break
      }
      mgr.onSuccess(`media-${round}`)
    }
    expect(true).toBe(true)
  })
})
