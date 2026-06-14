// modules/search-unified/infrastructure/storage/stores/SearchAnalyticsStore.ts — CE8-C3
// Persistent analytics repository. Supports: save, query, pagination, date range, type/provider filtering.

import type { SearchAnalyticsRecord, AnalyticsEventType } from '../models/SearchAnalyticsRecord'
import { generateRecordId } from '../models/SearchAnalyticsRecord'

export interface IStorageAdapter {
  load(): Promise<unknown>
  save(data: unknown): Promise<void>
  clear(): Promise<void>
}

export interface AnalyticsQueryOptions {
  readonly type?: AnalyticsEventType
  readonly provider?: string
  readonly contentId?: string
  readonly fromDate?: number
  readonly toDate?: number
  readonly limit?: number
  readonly offset?: number
}

export class SearchAnalyticsStore {
  private records: SearchAnalyticsRecord[] = []
  private loaded = false

  constructor(private storage: IStorageAdapter) {}

  async load(): Promise<void> {
    if (this.loaded) return
    const data = await this.storage.load()
    this.records = Array.isArray(data) ? data as SearchAnalyticsRecord[] : []
    this.loaded = true
  }

  async save(record: Omit<SearchAnalyticsRecord, 'id'>): Promise<SearchAnalyticsRecord> {
    await this._ensureLoaded()
    const full: SearchAnalyticsRecord = { ...record, id: generateRecordId(record.type, record.timestamp) }
    this.records.push(full)
    await this._persist()
    return full
  }

  async saveBatch(records: Omit<SearchAnalyticsRecord, 'id'>[]): Promise<SearchAnalyticsRecord[]> {
    await this._ensureLoaded()
    const saved = records.map(r => ({ ...r, id: generateRecordId(r.type, r.timestamp) }))
    this.records.push(...saved)
    await this._persist()
    return saved
  }

  query(options?: AnalyticsQueryOptions): SearchAnalyticsRecord[] {
    let results = [...this.records]

    if (options?.type) results = results.filter(r => r.type === options.type)
    if (options?.provider) results = results.filter(r => r.provider === options.provider)
    if (options?.contentId) results = results.filter(r => r.contentId === options.contentId)
    if (options?.fromDate) results = results.filter(r => r.timestamp >= options.fromDate!)
    if (options?.toDate) results = results.filter(r => r.timestamp <= options.toDate!)

    // Newest first
    results.sort((a, b) => b.timestamp - a.timestamp)

    if (options?.offset) results = results.slice(options.offset)
    if (options?.limit) results = results.slice(0, options.limit)

    return results
  }

  async delete(id: string): Promise<boolean> {
    await this._ensureLoaded()
    const idx = this.records.findIndex(r => r.id === id)
    if (idx === -1) return false
    this.records.splice(idx, 1)
    await this._persist()
    return true
  }

  async clear(): Promise<void> {
    this.records = []
    await this.storage.clear()
  }

  get count(): number { return this.records.length }

  private async _ensureLoaded(): Promise<void> { if (!this.loaded) await this.load() }
  private async _persist(): Promise<void> { await this.storage.save(this.records) }
}
