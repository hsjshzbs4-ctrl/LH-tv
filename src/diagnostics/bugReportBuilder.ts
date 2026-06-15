// src/diagnostics/bugReportBuilder.ts — PB1-006 Bug Report Builder
// Collects crash logs, telemetry, env data, app metadata, diagnostic snapshot into a bug report package.
// Pure TypeScript — ZIP generation via pluggable archiver.

import { DiagnosticsExporter, type DiagnosticSnapshot, type AppMetadata, type SystemInfo } from './diagnosticsExporter'
import type { CrashEvent } from '@/telemetry/crashReporter'
import type { TelemetryDashboard } from '@/telemetry/telemetryService'

// ── Bug Report Structures ──

export interface BugReport {
  id: string
  timestamp: number
  title: string
  description: string
  category: 'crash' | 'bug' | 'performance' | 'other'
  severity: 'critical' | 'high' | 'medium' | 'low'
  steps?: string[]
  expectedBehavior?: string
  actualBehavior?: string
  diagnosticSnapshot: DiagnosticSnapshot
  attachments: string[] // file paths
}

export interface BugReportPackage {
  report: BugReport
  serialized: string // JSON string for file output
  createdAt: number
}

// ── Bug Report Builder ──

export class BugReportBuilder {
  private exporter: DiagnosticsExporter
  private reports: BugReport[] = []

  constructor(exporter: DiagnosticsExporter) {
    this.exporter = exporter
  }

  /** Build a bug report with all diagnostic data */
  buildReport(params: {
    title: string
    description: string
    category?: 'crash' | 'bug' | 'performance' | 'other'
    severity?: 'critical' | 'high' | 'medium' | 'low'
    steps?: string[]
    expectedBehavior?: string
    actualBehavior?: string
    attachments?: string[]
  }): BugReport {
    const report: BugReport = {
      id: `bug-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: Date.now(),
      title: params.title,
      description: params.description,
      category: params.category || 'bug',
      severity: params.severity || 'medium',
      steps: params.steps,
      expectedBehavior: params.expectedBehavior,
      actualBehavior: params.actualBehavior,
      diagnosticSnapshot: this.exporter.generateDiagnosticSnapshot(),
      attachments: params.attachments || []
    }

    this.reports.push(report)
    return report
  }

  /** Create a crash-specific report from a crash event */
  buildCrashReport(crash: CrashEvent, description?: string): BugReport {
    return this.buildReport({
      title: `Crash: ${crash.reason}`,
      description: description || `Renderer crash detected: ${crash.reason} (exit code: ${crash.exitCode ?? 'N/A'})`,
      category: 'crash',
      severity: crash.type === 'recovery-failure' ? 'critical' : 'high',
      actualBehavior: `Application crashed with reason: ${crash.reason}`
    })
  }

  /** Serialize a bug report to a JSON-stringifiable package */
  serializeReport(report: BugReport): BugReportPackage {
    return {
      report,
      serialized: JSON.stringify(report, null, 2),
      createdAt: Date.now()
    }
  }

  /** Get all generated reports */
  getReports(): BugReport[] {
    return [...this.reports]
  }

  /** Get report count */
  getReportCount(): number {
    return this.reports.length
  }

  /** Clear all in-memory reports */
  clearReports(): void {
    this.reports = []
  }

  /** Generate a summary of all bug reports */
  generateSummary(): {
    total: number
    byCategory: Record<string, number>
    bySeverity: Record<string, number>
  } {
    const byCategory: Record<string, number> = {}
    const bySeverity: Record<string, number> = {}

    for (const report of this.reports) {
      byCategory[report.category] = (byCategory[report.category] || 0) + 1
      bySeverity[report.severity] = (bySeverity[report.severity] || 0) + 1
    }

    return {
      total: this.reports.length,
      byCategory,
      bySeverity
    }
  }

  /** Get the diagnostics exporter for direct access */
  getExporter(): DiagnosticsExporter {
    return this.exporter
  }
}
