// core/content-ecosystem/registry/EcosystemProviderFacade.ts — CE2
// View-layer singleton facade for the Content Ecosystem Provider Registry

import { EcosystemProviderManager } from './EcosystemProviderManager'
import type { IMetadataProvider, IMediaServer } from '@provider-contracts'
import type { EcosystemProviderType } from './EcosystemProviderRegistry'

export class EcosystemProviderFacade {
  private manager = new EcosystemProviderManager()

  async initialize(): Promise<void> {
    return this.manager.initialize()
  }

  registerMetadataProvider(provider: IMetadataProvider): void {
    this.manager.registerMetadataProvider(provider)
  }

  registerMediaServer(server: IMediaServer): void {
    this.manager.registerMediaServer(server)
  }

  unregister(id: string): boolean {
    return this.manager.unregister(id)
  }

  getMetadataProviders(): IMetadataProvider[] {
    return this.manager.getMetadataProviders()
  }

  getMediaServers(): IMediaServer[] {
    return this.manager.getMediaServers()
  }

  getProvidersByType(type: EcosystemProviderType) {
    return this.manager.getProvidersByType(type)
  }

  async checkHealth(): Promise<Record<string, boolean>> {
    return this.manager.checkHealth()
  }

  get enabledCount(): number { return this.manager.enabledCount }
  get totalCount(): number { return this.manager.totalCount }

  subscribe(callback: () => void): () => void {
    return this.manager.subscribe(callback)
  }
}

export const ecosystemProviderFacade = new EcosystemProviderFacade()
