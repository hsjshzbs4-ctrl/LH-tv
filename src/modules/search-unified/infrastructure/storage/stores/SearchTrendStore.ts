// modules/search-unified/infrastructure/storage/stores/SearchTrendStore.ts — CE8-C3
import type { SearchTrendEntry } from '../models/SearchTrendEntry'
import type { IStorageAdapter } from './SearchAnalyticsStore'

const ROLLING_DECAY_FACTOR = 0.95

export class SearchTrendStore {
  private entries: Map<string, SearchTrendEntry> = new Map()
  private loaded = false

  constructor(private storage: IStorageAdapter) {}

  async load(): Promise<void> {
    if (this.loaded) return
    const data = await this.storage.load()
    const arr = Array.isArray(data) ? data as SearchTrendEntry[] : []
    for (const e of arr) this.entries.set(e.query, e)
    this.loaded = true
  }

  async recordQuery(query: string): Promise<void> {
    await this._ensureLoaded()
    const n = query.toLowerCase().trim()
    if (!n) return
    const existing = this.entries.get(n)
    const now = Date.now()
    if (existing) { existing.count++; existing.lastSeen = now; existing.rollingScore = existing.rollingScore * ROLLING_DECAY_FACTOR + 10 }
    else { this.entries.set(n, { query: n, count: 1, lastSeen: now, rollingScore: 10 }) }
    await this._persist()
  }

  getTopSearches(limit = 20): SearchTrendEntry[] { return Array.from(this.entries.values()).sort((a, b) => b.count - a.count).slice(0, limit) }
  getTrendingSearches(limit = 20): SearchTrendEntry[] { return Array.from(this.entries.values()).sort((a, b) => b.rollingScore - a.rollingScore).slice(0, limit) }
  getRecentTrends(limit = 20): SearchTrendEntry[] { return Array.from(this.entries.values()).sort((a, b) => b.lastSeen - a.lastSeen).slice(0, limit) }

  async clear(): Promise<void> { this.entries.clear(); await this.storage.clear() }
  get count(): number { return this.entries.size }

  private async _ensureLoaded(): Promise<void> { if (!this.loaded) await this.load() }
  private async _persist(): Promise<void> { await this.storage.save(Array.from(this.entries.values())) }
}
