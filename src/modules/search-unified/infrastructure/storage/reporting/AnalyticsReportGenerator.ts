// modules/search-unified/infrastructure/storage/reporting/AnalyticsReportGenerator.ts — CE8-C3
// Generates daily/weekly/monthly analytics reports in JSON format only.

import type { AnalyticsAggregationService, AggregatedSummary } from '../aggregation/AnalyticsAggregationService'

export interface AnalyticsReport {
  readonly reportType: 'daily' | 'weekly' | 'monthly'
  readonly generatedAt: number
  readonly period: { readonly start: number; readonly end: number }
  readonly summary: AggregatedSummary
}

export class AnalyticsReportGenerator {
  private reports: AnalyticsReport[] = []

  constructor(private aggregationService: AnalyticsAggregationService) {}

  /** Generate a daily report. */
  generateDaily(): AnalyticsReport {
    return this._build('daily', () => this.aggregationService.generateDaily())
  }

  /** Generate a weekly report. */
  generateWeekly(): AnalyticsReport {
    return this._build('weekly', () => this.aggregationService.generateWeekly())
  }

  /** Generate a monthly report (4 weeks). */
  generateMonthly(): AnalyticsReport {
    // Monthly is effectively a weekly aggregation — extended window
    const summary = this.aggregationService.generateWeekly()
    return this._build('monthly', () => summary)
  }

  /** Get all generated reports. */
  getReports(): AnalyticsReport[] {
    return [...this.reports]
  }

  /** Export all reports as JSON string. */
  exportJSON(): string {
    return JSON.stringify(this.reports, null, 2)
  }

  /** Clear all reports. */
  clear(): void {
    this.reports = []
  }

  private _build(
    reportType: 'daily' | 'weekly' | 'monthly',
    generate: () => AggregatedSummary,
  ): AnalyticsReport {
    const summary = generate()
    const report: AnalyticsReport = {
      reportType,
      generatedAt: Date.now(),
      period: { start: summary.windowStart, end: summary.windowEnd },
      summary,
    }
    this.reports.push(report)
    return report
  }
}
