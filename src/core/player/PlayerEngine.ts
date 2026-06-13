// src/core/player/PlayerEngine.ts - 播放器引擎
// 统一入口：自动检测源类型 → 选择适配器 → 管理播放生命周期
//
// 架构:
//   Vue 组件 ←→ PlayerEngine ←→ Adapter (HLS / MP4) ←→ video / hls.js
//
// 禁止组件直接操作 video 元素或 new Hls()

import type { PlaybackSpeed } from '@/shared/types'
import type { IPlayerAdapter } from './types/adapter.types'
import type { IPlayerEngine, PlayerState, PlayerEngineConfig } from './types/player.types'
import { PlayerEvent, DEFAULT_PLAYER_CONFIG } from './types/player.types'
import { MP4Adapter } from './adapters/MP4Adapter'
import { HLSAdapter } from './adapters/HLSAdapter'
import type { AdapterEventCallbacks } from './types/adapter.types'

type EventCallback = (data?: unknown) => void

export class PlayerEngine implements IPlayerEngine {
  private adapter: IPlayerAdapter | null = null
  private config: PlayerEngineConfig
  private listeners = new Map<PlayerEvent, Set<EventCallback>>()
  private progressTimer: ReturnType<typeof setInterval> | null = null
  private _muted = false

  // 公开回调
  onProgressSave?: (currentTime: number) => void

  constructor(config?: Partial<PlayerEngineConfig>) {
    this.config = { ...DEFAULT_PLAYER_CONFIG, ...config }
  }

  // ==================== 公开方法 ====================

  async load(url: string): Promise<void> {
    // 销毁旧播放器
    this.destroy()

    const type = this.detectType(url)
    const container = this.getOrCreateContainer()
    const headers = this.config.headers

    // 构建事件回调
    const callbacks: AdapterEventCallbacks = {
      onReady: () => this.emit(PlayerEvent.READY),
      onPlay: () => this.emit(PlayerEvent.PLAY),
      onPause: () => this.emit(PlayerEvent.PAUSE),
      onTimeUpdate: (t: number) => this.onTick(t),
      onEnded: () => { this.stopProgressTimer(); this.emit(PlayerEvent.ENDED) },
      onError: (msg: string) => this.emit(PlayerEvent.ERROR, { message: msg }),
      onBuffering: (b: boolean) => this.emit(PlayerEvent.BUFFERING, { buffering: b }),
    }

    // 选择适配器
    if (type === 'hls') {
      this.adapter = new HLSAdapter(container, callbacks, headers)
    } else {
      this.adapter = new MP4Adapter(container, callbacks)
    }

    await this.adapter.load(url)

    // 自动播放
    if (this.config.autoplay) {
      try { await this.adapter.play() } catch { /* autoplay blocked */ }
    }

    // 启动进度定时器
    this.startProgressTimer()
  }

  async play(): Promise<void> {
    if (!this.adapter) return
    await this.adapter.play()
  }

  pause(): void {
    this.adapter?.pause()
  }

  seek(time: number): void {
    this.adapter?.seek(time)
  }

  destroy(): void {
    this.stopProgressTimer()
    if (this.adapter) {
      this.adapter.destroy()
      this.adapter = null
    }
    this.emit(PlayerEvent.DESTROY)
  }

  setVolume(vol: number): void {
    this.adapter?.setVolume(vol)
  }

  setPlaybackRate(rate: PlaybackSpeed): void {
    this.adapter?.setPlaybackRate(rate)
  }

  setMuted(muted: boolean): void {
    this._muted = muted
    this.adapter?.setMuted(muted)
  }

  getState(): PlayerState {
    if (!this.adapter) {
      return {
        url: '', currentTime: 0, duration: 0, volume: 1,
        playbackRate: this.config.defaultSpeed, paused: true,
        muted: this._muted, buffering: false, ended: false, ready: false,
      }
    }
    return {
      url: '',
      currentTime: this.adapter.getCurrentTime(),
      duration: this.adapter.getDuration(),
      volume: 1,
      playbackRate: this.config.defaultSpeed,
      paused: this.adapter.isPaused(),
      muted: this._muted,
      buffering: false,
      ended: false,
      ready: true,
    }
  }

  getVideoElement(): HTMLVideoElement | null {
    return this.adapter?.getVideoElement() || null
  }

  /** 注册事件监听，返回取消函数 */
  on(event: PlayerEvent, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
    return () => {
      this.listeners.get(event)?.delete(callback)
    }
  }

  // ==================== 私有方法 ====================

  private detectType(url: string): 'mp4' | 'hls' {
    const lower = url.toLowerCase()
    if (lower.endsWith('.m3u8') || lower.includes('.m3u8')) return 'hls'
    return 'mp4'
  }

  private getOrCreateContainer(): HTMLElement {
    // 使用已存在的容器或创建临时容器（由外部设置）
    let container = document.getElementById('player-engine-container')
    if (!container) {
      container = document.createElement('div')
      container.id = 'player-engine-container'
      container.style.cssText = 'width:100%;height:100%;background:#000;'
    }
    container.innerHTML = ''
    return container
  }

  /** 设置容器元素（由 Vue 组件在挂载时调用） */
  setContainer(el: HTMLElement): void {
    el.innerHTML = ''
    el.id = 'player-engine-container'
  }

  private onTick(currentTime: number): void {
    this.emit(PlayerEvent.TIME_UPDATE, { currentTime })
  }

  // ==================== 进度保存 ====================

  private startProgressTimer(): void {
    this.stopProgressTimer()
    this.progressTimer = setInterval(() => {
      if (this.adapter && !this.adapter.isPaused()) {
        const t = this.adapter.getCurrentTime()
        if (t > 0) {
          this.onProgressSave?.(Math.floor(t))
        }
      }
    }, this.config.progressSaveInterval * 1000)
  }

  private stopProgressTimer(): void {
    if (this.progressTimer) {
      clearInterval(this.progressTimer)
      this.progressTimer = null
    }
  }

  /** 保存当前进度（暂停/切集/关闭时由外部调用） */
  saveProgress(): void {
    if (this.adapter) {
      const t = Math.floor(this.adapter.getCurrentTime())
      if (t > 0) {
        this.onProgressSave?.(t)
      }
    }
  }

  // ==================== 事件 ====================

  private emit(event: PlayerEvent, data?: unknown): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      for (const cb of callbacks) {
        try { cb(data) } catch { /* 防止回调异常影响播放器 */ }
      }
    }
  }
}
