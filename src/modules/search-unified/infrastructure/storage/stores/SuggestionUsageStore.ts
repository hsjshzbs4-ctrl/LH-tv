// modules/search-unified/infrastructure/storage/stores/SuggestionUsageStore.ts — CE8-C3
import type { SuggestionUsageEntry } from '../models/SuggestionUsageEntry'
import type { IStorageAdapter } from './SearchAnalyticsStore'

export class SuggestionUsageStore {
  private entries: Map<string, SuggestionUsageEntry> = new Map()
  private loaded = false

  constructor(private storage: IStorageAdapter) {}

  async load(): Promise<void> {
    if (this.loaded) return
    const data = await this.storage.load()
    const arr = Array.isArray(data) ? data as SuggestionUsageEntry[] : []
    for (const e of arr) this.entries.set(e.suggestion, e)
    this.loaded = true
  }

  async recordShown(suggestion: string): Promise<void> {
    await this._ensureLoaded(); this._ensure(suggestion).shown++; this._ensure(suggestion).lastShownAt = Date.now()
    await this._persist()
  }

  async recordSelected(suggestion: string): Promise<void> {
    await this._ensureLoaded(); this._ensure(suggestion).selected++; this._ensure(suggestion).lastSelectedAt = Date.now()
    await this._persist()
  }

  getTopSuggestions(limit = 20): SuggestionUsageEntry[] {
    return Array.from(this.entries.values()).map(e => this._withCtr(e)).sort((a, b) => (b.ctr ?? 0) - (a.ctr ?? 0)).slice(0, limit)
  }

  getMostShown(limit = 20): SuggestionUsageEntry[] {
    return Array.from(this.entries.values()).sort((a, b) => b.shown - a.shown).slice(0, limit)
  }

  async clear(): Promise<void> { this.entries.clear(); await this.storage.clear() }

  private _ensure(s: string): SuggestionUsageEntry {
    let e = this.entries.get(s)
    if (!e) { e = { suggestion: s, shown: 0, selected: 0, lastShownAt: 0, lastSelectedAt: 0 }; this.entries.set(s, e) }
    return e
  }

  private _withCtr(e: SuggestionUsageEntry): SuggestionUsageEntry { return { ...e, ctr: e.shown > 0 ? Math.round((e.selected / e.shown) * 100) / 100 : 0 } }
  private async _ensureLoaded(): Promise<void> { if (!this.loaded) await this.load() }
  private async _persist(): Promise<void> { await this.storage.save(Array.from(this.entries.values())) }
}
