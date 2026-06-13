// core/content-ecosystem/ContentEcosystemBridge.ts — CE10
// Central coordinator wiring metadata providers, media servers,
// local media, unified search, and recommendations into the application

import { metadataFacade } from './metadata/facade/MetadataFacade'
import { ecosystemProviderFacade } from './registry/EcosystemProviderFacade'
import type { IMetadataProvider, IMediaServer } from '@provider-contracts'

export class ContentEcosystemBridge {
  private initialized = false

  async initialize(config: {
    tmdbApiKey?: string
  } = {}): Promise<void> {
    if (this.initialized) return

    // 1. Initialize metadata providers
    await metadataFacade.initialize({ tmdbApiKey: config.tmdbApiKey })

    // 2. Register metadata providers in ecosystem registry
    for (const provider of metadataFacade.getProviders()) {
      ecosystemProviderFacade.registerMetadataProvider(provider)
    }

    // 3. Initialize ecosystem provider registry
    await ecosystemProviderFacade.initialize()

    this.initialized = true
    console.log('[ContentEcosystem] Initialized with', ecosystemProviderFacade.totalCount, 'providers')
  }

  // Accessors
  get metadata() { return metadataFacade }
  get providerRegistry() { return ecosystemProviderFacade }

  // Register a media server at runtime
  registerMediaServer(server: IMediaServer): void {
    ecosystemProviderFacade.registerMediaServer(server)
  }

  // Lifecycle
  async shutdown(): Promise<void> {
    this.initialized = false
  }
}

export const contentEcosystem = new ContentEcosystemBridge()
