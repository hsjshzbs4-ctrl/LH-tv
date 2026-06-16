// src/core/player/adapters/BaseAdapter.ts - 适配器基类
// 封装 HTMLVideoElement 通用逻辑，子类只需实现 source 加载方式

import type { IPlayerAdapter, AdapterEventCallbacks } from '../types/adapter.types'

/** S3B-5: 存储事件 handler 引用以便移除 */
interface VideoEventBinding {
  event: string
  handler: EventListener
}

export abstract class BaseAdapter implements IPlayerAdapter {
  protected video: HTMLVideoElement | null = null
  protected container: HTMLElement
  protected callbacks: AdapterEventCallbacks
  protected _paused = true
  /** S3B-5: 记录所有已绑定的 handler 以便 destroy 时移除 */
  private _bindings: VideoEventBinding[] = []

  constructor(container: HTMLElement, callbacks: AdapterEventCallbacks = {}) {
    this.container = container
    this.callbacks = callbacks
  }

  /** S3A-1: 使用已有 video 元素（不创建新的） */
  useExistingVideo(video: HTMLVideoElement): void {
    // 清理旧 video 及其事件监听
    this._unbindAll()
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

  /** S3B-5: 绑定 video 元素事件（createVideoElement 和 useExistingVideo 共用）
   *  使用命名 handler 存储引用，保证 destroy/rebind 时可以精确移除 */
  private bindVideoEvents(video: HTMLVideoElement): void {
    // loadedmetadata
    const onMeta = () => { this.callbacks.onReady?.() }
    video.addEventListener('loadedmetadata', onMeta)
    this._bindings.push({ event: 'loadedmetadata', handler: onMeta })

    // play
    const onPlay = () => { this._paused = false; this.callbacks.onPlay?.() }
    video.addEventListener('play', onPlay)
    this._bindings.push({ event: 'play', handler: onPlay })

    // pause
    const onPause = () => { this._paused = true; this.callbacks.onPause?.() }
    video.addEventListener('pause', onPause)
    this._bindings.push({ event: 'pause', handler: onPause })

    // timeupdate
    const onTime = () => { this.callbacks.onTimeUpdate?.(video.currentTime) }
    video.addEventListener('timeupdate', onTime)
    this._bindings.push({ event: 'timeupdate', handler: onTime })

    // ended
    const onEnded = () => { this.callbacks.onEnded?.() }
    video.addEventListener('ended', onEnded)
    this._bindings.push({ event: 'ended', handler: onEnded })

    // error
    const onError = () => {
      const msg = video.error?.message || '视频加载失败'
      this.callbacks.onError?.(msg)
    }
    video.addEventListener('error', onError)
    this._bindings.push({ event: 'error', handler: onError })

    // waiting
    const onWaiting = () => { this.callbacks.onBuffering?.(true) }
    video.addEventListener('waiting', onWaiting)
    this._bindings.push({ event: 'waiting', handler: onWaiting })

    // canplay
    const onCanPlay = () => { this.callbacks.onBuffering?.(false) }
    video.addEventListener('canplay', onCanPlay)
    this._bindings.push({ event: 'canplay', handler: onCanPlay })
  }

  /** S3B-5: 移除所有已绑定的 video 事件监听器 */
  private _unbindAll(): void {
    if (!this.video) return
    for (const { event, handler } of this._bindings) {
      this.video.removeEventListener(event, handler)
    }
    this._bindings = []
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

  /** S3B-5: 彻底清理 — 移除所有事件监听器 + 销毁 video */
  destroy(): void {
    this._unbindAll()
    if (this.video) {
      this.video.pause()
      this.video.src = ''
      this.video.remove()
      this.video = null
    }
    this.container.innerHTML = ''
    this.callbacks = {}
  }
}
