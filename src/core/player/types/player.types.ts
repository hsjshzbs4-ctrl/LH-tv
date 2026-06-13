// src/core/player/types/player.types.ts - 播放器引擎类型

import type { PlaybackSpeed, PlayerSource } from '@/shared/types'

/** 播放器事件枚举 */
export enum PlayerEvent {
  READY = 'player:ready',
  PLAY = 'player:play',
  PAUSE = 'player:pause',
  BUFFERING = 'player:buffering',
  TIME_UPDATE = 'player:timeupdate',
  ENDED = 'player:ended',
  ERROR = 'player:error',
  DESTROY = 'player:destroy',
}

/** 播放器状态快照 */
export interface PlayerState {
  url: string
  currentTime: number
  duration: number
  volume: number
  playbackRate: PlaybackSpeed
  paused: boolean
  muted: boolean
  buffering: boolean
  ended: boolean
  ready: boolean
}

/** 播放器引擎配置 */
export interface PlayerEngineConfig {
  /** 播放速度列表 */
  speeds: PlaybackSpeed[]
  /** 默认速度 */
  defaultSpeed: PlaybackSpeed
  /** 进度保存间隔（秒） */
  progressSaveInterval: number
  /** 最小恢复位置（秒） */
  resumeMinPosition: number
  /** 自动播放 */
  autoplay: boolean
  /** 自定义请求头 */
  headers?: Record<string, string>
}

/** 默认配置 */
export const DEFAULT_PLAYER_CONFIG: PlayerEngineConfig = {
  speeds: [0.5, 1, 1.25, 1.5, 2],
  defaultSpeed: 1,
  progressSaveInterval: 15,
  resumeMinPosition: 30,
  autoplay: true,
}

/** 播放器引擎接口 */
export interface IPlayerEngine {
  /** 加载并播放视频 */
  load(url: string): Promise<void>

  /** 播放 */
  play(): Promise<void>

  /** 暂停 */
  pause(): void

  /** 跳转 */
  seek(time: number): void

  /** 销毁 */
  destroy(): void

  /** 设置音量 */
  setVolume(vol: number): void

  /** 设置倍速 */
  setPlaybackRate(rate: PlaybackSpeed): void

  /** 设置静音 */
  setMuted(muted: boolean): void

  /** 获取当前状态 */
  getState(): PlayerState

  /** 获取底层 video 元素 */
  getVideoElement(): HTMLVideoElement | null

  /** 注册事件监听 */
  on(event: PlayerEvent, callback: (data?: unknown) => void): () => void

  /** 进度保存回调 */
  onProgressSave?: (currentTime: number) => void
}
