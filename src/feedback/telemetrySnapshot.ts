// src/feedback/telemetrySnapshot.ts — PB1-008 Telemetry Snapshot Integration
// Reads telemetry service and captures a point-in-time snapshot for feedback attachments.
// Pure TypeScript — depends on telemetry types only.

import type { TelemetryDashboard } from '@/telemetry/telemetryService'
import type { CrashEvent, CrashMetrics } from '@/telemetry/crashReporter'
import type { StartupMetrics } from '@/telemetry/startupMetrics'
import type { SessionMetrics } from '@/telemetry/sessionMetrics'

// ── Snapshot Types ──

export interface TelemetrySnapshot {
  timestamp: number
  dashboard: TelemetryDashboard | null
  crashEvents: CrashEvent[]
  startupRecords: unknown[]
  sessionRecords: unknown[]
  summary: TelemetrySnapshotSummary
}

export interface TelemetrySnapshotSummary {
  totalSessions: number
  totalCrashes: number
  crashFreeRate: number
  recoverySuccessRate: number
  averageStartupTime: number
  averageSessionDuration: number
  startupSuccessRate: number
}

// ── Telemetry Provider Interface ──

export interface ITelemetryProvider {
  getDashboard(): TelemetryDashboard
  crash: {
    exportEvents(): CrashEvent[]
    getCrashFreeSessionRate(): number
    getRecoverySuccessRate(): number
    getMetrics(): CrashMetrics
  }
  session: {
    exportRecords(): unknown[]
    getMetrics(): SessionMetrics
  }
  startup: {
    exportRecords(): unknown[]
    getMetrics(): StartupMetrics
  }
}

// ── Snapshot Capture ──

export class TelemetrySnapshotCapture {
  private provider: ITelemetryProvider | null = null

  /** Register the telemetry service as data source */
  setProvider(provider: ITelemetryProvider): void {
    this.provider = provider
  }

  /** Check if provider is available */
  hasProvider(): boolean {
    return this.provider !== null
  }

  /** Capture a point-in-time snapshot */
  capture(): TelemetrySnapshot {
    if (!this.provider) {
      return this.emptySnapshot()
    }

    try {
      const dashboard = this.provider.getDashboard()
      const crashMetrics = this.provider.crash.getMetrics()

      return {
        timestamp: Date.now(),
        dashboard,
        crashEvents: this.provider.crash.exportEvents().slice(-50),
        startupRecords: this.provider.startup.exportRecords().slice(-20),
        sessionRecords: this.provider.session.exportRecords().slice(-30),
        summary: {
          totalSessions: dashboard.totalSessions,
          totalCrashes: dashboard.totalCrashes,
          crashFreeRate: dashboard.crashFreeSessionRate,
          recoverySuccessRate: dashboard.recoverySuccessRate,
          averageStartupTime: dashboard.averageStartupTime,
          averageSessionDuration: dashboard.averageSessionDuration,
          startupSuccessRate: dashboard.startupSuccessRate
        }
      }
    } catch (e) {
      console.error('[TelemetrySnapshot] Capture failed:', (e as Error).message)
      return this.emptySnapshot()
    }
  }

  /** Get just the summary (lightweight, for frequent calls) */
  getSummary(): TelemetrySnapshotSummary {
    if (!this.provider) {
      return {
        totalSessions: 0,
        totalCrashes: 0,
        crashFreeRate: 1,
        recoverySuccessRate: 1,
        averageStartupTime: 0,
        averageSessionDuration: 0,
        startupSuccessRate: 1
      }
    }
    const dashboard = this.provider.getDashboard()
    return {
      totalSessions: dashboard.totalSessions,
      totalCrashes: dashboard.totalCrashes,
      crashFreeRate: dashboard.crashFreeSessionRate,
      recoverySuccessRate: dashboard.recoverySuccessRate,
      averageStartupTime: dashboard.averageStartupTime,
      averageSessionDuration: dashboard.averageSessionDuration,
      startupSuccessRate: dashboard.startupSuccessRate
    }
  }

  private emptySnapshot(): TelemetrySnapshot {
    return {
      timestamp: Date.now(),
      dashboard: null,
      crashEvents: [],
      startupRecords: [],
      sessionRecords: [],
      summary: {
        totalSessions: 0,
        totalCrashes: 0,
        crashFreeRate: 1,
        recoverySuccessRate: 1,
        averageStartupTime: 0,
        averageSessionDuration: 0,
        startupSuccessRate: 1
      }
    }
  }
}
