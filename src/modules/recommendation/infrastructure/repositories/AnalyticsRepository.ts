// modules/recommendation/infrastructure/repositories/AnalyticsRepository.ts — CE9-D

import type { IStorageAdapter } from '../storage/IStorageAdapter'
import type { TelemetryEvent } from '../../runtime/telemetry/TelemetryCollector'

export interface AnalyticsRecord {
  readonly event: TelemetryEvent
  readonly storedAt: number
}

export interface AnalyticsQuery {
  readonly type?: string
  readonly feedId?: string
  readonly mediaId?: string
  readonly fromDate?: number
  readonly toDate?: number
  readonly limit?: number
  readonly offset?: number
}

export interface IAnalyticsRepository {
  save(event: TelemetryEvent): Promise<void>
  saveBatch(events: TelemetryEvent[]): Promise<void>
  query(q: AnalyticsQuery): Promise<AnalyticsRecord[]>
  count(q: AnalyticsQuery): Promise<number>
  clear(): Promise<void>
}

export class AnalyticsRepository implements IAnalyticsRepository {
  constructor(private storage: IStorageAdapter<AnalyticsRecord[]>) {}

  private async _ensureLoaded(): Promise<AnalyticsRecord[]> {
    return (await this.storage.load()) ?? []
  }

  async save(event: TelemetryEvent): Promise<void> {
    const data = await this._ensureLoaded()
    data.push({ event, storedAt: Date.now() })
    if (data.length > 10000) data.splice(0, data.length - 10000)
    await this.storage.save(data)
  }

  async saveBatch(events: TelemetryEvent[]): Promise<void> {
    const data = await this._ensureLoaded()
    for (const event of events) {
      data.push({ event, storedAt: Date.now() })
    }
    if (data.length > 10000) data.splice(0, data.length - 10000)
    await this.storage.save(data)
  }

  async query(q: AnalyticsQuery): Promise<AnalyticsRecord[]> {
    const data = await this._ensureLoaded()
    let filtered = data

    if (q.type) filtered = filtered.filter(r => r.event.type === q.type)
    if (q.feedId) filtered = filtered.filter(r => r.event.feedId === q.feedId)
    if (q.mediaId) filtered = filtered.filter(r => r.event.mediaId === q.mediaId)
    if (q.fromDate) filtered = filtered.filter(r => r.event.timestamp >= q.fromDate!)
    if (q.toDate) filtered = filtered.filter(r => r.event.timestamp <= q.toDate!)

    filtered = filtered.sort((a, b) => b.event.timestamp - a.event.timestamp)

    const offset = q.offset ?? 0
    const limit = q.limit ?? filtered.length
    return filtered.slice(offset, offset + limit)
  }

  async count(q: AnalyticsQuery): Promise<number> {
    return (await this.query(q)).length
  }

  async clear(): Promise<void> {
    await this.storage.save([])
  }
}
