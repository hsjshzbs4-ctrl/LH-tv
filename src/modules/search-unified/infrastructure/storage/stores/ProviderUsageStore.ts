// modules/search-unified/infrastructure/storage/stores/ProviderUsageStore.ts — CE8-C3
import type { ProviderUsageEntry } from '../models/ProviderUsageEntry'
import type { IStorageAdapter } from './SearchAnalyticsStore'

export class ProviderUsageStore {
  private entries: Map<string, ProviderUsageEntry> = new Map()
  private loaded = false

  constructor(private storage: IStorageAdapter) {}

  async load(): Promise<void> {
    if (this.loaded) return
    const data = await this.storage.load()
    const arr = Array.isArray(data) ? data as ProviderUsageEntry[] : []
    for (const e of arr) this.entries.set(e.providerId, e)
    this.loaded = true
  }

  async recordSearch(providerId: string, resultCount: number, latencyMs: number): Promise<void> {
    await this._ensureLoaded(); const e = this._ensure(providerId)
    e.searches++; e.results += resultCount; e.successCount++; e.totalLatencyMs += latencyMs; e.lastUsedAt = Date.now()
    await this._persist()
  }

  async recordError(providerId: string): Promise<void> {
    await this._ensureLoaded(); this._ensure(providerId).errorCount++; await this._persist()
  }

  async recordClick(providerId: string): Promise<void> { await this._ensureLoaded(); this._ensure(providerId).clicks++; await this._persist() }
  async recordPlay(providerId: string): Promise<void> { await this._ensureLoaded(); this._ensure(providerId).plays++; await this._persist() }

  getUsage(providerId: string): ProviderUsageEntry | undefined {
    const raw = this.entries.get(providerId); return raw ? this._withComputed(raw) : undefined
  }

  getAllUsage(): ProviderUsageEntry[] { return Array.from(this.entries.values()).map(e => this._withComputed(e)) }
  async clear(): Promise<void> { this.entries.clear(); await this.storage.clear() }

  private _ensure(id: string): ProviderUsageEntry {
    let e = this.entries.get(id)
    if (!e) { e = { providerId: id, searches: 0, results: 0, clicks: 0, plays: 0, successCount: 0, errorCount: 0, totalLatencyMs: 0, lastUsedAt: 0 }; this.entries.set(id, e) }
    return e
  }

  private _withComputed(e: ProviderUsageEntry): ProviderUsageEntry {
    const total = e.successCount + e.errorCount
    return { ...e, successRate: total > 0 ? Math.round((e.successCount / total) * 100) / 100 : 0, averageLatencyMs: e.successCount > 0 ? Math.round(e.totalLatencyMs / e.successCount) : 0 }
  }

  private async _ensureLoaded(): Promise<void> { if (!this.loaded) await this.load() }
  private async _persist(): Promise<void> { await this.storage.save(Array.from(this.entries.values())) }
}
