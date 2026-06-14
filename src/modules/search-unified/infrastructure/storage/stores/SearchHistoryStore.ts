// modules/search-unified/infrastructure/storage/stores/SearchHistoryStore.ts — CE8-C3
import type { SearchHistoryEntry } from '../models/SearchHistoryEntry'
import { MAX_HISTORY_ENTRIES } from '../models/SearchHistoryEntry'
import type { IStorageAdapter } from './SearchAnalyticsStore'

export class SearchHistoryStore {
  private entries: SearchHistoryEntry[] = []
  private loaded = false

  constructor(private storage: IStorageAdapter) {}

  async load(): Promise<void> {
    if (this.loaded) return
    const data = await this.storage.load()
    this.entries = Array.isArray(data) ? data as SearchHistoryEntry[] : []
    this.loaded = true
  }

  async addQuery(query: string, resultCount: number): Promise<void> {
    await this._ensureLoaded()
    const normalized = query.toLowerCase().trim()
    const existing = this.entries.find(e => e.normalizedQuery === normalized)
    if (existing) {
      existing.frequency++
      existing.lastSearchedAt = Date.now()
      existing.resultCount = resultCount
    } else {
      this.entries.push({
        id: `hist:${Date.now()}:${Math.random().toString(36).substring(2, 6)}`,
        query: query.trim(), normalizedQuery: normalized,
        frequency: 1, lastSearchedAt: Date.now(), firstSearchedAt: Date.now(), resultCount,
      })
    }
    this._sort()
    if (this.entries.length > MAX_HISTORY_ENTRIES) this.entries = this.entries.slice(0, MAX_HISTORY_ENTRIES)
    await this._persist()
  }

  getRecentQueries(limit = 50): SearchHistoryEntry[] { this._sort(); return this.entries.slice(0, limit) }

  async deleteQuery(id: string): Promise<boolean> {
    await this._ensureLoaded()
    const idx = this.entries.findIndex(e => e.id === id)
    if (idx === -1) return false
    this.entries.splice(idx, 1); await this._persist(); return true
  }

  async clearHistory(): Promise<void> { this.entries = []; await this.storage.clear() }
  get count(): number { return this.entries.length }

  private _sort(): void { this.entries.sort((a, b) => b.lastSearchedAt - a.lastSearchedAt) }
  private async _ensureLoaded(): Promise<void> { if (!this.loaded) await this.load() }
  private async _persist(): Promise<void> { await this.storage.save(this.entries) }
}
