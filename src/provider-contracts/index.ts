// src/provider-contracts/index.ts — Provider Contracts 统一导出
// P5.0: 全系统共享的 Provider 类型和接口定义
// P6.0 CE1: Content Ecosystem 合约扩展

// ─── Core Provider (P5.0) ───
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

// ─── Content Ecosystem — Metadata Provider (P6.0 CE1) ───
export type { IMetadataProvider } from './interfaces/IMetadataProvider'
export type {
  MovieDetail,
  SeriesDetail,
  SeasonDetail,
  EpisodeDetail,
} from './interfaces/IMetadataProvider'

// ─── Content Ecosystem — Media Server (P6.0 CE1) ───
export type { IMediaServer } from './interfaces/IMediaServer'
export type {
  ServerCredentials,
  LibraryQueryOptions,
  ServerPlaybackProgress,
} from './interfaces/IMediaServer'

// ─── Content Ecosystem — Domain Types (P6.0 CE1) ───
export type {
  ExternalIds,
  Person,
  ContentRating,
  Season,
  MediaServerConnection,
  MediaServerLibrary,
  LocalMediaItem,
  ScanResult,
  ParsedFilename,
  RecommendationInput,
  RecommendationResult,
  RecommendationItem,
  RateLimitConfig,
  MetadataCacheConfig,
  SearchIndexEntry,
  UnifiedSearchResult,
  UnifiedSearchSource,
  UnifiedSearchResponse,
  EnhancedMetadata,
} from './types/metadata.types'

export { WatchHistorySource } from './types/metadata.types'
