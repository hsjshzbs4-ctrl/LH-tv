// core/content-ecosystem/index.ts — Content Ecosystem 1.0 unified barrel export

// Bridge
export { ContentEcosystemBridge, contentEcosystem } from './ContentEcosystemBridge'

// Registry
export {
  EcosystemProviderRegistry,
  EcosystemProviderManager,
  EcosystemProviderFacade,
  ecosystemProviderFacade,
} from './registry'
export type { EcosystemProviderType, EcosystemProviderEntry } from './registry'

// Metadata
export { MetadataFacade, metadataFacade } from './metadata/facade/MetadataFacade'
export { TMDBProvider } from './metadata/providers/TMDBProvider'
export { BangumiProvider } from './metadata/providers/BangumiProvider'
export { TVMazeProvider } from './metadata/providers/TVMazeProvider'
export { BaseMetadataProvider } from './metadata/base/BaseMetadataProvider'
export { MetadataToProviderAdapter } from './metadata/adapters/MetadataToProviderAdapter'
export { MetadataEnhancementEngine } from './metadata/engine/MetadataEnhancementEngine'

// Utilities
export { RateLimiter, RATE_LIMITS } from './utils/RateLimiter'
export { MetadataCache, metadataCache, METADATA_TTL } from './utils/MetadataCache'
export { FilenameParser, filenameParser } from './utils/FilenameParser'
