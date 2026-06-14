// modules/recommendation/infrastructure/mappers/AnalyticsMapper.ts — CE9-D

import type { TelemetryEvent } from '../../runtime/telemetry/TelemetryCollector'
import type { AnalyticsRecord } from '../repositories/AnalyticsRepository'

export class AnalyticsMapper {
  static toRecord(event: TelemetryEvent): AnalyticsRecord {
    return { event, storedAt: Date.now() }
  }

  static fromRecord(record: AnalyticsRecord): TelemetryEvent {
    return record.event
  }
}
