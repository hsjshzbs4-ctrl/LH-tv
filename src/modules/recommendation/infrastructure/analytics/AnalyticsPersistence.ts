// modules/recommendation/infrastructure/analytics/AnalyticsPersistence.ts — CE9-D
// Analytics persistence layer. Queries: top recommendations, CTR, completion rate.

import type { IAnalyticsRepository } from '../repositories/AnalyticsRepository'
import type { TelemetryEventType } from '../../runtime/telemetry/TelemetryCollector'

export interface AnalyticsStats {
  readonly totalImpressions: number
  readonly totalClicks: number
  readonly totalPlays: number
  readonly totalCompletions: number
  readonly ctr: number
  readonly completionRate: number
  readonly topClicked: { mediaId: string; count: number }[]
  readonly topPlayed: { mediaId: string; count: number }[]
}

export class AnalyticsPersistence {
  constructor(private repo: IAnalyticsRepository) {}

  async getStats(daysBack: number = 30): Promise<AnalyticsStats> {
    const fromDate = Date.now() - daysBack * 24 * 60 * 60 * 1000

    const impressions = await this.repo.count({ type: 'impression', fromDate })
    const clicks = await this.repo.count({ type: 'click', fromDate })
    const plays = await this.repo.count({ type: 'play', fromDate })
    const completions = await this.repo.count({ type: 'complete', fromDate })

    const clickRecords = await this.repo.query({ type: 'click', fromDate, limit: 1000 })
    const topClicked = this._topByMediaId(clickRecords, 10)

    const playRecords = await this.repo.query({ type: 'play', fromDate, limit: 1000 })
    const topPlayed = this._topByMediaId(playRecords, 10)

    return {
      totalImpressions: impressions,
      totalClicks: clicks,
      totalPlays: plays,
      totalCompletions: completions,
      ctr: impressions > 0 ? clicks / impressions : 0,
      completionRate: plays > 0 ? completions / plays : 0,
      topClicked,
      topPlayed,
    }
  }

  private _topByMediaId(records: { event: { mediaId?: string } }[], limit: number): { mediaId: string; count: number }[] {
    const counts = new Map<string, number>()
    for (const r of records) {
      if (r.event.mediaId) {
        counts.set(r.event.mediaId, (counts.get(r.event.mediaId) ?? 0) + 1)
      }
    }
    return [...counts.entries()]
      .map(([mediaId, count]) => ({ mediaId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
  }
}
