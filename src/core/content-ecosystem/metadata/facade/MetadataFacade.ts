// core/content-ecosystem/metadata/facade/MetadataFacade.ts — CE4
// Facade for metadata providers: TMDB, Bangumi, TVMaze

import { TMDBProvider } from '../providers/TMDBProvider'
import { BangumiProvider } from '../providers/BangumiProvider'
import { TVMazeProvider } from '../providers/TVMazeProvider'
import { MetadataEnhancementEngine } from '../engine/MetadataEnhancementEngine'
import { MetadataToProviderAdapter } from '../adapters/MetadataToProviderAdapter'
import type { IMetadataProvider, IProvider, MediaItem, EnhancedMetadata, ParsedFilename, ExternalIds } from '@provider-contracts'

export class MetadataFacade {
  private tmdb?: TMDBProvider
  private bangumi?: BangumiProvider
  private tvmaze?: TVMazeProvider
  private enhancement = new MetadataEnhancementEngine()
  private initialized = false

  async initialize(config: { tmdbApiKey?: string } = {}): Promise<void> {
    if (this.initialized) return

    if (config.tmdbApiKey) {
      this.tmdb = new TMDBProvider(config.tmdbApiKey)
      this.enhancement.addSource(this.tmdb, 1.0)
    }
    this.bangumi = new BangumiProvider()
    this.tvmaze = new TVMazeProvider()
    this.enhancement.addSource(this.bangumi, 0.5)
    this.enhancement.addSource(this.tvmaze, 0.7)

    this.initialized = true
  }

  getTMDB(): TMDBProvider | undefined { return this.tmdb }
  getBangumi(): BangumiProvider | undefined { return this.bangumi }
  getTVMaze(): TVMazeProvider | undefined { return this.tvmaze }

  getProviders(): IMetadataProvider[] {
    const providers: IMetadataProvider[] = []
    if (this.tmdb) providers.push(this.tmdb)
    if (this.bangumi) providers.push(this.bangumi)
    if (this.tvmaze) providers.push(this.tvmaze)
    return providers
  }

  // Adapt metadata providers as IProvider for AggregationEngine
  asProviders(): IProvider[] {
    return this.getProviders().map(p => new MetadataToProviderAdapter(p))
  }

  // Enhancement
  async enhanceFromFilename(fileName: string, directory: 'Movies' | 'TV' | 'Anime'): Promise<EnhancedMetadata | null> {
    return this.enhancement.enhanceFromFilename(fileName, directory)
  }

  async enhanceFromExternalIds(ids: ExternalIds): Promise<EnhancedMetadata | null> {
    return this.enhancement.enhanceFromExternalIds(ids)
  }
}

export const metadataFacade = new MetadataFacade()
