// src/core/player/types/adapter.types.ts - 播放器适配器接口

/** 播放源类型 */
export type AdapterType = 'mp4' | 'hls'

/** 适配器构造选项 */
export interface AdapterOptions {
  /** 视频容器元素 */
  container: HTMLElement
  /** 视频源 URL */
  url: string
  /** 类型（自动检测时不传） */
  type?: AdapterType
  /** 自定义请求头（如 Referer） */
  headers?: Record<string, string>
}

/** 播放器适配器接口 */
export interface IPlayerAdapter {
  /** 加载视频源 */
  load(url: string): Promise<void>

  /** 播放 */
  play(): Promise<void>

  /** 暂停 */
  pause(): void

  /** 跳转到指定时间 */
  seek(time: number): void

  /** 设置音量 0~1 */
  setVolume(vol: number): void

  /** 设置播放倍速 */
  setPlaybackRate(rate: number): void

  /** 设置静音 */
  setMuted(muted: boolean): void

  /** 获取 video 元素 */
  getVideoElement(): HTMLVideoElement | null

  /** 获取当前时间 */
  getCurrentTime(): number

  /** 获取总时长 */
  getDuration(): number

  /** 是否暂停中 */
  isPaused(): boolean

  /** 销毁，释放资源 */
  destroy(): void
}

/** 适配器事件回调 */
export interface AdapterEventCallbacks {
  onReady?: () => void
  onPlay?: () => void
  onPause?: () => void
  onTimeUpdate?: (currentTime: number) => void
  onEnded?: () => void
  onError?: (message: string) => void
  onBuffering?: (buffering: boolean) => void
  /** S3A-4: HLS 实例就绪 — 用于 QualityManager.bindHLS() */
  onHLSReady?: (hls: unknown) => void
}
