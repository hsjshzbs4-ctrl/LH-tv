// core/content-ecosystem/search/index/SearchIndexManager.ts — CE7.8 Core coordinator
// Orchestrates index building, searching, and stats.
// Depends on abstractions only (ISearchDataSource + ISearchStorage), never concrete Facades.

import { SearchIndexRepository } from './SearchIndexRepository'
import { SearchIndexBuilder } from './SearchIndexBuilder'
import { SearchEngine } from '../engine/SearchEngine'
import type { ISearchStorage } from '../contracts/ISearchStorage'
import type { ISearchDataSource } from '../contracts/ISearchDataSource'
import type {
  SearchResult,
  SearchResponse,
  SearchOptions,
  IndexStats,
  AggregatedSearchResult,
  AggregatedSearchResponse,
} from '../contracts/search.types'

export class SearchIndexManager {
  private repo: SearchIndexRepository
  private builder: SearchIndexBuilder
  private engine: SearchEngine
  private subscribers: Set<() => void> = new Set()
  private _initialized = false

  constructor(
    dataSources: ISearchDataSource[],
    storage: ISearchStorage,
  ) {
    this.repo = new SearchIndexRepository(storage)
    this.builder = new SearchIndexBuilder(dataSources)
    this.engine = new SearchEngine(this.repo)
  }

  // ─── Lifecycle ───

  async initialize(): Promise<void> {
    if (this._initialized) return

    // Try to load persisted index first
    await this.repo.load()

    // If empty, build from sources
    if (this.repo.size === 0) {
      await this.buildIndex()
    }

    this._initialized = true
  }

  // ─── Index Management ───

  /**
   * Build the index from all data sources.
   * Builds into a temporary index, then atomically swaps — avoids partial state.
   */
  async buildIndex(): Promise<IndexStats> {
    const startTime = performance.now()

    // Build into temporary repository
    const docs = await this.builder.rebuildAll()

    // Atomic swap
    this.repo.clear()
    this.repo.saveDocuments(docs)

    const elapsed = Math.round(performance.now() - startTime)
    this.repo.markBuilt(elapsed)

    // Persist
    await this.repo.persist()

    this._notify()
    return this.getStats()
  }

  /**
   * Force-rebuild the entire index.
   * Convenience alias for buildIndex() — explicitly signals a rebuild operation.
   */
  async rebuildIndex(): Promise<IndexStats> {
    return this.buildIndex()
  }

  /** Clear the index in-memory and in storage. */
  async clearIndex(): Promise<void> {
    this.repo.clear()
    await this.repo.persist()
    this._notify()
  }

  // ─── Search ───

  search(query: string, options?: SearchOptions): SearchResponse {
    return this.engine.search(query, options)
  }

  /**
   * Aggregated search: groups results by contentId for CE8 cross-source dedup.
   */
  aggregatedSearch(query: string, options?: SearchOptions): AggregatedSearchResponse {
    const result = this.engine.aggregatedSearch(query, options)
    return {
      items: result.items,
      rawDocumentCount: result.rawDocumentCount,
      uniqueContentCount: result.uniqueContentCount,
      searchTimeMs: result.searchTimeMs,
      hasMore: result.hasMore,
    }
  }

  // ─── Stats ───

  getStats(): IndexStats {
    return this.repo.getStats()
  }

  // ─── Subscriber ───

  subscribe(cb: () => void): () => void {
    this.subscribers.add(cb)
    return () => { this.subscribers.delete(cb) }
  }

  private _notify(): void {
    for (const cb of this.subscribers) {
      try { cb() } catch { /* ignore subscriber errors */ }
    }
  }
}
