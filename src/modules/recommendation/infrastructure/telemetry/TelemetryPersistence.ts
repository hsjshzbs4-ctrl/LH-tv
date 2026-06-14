// modules/recommendation/infrastructure/telemetry/TelemetryPersistence.ts — CE9-D

import type { IAnalyticsRepository } from '../repositories/AnalyticsRepository'
import type { TelemetryEvent } from '../../runtime/telemetry/TelemetryCollector'

export class TelemetryPersistence {
  constructor(private repo: IAnalyticsRepository) {}

  async persist(event: TelemetryEvent): Promise<void> {
    await this.repo.save(event)
  }

  async persistBatch(events: TelemetryEvent[]): Promise<void> {
    await this.repo.saveBatch(events)
  }

  async getRecentEvents(type: string, limit: number = 100): Promise<TelemetryEvent[]> {
    const records = await this.repo.query({ type, limit })
    return records.map(r => r.event)
  }
}
