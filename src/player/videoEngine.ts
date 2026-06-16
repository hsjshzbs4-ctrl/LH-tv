// src/player/videoEngine.ts — PB2-S1 Video Engine
// 包装 PlayerEngine，提供简化接口 + 状态映射
// PATCH 1: 纯 Wrapper，不新建播放管道

import { PlayerEngine } from '@/core/player/PlayerEngine'
import { PlayerEvent } from '@/core/player/types/player.types'
import type { IPlayerEngine, PlayerState, PlayerEngineConfig } from '@/core/player/types/player.types'
import type { PlaybackSpeed } from '@/shared/types'
import { PlaybackState } from './playerTypes'

export class VideoEngine {
  private engine: PlayerEngine
  private _state: PlaybackState = PlaybackState.IDLE
  private stateListeners = new Set<(state: PlaybackState) => void>()

  constructor(config?: Partial<PlayerEngineConfig>) {
    this.engine = new PlayerEngine(config)
    this.bindEvents()
  }

  private bindEvents(): void {
    this.engine.on(PlayerEvent.READY, () => this.setState(PlaybackState.PAUSED))
    this.engine.on(PlayerEvent.PLAY, () => this.setState(PlaybackState.PLAYING))
    this.engine.on(PlayerEvent.PAUSE, () => this.setState(PlaybackState.PAUSED))
    this.engine.on(PlayerEvent.ENDED, () => this.setState(PlaybackState.ENDED))
    this.engine.on(PlayerEvent.ERROR, () => this.setState(PlaybackState.ERROR))
  }

  private setState(state: PlaybackState): void {
    this._state = state
    for (const fn of this.stateListeners) fn(state)
  }

  get state(): PlaybackState { return this._state }

  // ── 核心方法（委托 PlayerEngine）──

  async loadSource(url: string): Promise<void> {
    this.setState(PlaybackState.LOADING)
    await this.engine.load(url)
  }

  async play(): Promise<void> { return this.engine.play() }
  pause(): void { this.engine.pause() }
  seek(time: number): void { this.engine.seek(time) }
  destroy(): void { this.engine.destroy(); this.setState(PlaybackState.IDLE) }

  setVolume(vol: number): void { this.engine.setVolume(vol) }
  setPlaybackRate(rate: PlaybackSpeed): void { this.engine.setPlaybackRate(rate) }
  setMuted(muted: boolean): void { this.engine.setMuted(muted) }

  get currentTime(): number { return this.engine.getState().currentTime }
  get duration(): number { return this.engine.getState().duration }
  get isPaused(): boolean { return this.engine.getState().paused }

  getVideoElement(): HTMLVideoElement | null { return this.engine.getVideoElement() }
  getState(): PlayerState { return this.engine.getState() }

  attachElement(el: HTMLElement): void { this.engine.setContainer(el) }

  /** S3A-1: 设置已有 video 元素 — engine 将复用而非创建新的 */
  setVideoElement(video: HTMLVideoElement): void { this.engine.setVideoElement(video) }

  // ── 事件（代理）──

  on(event: PlayerEvent, cb: (data?: unknown) => void): () => void {
    return this.engine.on(event, cb)
  }

  onStateChange(cb: (state: PlaybackState) => void): () => void {
    this.stateListeners.add(cb)
    return () => { this.stateListeners.delete(cb) }
  }

  get onProgressSave(): ((t: number) => void) | undefined {
    return this.engine.onProgressSave
  }
  set onProgressSave(fn: ((t: number) => void) | undefined) {
    this.engine.onProgressSave = fn
  }

  /** S3A-4: HLS 实例就绪回调 */
  get onHLSReady(): ((hls: unknown) => void) | undefined {
    return this.engine.onHLSReady
  }
  set onHLSReady(fn: ((hls: unknown) => void) | undefined) {
    this.engine.onHLSReady = fn
  }
}
