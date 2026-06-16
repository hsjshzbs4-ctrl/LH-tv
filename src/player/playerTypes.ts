// src/player/playerTypes.ts — PB2-S1 Player 类型定义
// 补充新类型，重导出 core 规范类型

// ── 重导出 core 类型 ──
export {
  PlayerEvent,
  DEFAULT_PLAYER_CONFIG,
} from '@/core/player/types/player.types'

export type {
  PlayerState,
  PlayerEngineConfig,
  IPlayerEngine,
} from '@/core/player/types/player.types'

export type { PlaybackSpeed } from '@/shared/types'

// ── PB2-S1 新类型 ──

/** 播放状态机 */
export enum PlaybackState {
  IDLE = 'idle',
  LOADING = 'loading',
  PLAYING = 'playing',
  PAUSED = 'paused',
  ENDED = 'ended',
  ERROR = 'error',
}

/** 播放源描述 */
export interface PlaybackSource {
  providerId: string
  mediaId: string
  episodeId: string
  url: string
}

/** 播放画质 */
export enum PlaybackQuality {
  AUTO = 'Auto',
  P360 = '360p',
  P480 = '480p',
  P720 = '720p',
  P1080 = '1080p',
}

/** 字幕轨道 */
export interface SubtitleTrack {
  id: string
  label: string
  language: string
  url: string
  format: 'vtt' | 'srt'
  enabled: boolean
}

/** 播放会话 */
export interface PlaybackSession {
  sessionId: string
  mediaId: string
  episodeId: string
  providerId: string
  startTime: number
  progress: number
  duration: number
  watchTime: number
  lastPosition: number
}

/** DRM 类型 */
export enum DRMType {
  NONE = 'none',
  WIDEVINE = 'widevine',
  FAIRPLAY = 'fairplay',
  PLAYREADY = 'playready',
}

/** Player 遥测事件 */
export enum PlayerTelemetryEvent {
  PLAYER_OPEN = 'player:open',
  PLAYER_PLAY = 'player:play',
  PLAYER_PAUSE = 'player:pause',
  PLAYER_SEEK = 'player:seek',
  PLAYER_COMPLETE = 'player:complete',
  PLAYER_EPISODE_SWITCH = 'player:episode_switch',
  PLAYER_SOURCE_SWITCH = 'player:source_switch',       // S3B-4
  PLAYER_QUALITY_SWITCH = 'player:quality_switch',
}

/** 画质映射表 */
export const QUALITY_RESOLUTIONS: Record<PlaybackQuality, number> = {
  [PlaybackQuality.AUTO]: -1,
  [PlaybackQuality.P360]: 360,
  [PlaybackQuality.P480]: 480,
  [PlaybackQuality.P720]: 720,
  [PlaybackQuality.P1080]: 1080,
}
