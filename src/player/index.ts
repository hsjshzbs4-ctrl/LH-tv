// src/player/index.ts — PB2-S1 Player barrel export

export { PlayerFacade } from './playerFacade'
export { VideoEngine } from './videoEngine'
export { PlaybackSessionTracker } from './playbackSession'
export { ResumeManager } from './resumeManager'
export { EpisodeManager } from './episodeManager'
export { QualityManager } from './qualityManager'
export { SubtitleManager } from './subtitleManager'
export { DRMManager } from './drmManager'

export {
  PlaybackState,
  PlaybackQuality,
  PlayerEvent,
  PlayerTelemetryEvent,
  DRMType,
  DEFAULT_PLAYER_CONFIG,
  QUALITY_RESOLUTIONS,
} from './playerTypes'

export type {
  PlaybackSource,
  PlaybackSession,
  SubtitleTrack,
  PlaybackSpeed,
  PlayerState,
  PlayerEngineConfig,
  IPlayerEngine,
} from './playerTypes'
