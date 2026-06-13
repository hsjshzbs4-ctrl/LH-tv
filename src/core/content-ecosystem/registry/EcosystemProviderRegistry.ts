// core/content-ecosystem/registry/EcosystemProviderRegistry.ts — CE2
// Dedicated registry for Content Ecosystem providers (metadata, media servers, local sources)
// Separate from the legacy ProviderRegistry — manages IMetadataProvider + IMediaServer

import type { IMetadataProvider } from '@provider-contracts'
import type { IMediaServer } from '@provider-contracts'

export type EcosystemProviderType = 'metadata' | 'media-server' | 'local'

export interface EcosystemProviderEntry {
  type: EcosystemProviderType
  provider: IMetadataProvider | IMediaServer
  registeredAt: number
  enabled: boolean
}

export class EcosystemProviderRegistry {
  private providers = new Map<string, EcosystemProviderEntry>()
  private subscribers = new Set<() => void>()

  // ─── Registration ───

  registerMetadataProvider(provider: IMetadataProvider): void {
    this.providers.set(provider.id, {
      type: 'metadata',
      provider,
      registeredAt: Date.now(),
      enabled: provider.enabled,
    })
    this._notify()
  }

  registerMediaServer(server: IMediaServer): void {
    this.providers.set(server.id, {
      type: 'media-server',
      provider: server,
      registeredAt: Date.now(),
      enabled: server.enabled,
    })
    this._notify()
  }

  unregister(id: string): boolean {
    const result = this.providers.delete(id)
    if (result) this._notify()
    return result
  }

  // ─── Queries ───

  get(id: string): EcosystemProviderEntry | undefined {
    return this.providers.get(id)
  }

  getProvidersByType(type: EcosystemProviderType): EcosystemProviderEntry[] {
    return Array.from(this.providers.values()).filter(p => p.type === type)
  }

  getMetadataProviders(): IMetadataProvider[] {
    return this.getProvidersByType('metadata')
      .filter(e => e.enabled)
      .map(e => e.provider as IMetadataProvider)
  }

  getMediaServers(): IMediaServer[] {
    return this.getProvidersByType('media-server')
      .filter(e => e.enabled)
      .map(e => e.provider as IMediaServer)
  }

  getEnabledProviders(): EcosystemProviderEntry[] {
    return Array.from(this.providers.values()).filter(p => p.enabled)
  }

  getAll(): EcosystemProviderEntry[] {
    return Array.from(this.providers.values())
  }

  get count(): number { return this.providers.size }
  get enabledCount(): number { return this.getEnabledProviders().length }

  // ─── Toggle ───

  enable(id: string): void {
    const entry = this.providers.get(id)
    if (entry) {
      entry.enabled = true
      entry.provider.enabled = true
      this._notify()
    }
  }

  disable(id: string): void {
    const entry = this.providers.get(id)
    if (entry) {
      entry.enabled = false
      entry.provider.enabled = false
      this._notify()
    }
  }

  // ─── Subscribers ───

  subscribe(callback: () => void): () => void {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }

  private _notify(): void {
    for (const cb of this.subscribers) cb()
  }
}
