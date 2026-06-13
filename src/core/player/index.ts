// src/core/player/index.ts - 播放器模块统一导出

export { PlayerEngine } from './PlayerEngine'
export { BaseAdapter } from './adapters/BaseAdapter'
export { HLSAdapter } from './adapters/HLSAdapter'
export { MP4Adapter } from './adapters/MP4Adapter'
export { PlayerEvent, DEFAULT_PLAYER_CONFIG } from './types/player.types'
export type {
  IPlayerEngine,
  PlayerState,
  PlayerEngineConfig,
} from './types/player.types'
export type {
  IPlayerAdapter,
  AdapterType,
  AdapterOptions,
  AdapterEventCallbacks,
} from './types/adapter.types'
