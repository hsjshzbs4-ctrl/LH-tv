// modules/search-unified/infrastructure/services/ProviderPriorityManager.ts — CE8-C2
// Manages provider dispatch ordering.
// Default priority: Local > Jellyfin > Plex > Emby > TMDB > Bangumi > TVMaze.
// Future: dynamic priority based on latency, availability, user preference.

import type { ISearchProviderPort } from '../../application/ports/ISearchProviderPort'

/** Priority tiers for provider ordering. */
const PRIORITY_MAP: Record<string, number> = {
  local: 100,
  jellyfin: 90,
  plex: 80,
  emby: 70,
  tmdb: 60,
  bangumi: 50,
  tvmaze: 40,
}

export class ProviderPriorityManager {
  /**
   * Sort providers by priority (highest first).
   * Available providers come before unavailable ones within same priority.
   */
  orderByPriority(providers: ISearchProviderPort[]): ISearchProviderPort[] {
    return [...providers].sort((a, b) => {
      const pa = this._getPriority(a)
      const pb = this._getPriority(b)
      if (pa !== pb) return pb - pa

      // Available first within same priority
      if (a.isAvailable() && !b.isAvailable()) return -1
      if (!a.isAvailable() && b.isAvailable()) return 1
      return 0
    })
  }

  /**
   * Get providers in execution order.
   */
  getExecutionOrder(providers: ISearchProviderPort[]): ISearchProviderPort[] {
    return this.orderByPriority(providers.filter(p => p.isAvailable()))
  }

  /** Guess priority from provider ID. */
  private _getPriority(provider: ISearchProviderPort): number {
    const id = provider.providerId.toLowerCase()
    for (const [key, priority] of Object.entries(PRIORITY_MAP)) {
      if (id.includes(key)) return priority
    }
    return 0
  }
}
