// src/core/providers/index.ts - Provider Hub 统一导出

export { ProviderFacade, providerFacade } from './ProviderFacade'
export { ProviderRegistry } from './registry/ProviderRegistry'
export { BaseProvider } from './base/BaseProvider'
export { AppleCMSProvider } from './providers/AppleCMSProvider'
export { AnimeCrawlerProvider } from './providers/AnimeCrawlerProvider'
export type {
  MediaItem,
  MediaDetail,
  MediaEpisode,
  MediaType,
  AggregatedSearchResult,
} from './types/media.types'
export type {
  IProvider,
  ProviderMeta,
  ProviderHealth,
  ProviderOptions,
} from './types/provider.types'
