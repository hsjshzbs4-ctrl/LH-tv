// src/core/playback/index.ts - P4.2 Intelligent Source Switching
// 智能源切换、自动重试、进度保持、24h 成功缓存

export { PlaybackFacade } from './facade/PlaybackFacade'
export { SourceSwitchManager } from './manager/SourceSwitchManager'
export type { SwitchConfig } from './manager/SourceSwitchManager'
export { SourceSwitchEvent } from './types/playback.types'
export type {
  PlaybackSource,
  PlaybackResult,
  SourceSwitchEventData,
  SuccessCacheEntry,
} from './types/playback.types'
