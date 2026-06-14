// modules/search-unified/infrastructure/services/SearchProviderRegistry.ts — CE8-C2
// Central registry for search provider adapters.
// Application layer discovers providers through this registry — never instantiate directly.

import type { ISearchProviderPort } from '../../application/ports/ISearchProviderPort'

export class SearchProviderRegistry {
  private providers: Map<string, ISearchProviderPort> = new Map()

  /** Register a provider. */
  register(provider: ISearchProviderPort): void {
    this.providers.set(provider.providerId, provider)
  }

  /** Unregister a provider by ID. */
  unregister(providerId: string): boolean {
    return this.providers.delete(providerId)
  }

  /** Get a specific provider. */
  getProvider(providerId: string): ISearchProviderPort | undefined {
    return this.providers.get(providerId)
  }

  /** Get all registered providers. */
  getAllProviders(): ISearchProviderPort[] {
    return Array.from(this.providers.values())
  }

  /** Get only available providers. */
  getAvailableProviders(): ISearchProviderPort[] {
    return this.getAllProviders().filter(p => p.isAvailable())
  }

  /** Get provider count. */
  get providerCount(): number {
    return this.providers.size
  }

  /** Clear all providers. */
  clear(): void {
    this.providers.clear()
  }
}
