// core/content-ecosystem/search/facade/SearchFacade.ts — CE7.9 Public entry point
// View-layer singleton. Thin delegation to SearchIndexManager.
// UI code calls searchFacade directly; IPC handlers delegate here.

import { SearchIndexManager } from '../index/SearchIndexManager'
import { MemorySearchStorage } from '../storage/MemorySearchStorage'
import type { ISearchStorage } from '../contracts/ISearchStorage'
import type { ISearchDataSource } from '../contracts/ISearchDataSource'
import type {
  SearchResponse,
  SearchOptions,
  IndexStats,
  AggregatedSearchResponse,
} from '../contracts/search.types'

export class SearchFacade {
  private manager: SearchIndexManager | null = null
  private _dataSources: ISearchDataSource[] = []
  private _storage: ISearchStorage = new MemorySearchStorage()
  private _configured = false

  /**
   * Configure dependencies before use.
   * Must be called once before any search operations.
   */
  configure(dataSources: ISearchDataSource[], storage?: ISearchStorage): void {
    this._dataSources = dataSources
    if (storage) this._storage = storage
    this._configured = true
  }

  private _ensureManager(): SearchIndexManager {
    if (!this._configured) {
      throw new Error('[SearchFacade] Not configured. Call configure() before using search.')
    }
    if (!this.manager) {
      this.manager = new SearchIndexManager(this._dataSources, this._storage)
    }
    return this.manager
  }

  // ─── Lifecycle ───

  async initialize(): Promise<void> {
    await this._ensureManager().initialize()
  }

  async buildIndex(): Promise<IndexStats> {
    return this._ensureManager().buildIndex()
  }

  async rebuildIndex(): Promise<IndexStats> {
    return this._ensureManager().rebuildIndex()
  }

  async clearIndex(): Promise<void> {
    return this._ensureManager().clearIndex()
  }

  // ─── Search ───

  search(query: string, options?: SearchOptions): SearchResponse {
    return this._ensureManager().search(query, options)
  }

  aggregatedSearch(query: string, options?: SearchOptions): AggregatedSearchResponse {
    return this._ensureManager().aggregatedSearch(query, options)
  }

  // ─── Stats ───

  getStats(): IndexStats {
    return this._ensureManager().getStats()
  }

  // ─── Subscriber ───

  subscribe(cb: () => void): () => void {
    return this._ensureManager().subscribe(cb)
  }
}

/** Singleton */
export const searchFacade = new SearchFacade()
