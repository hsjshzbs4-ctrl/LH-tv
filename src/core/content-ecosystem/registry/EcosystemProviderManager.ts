// core/content-ecosystem/registry/EcosystemProviderManager.ts — CE2
// Manager layer: coordinates registry lifecycle, health checks, and cross-type queries

import { EcosystemProviderRegistry, type EcosystemProviderType } from './EcosystemProviderRegistry'
import type { IMetadataProvider, IMediaServer } from '@provider-contracts'

export class EcosystemProviderManager {
  private registry = new EcosystemProviderRegistry()
  private loaded = false
  private subscribers = new Set<() => void>()

  async initialize(): Promise<void> {
    if (this.loaded) return
    this.loaded = true
  }

  // ─── Delegation to Registry ───

  registerMetadataProvider(provider: IMetadataProvider): void {
    this.registry.registerMetadataProvider(provider)
    this._notify()
  }

  registerMediaServer(server: IMediaServer): void {
    this.registry.registerMediaServer(server)
    this._notify()
  }

  unregister(id: string): boolean {
    const result = this.registry.unregister(id)
    if (result) this._notify()
    return result
  }

  getMetadataProviders(): IMetadataProvider[] {
    return this.registry.getMetadataProviders()
  }

  getMediaServers(): IMediaServer[] {
    return this.registry.getMediaServers()
  }

  getProvidersByType(type: EcosystemProviderType) {
    return this.registry.getProvidersByType(type)
  }

  get enabledCount(): number { return this.registry.enabledCount }
  get totalCount(): number { return this.registry.count }

  // ─── Health Check ───

  async checkHealth(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {}
    for (const entry of this.registry.getAll()) {
      try {
        results[entry.provider.id] = await entry.provider.healthCheck()
      } catch {
        results[entry.provider.id] = false
      }
    }
    return results
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
