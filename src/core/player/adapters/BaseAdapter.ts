// src/core/player/adapters/BaseAdapter.ts - 适配器基类
// 封装 HTMLVideoElement 通用逻辑，子类只需实现 source 加载方式

import type { IPlayerAdapter, AdapterEventCallbacks } from '../types/adapter.types'

export abstract class BaseAdapter implements IPlayerAdapter {
  protected video: HTMLVideoElement | null = null
  protected container: HTMLElement
  protected callbacks: AdapterEventCallbacks
  protected _paused = true

  constructor(container: HTMLElement, callbacks: AdapterEventCallbacks = {}) {
    this.container = container
    this.callbacks = callbacks
  }

  /** S3A-1: 使用已有 video 元素（不创建新的） */
  useExistingVideo(video: HTMLVideoElement): void {
    // 清理旧 video
    if (this.video) {
      this.video.pause()
      this.video.src = ''
      this.video.remove()
    }
    this.video = video
    this.container.innerHTML = ''
    this.container.appendChild(video)
    this.bindVideoEvents(video)
  }

  /** S3A-1: 绑定 video 元素事件（createVideoElement 和 useExistingVideo 共用） */
  private bindVideoEvents(video: HTMLVideoElement): void {
    video.addEventListener('loadedmetadata', () => {
      this.callbacks.onReady?.()
    })
    video.addEventListener('play', () => {
      this._paused = false
      this.callbacks.onPlay?.()
    })
    video.addEventListener('pause', () => {
      this._paused = true
      this.callbacks.onPause?.()
    })
    video.addEventListener('timeupdate', () => {
      this.callbacks.onTimeUpdate?.(video.currentTime)
    })
    video.addEventListener('ended', () => {
      this.callbacks.onEnded?.()
    })
    video.addEventListener('error', () => {
      const msg = video.error?.message || '视频加载失败'
      this.callbacks.onError?.(msg)
    })
    video.addEventListener('waiting', () => {
      this.callbacks.onBuffering?.(true)
    })
    video.addEventListener('canplay', () => {
      this.callbacks.onBuffering?.(false)
    })
  }

  /** 创建 video 元素并挂载到容器 */
  protected createVideoElement(): HTMLVideoElement {
    this.container.innerHTML = ''
    const video = document.createElement('video')
    video.controls = false
    video.style.width = '100%'
    video.style.height = '100%'
    video.style.objectFit = 'contain'
    video.setAttribute('playsinline', '')
    this.container.appendChild(video)
    this.bindVideoEvents(video)
    this.video = video
    return video
  }

  /** 子类实现：将源加载到 video */
  abstract load(url: string): Promise<void>

  async play(): Promise<void> {
    if (!this.video) throw new Error('video not initialized')
    return this.video.play()
  }

  pause(): void {
    this.video?.pause()
  }

  seek(time: number): void {
    if (this.video) {
      this.video.currentTime = Math.max(0, Math.min(time, this.video.duration || 0))
    }
  }

  setVolume(vol: number): void {
    if (this.video) {
      this.video.volume = Math.max(0, Math.min(1, vol))
    }
  }

  setPlaybackRate(rate: number): void {
    if (this.video) {
      this.video.playbackRate = rate
    }
  }

  setMuted(muted: boolean): void {
    if (this.video) {
      this.video.muted = muted
    }
  }

  getVideoElement(): HTMLVideoElement | null {
    return this.video
  }

  getCurrentTime(): number {
    return this.video?.currentTime || 0
  }

  getDuration(): number {
    return this.video?.duration || 0
  }

  isPaused(): boolean {
    return this._paused
  }

  destroy(): void {
    if (this.video) {
      this.video.pause()
      this.video.src = ''
      this.video.remove()
      this.video = null
    }
    this.container.innerHTML = ''
  }
}
