// core/content-ecosystem/ContentEcosystemBridge.ts — CE10
// Central coordinator wiring metadata providers, media servers,
// local media, unified search (CE7), and recommendations into the application

import { metadataFacade } from './metadata/facade/MetadataFacade'
import { localMediaFacade } from './local-media/LocalMediaFacade'
import { mediaServerFacade } from './media-servers/manager/MediaServerFacade'
import { ecosystemProviderFacade } from './registry/EcosystemProviderFacade'
import { searchFacade } from './search/facade/SearchFacade'
import { MetadataSearchDataSource } from './search/datasources/MetadataSearchDataSource'
import { LocalLibrarySearchDataSource } from './search/datasources/LocalLibrarySearchDataSource'
import { MediaServerSearchDataSource } from './search/datasources/MediaServerSearchDataSource'
import { ElectronSearchStorage } from './search/storage/ElectronSearchStorage'
import type { IMediaServer } from '@provider-contracts'

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

    // 4. CE7: Configure search facade with all data sources
    const searchDataSources = [
      // Metadata sources (one per provider)
      ...metadataFacade.getProviders().map(p => new MetadataSearchDataSource(p)),
      // Local library source
      new LocalLibrarySearchDataSource(localMediaFacade),
      // Media servers (initially empty; added via registerMediaServer)
    ]
    searchFacade.configure(searchDataSources, new ElectronSearchStorage())

    // 5. Build search index (non-fatal)
    try {
      await searchFacade.buildIndex()
      const stats = searchFacade.getStats()
      console.log('[ContentEcosystem] Search index built:', stats.totalDocuments, 'docs,', stats.buildTimeMs, 'ms')
    } catch (err) {
      console.warn('[ContentEcosystem] Search index build failed (non-fatal):', err)
    }

    this.initialized = true
    console.log('[ContentEcosystem] Initialized with', ecosystemProviderFacade.totalCount, 'providers')
  }

  // ─── Accessors ───

  get metadata() { return metadataFacade }
  get providerRegistry() { return ecosystemProviderFacade }
  get search() { return searchFacade }

  // ─── Media Server Registration ───

  registerMediaServer(server: IMediaServer): void {
    ecosystemProviderFacade.registerMediaServer(server)

    // Also rebuild search index to include new server's content
    searchFacade.rebuildIndex().catch(err => {
      console.warn('[ContentEcosystem] Search index rebuild after server registration failed:', err)
    })
  }

  // ─── Lifecycle ───

  async shutdown(): Promise<void> {
    this.initialized = false
  }
}

export const contentEcosystem = new ContentEcosystemBridge()
