// src/provider-contracts/index.ts — Provider Contracts 统一导出
// P5.0: 全系统共享的 Provider 类型和接口定义

export type { IProvider } from './interfaces/IProvider'

export type {
  MediaItem,
  MediaDetail,
  MediaEpisode,
  MediaType,
  AggregatedSearchResult,
} from './types/media.types'

export type {
  ProviderManifest,
  ProviderModule,
} from './types/manifest.types'
