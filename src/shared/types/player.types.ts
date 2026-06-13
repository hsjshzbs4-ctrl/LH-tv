// src/shared/types/player.types.ts - 播放器相关类型

/** 播放速度 */
export type PlaybackSpeed = 0.5 | 1 | 1.25 | 1.5 | 2

/** 播放器状态 */
export enum PlayerStatus {
  Idle = 'idle',
  Loading = 'loading',
  Playing = 'playing',
  Paused = 'paused',
  Error = 'error',
  Destroyed = 'destroyed',
}

/** 播放器源类型 */
export type PlayerSourceType = 'mp4' | 'm3u8' | 'ts' | 'unknown'

/** 播放器源 */
export interface PlayerSource {
  url: string
  type: PlayerSourceType
  label?: string
}

/** 播放器配置 */
export interface PlayerConfig {
  speeds: PlaybackSpeed[]
  defaultSpeed: PlaybackSpeed
  resumeSaveInterval: number
  resumeMinPosition: number
}

/** 播放器状态快照 */
export interface PlayerStateSnapshot {
  status: PlayerStatus
  currentTime: number
  duration: number
  playbackRate: PlaybackSpeed
  volume: number
  source: PlayerSource | null
}
