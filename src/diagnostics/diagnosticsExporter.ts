// src/diagnostics/diagnosticsExporter.ts — PB1-005 Diagnostics Exporter
// Collects system info, app metadata, telemetry snapshot, recent crashes.
// Pure TypeScript with pluggable system-info provider.

import type { TelemetryDashboard } from '@/telemetry/telemetryService'
import type { CrashEvent } from '@/telemetry/crashReporter'
import type { StartupRecord } from '@/telemetry/startupMetrics'
import type { SessionRecord } from '@/telemetry/sessionMetrics'

// ── System Info Provider Interface ──

export interface ISystemInfoProvider {
  getPlatform(): string
  getOSVersion(): string
  getArch(): string
  getCPUInfo(): string
  getTotalMemory(): number
  getFreeMemory(): number
  getUserDataPath(): string
}

// ── Default Provider (no Electron dependency) ──

export class BasicSystemInfoProvider implements ISystemInfoProvider {
  getPlatform(): string { return process.platform }
  getOSVersion(): string { return process.getuid ? 'linux' : 'win32' } // simplified
  getArch(): string { return process.arch }
  getCPUInfo(): string { return `${require('os').cpus().length} cores` }
  getTotalMemory(): number { return require('os').totalmem() }
  getFreeMemory(): number { return require('os').freemem() }
  getUserDataPath(): string { return process.cwd() }
}

// ── Diagnostic Data Structures ──

export interface SystemInfo {
  platform: string
  osVersion: string
  arch: string
  cpuInfo: string
  totalMemory: number
  freeMemory: number
  userDataPath: string
  timestamp: number
}

export interface AppMetadata {
  appName: string
  appVersion: string
  electronVersion: string
  nodeVersion: string
  v8Version: string
  buildDate: string
  gitCommit: string
}

export interface DiagnosticSnapshot {
  id: string
  timestamp: number
  systemInfo: SystemInfo
  appMetadata: AppMetadata
  telemetry?: TelemetryDashboard
  recentCrashes?: CrashEvent[]
  startupMetrics?: StartupRecord[]
  sessionMetrics?: SessionRecord[]
}

// ── Diagnostics Exporter ──

export class DiagnosticsExporter {
  private systemProvider: ISystemInfoProvider
  private appMeta: AppMetadata
  private telemetryProvider?: () => {
    dashboard: TelemetryDashboard
    crashEvents: CrashEvent[]
    startupRecords: StartupRecord[]
    sessionRecords: SessionRecord[]
  }

  constructor(
    systemProvider?: ISystemInfoProvider,
    appMetadata?: Partial<AppMetadata>
  ) {
    this.systemProvider = systemProvider || new BasicSystemInfoProvider()
    this.appMeta = {
      appName: 'LH-TV',
      appVersion: appMetadata?.appVersion || '2.0.0',
      electronVersion: appMetadata?.electronVersion || process.versions.electron || 'N/A',
      nodeVersion: process.versions.node || 'N/A',
      v8Version: process.versions.v8 || 'N/A',
      buildDate: appMetadata?.buildDate || 'N/A',
      gitCommit: appMetadata?.gitCommit || 'N/A'
    }
  }

  /** Register a telemetry provider for snapshot integration */
  setTelemetryProvider(provider: () => {
    dashboard: TelemetryDashboard
    crashEvents: CrashEvent[]
    startupRecords: StartupRecord[]
    sessionRecords: SessionRecord[]
  }): void {
    this.telemetryProvider = provider
  }

  /** Collect system information */
  collectSystemInfo(): SystemInfo {
    return {
      platform: this.systemProvider.getPlatform(),
      osVersion: this.systemProvider.getOSVersion(),
      arch: this.systemProvider.getArch(),
      cpuInfo: this.systemProvider.getCPUInfo(),
      totalMemory: this.systemProvider.getTotalMemory(),
      freeMemory: this.systemProvider.getFreeMemory(),
      userDataPath: this.systemProvider.getUserDataPath(),
      timestamp: Date.now()
    }
  }

  /** Generate a full diagnostic snapshot */
  generateDiagnosticSnapshot(): DiagnosticSnapshot {
    const snapshot: DiagnosticSnapshot = {
      id: `diag-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: Date.now(),
      systemInfo: this.collectSystemInfo(),
      appMetadata: this.appMeta
    }

    if (this.telemetryProvider) {
      try {
        const telemetry = this.telemetryProvider()
        snapshot.telemetry = telemetry.dashboard
        snapshot.recentCrashes = telemetry.crashEvents.slice(-20)
        snapshot.startupMetrics = telemetry.startupRecords.slice(-10)
        snapshot.sessionMetrics = telemetry.sessionRecords.slice(-20)
      } catch (e) {
        console.error('[Diagnostics] Telemetry snapshot failed:', (e as Error).message)
      }
    }

    return snapshot
  }

  /** Export diagnostics as JSON */
  exportDiagnostics(): DiagnosticSnapshot {
    return this.generateDiagnosticSnapshot()
  }

  /** Export diagnostics as formatted JSON string */
  exportDiagnosticsJson(pretty: boolean = true): string {
    const snapshot = this.generateDiagnosticSnapshot()
    return JSON.stringify(snapshot, null, pretty ? 2 : 0)
  }

  /** Get app metadata */
  getAppMetadata(): AppMetadata {
    return { ...this.appMeta }
  }

  /** Update app metadata */
  updateAppMetadata(meta: Partial<AppMetadata>): void {
    Object.assign(this.appMeta, meta)
  }
}
