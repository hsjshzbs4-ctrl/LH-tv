// src/telemetry/telemetryService.ts — PB1-004 Telemetry Service
// Central telemetry pipeline: register sources → collect events → aggregate → persist → query.
// Pure TypeScript with pluggable storage backend.

import { CrashReporter, type CrashEvent, type CrashMetrics } from './crashReporter'
import { SessionMetricsTracker, type SessionRecord, type SessionEvent, type SessionMetrics } from './sessionMetrics'
import { StartupMetricsTracker, type StartupRecord, type StartupMetrics } from './startupMetrics'

// ── Storage Interface ──

export interface ITelemetryStorage {
  save(key: string, data: unknown): Promise<void>
  load<T>(key: string): Promise<T | null>
  remove(key: string): Promise<void>
}

// ── Memory Storage (default, no filesystem dependency) ──

export class MemoryTelemetryStorage implements ITelemetryStorage {
  private store = new Map<string, unknown>()

  async save(key: string, data: unknown): Promise<void> {
    this.store.set(key, data)
  }

  async load<T>(key: string): Promise<T | null> {
    return (this.store.get(key) as T) ?? null
  }

  async remove(key: string): Promise<void> {
    this.store.delete(key)
  }
}

// ── Aggregated Dashboard Metrics ──

export interface TelemetryDashboard {
  crashFreeSessionRate: number
  startupSuccessRate: number
  averageStartupTime: number
  averageColdStartTime: number
  averageWarmStartTime: number
  averageSessionDuration: number
  totalSessions: number
  dailyActiveSessions: number
  totalCrashes: number
  recoverySuccessRate: number
}

// ── Telemetry Service ──

export class TelemetryService {
  readonly crash: CrashReporter
  readonly session: SessionMetricsTracker
  readonly startup: StartupMetricsTracker
  private storage: ITelemetryStorage
  private saveTimer: ReturnType<typeof setInterval> | null = null
  private initialized = false

  constructor(storage?: ITelemetryStorage) {
    this.crash = new CrashReporter()
    this.session = new SessionMetricsTracker()
    this.startup = new StartupMetricsTracker()
    this.storage = storage || new MemoryTelemetryStorage()
  }

  /** Initialize: load persisted data, start auto-save, begin session */
  async initialize(isWarmStart: boolean = false): Promise<void> {
    if (this.initialized) return

    // Load persisted data
    await this.loadPersistedData()

    // Begin startup tracking
    const startupType = isWarmStart ? 'warm-start' : 'cold-start'
    this.startup.beginStartup(startupType)
    this.startup.stageStart('main-process')

    // Begin session
    this.session.startSession()

    // Start auto-save every 30 seconds
    this.saveTimer = setInterval(() => {
      this.flush().catch(() => { /* silent */ })
    }, 30000)

    this.initialized = true
  }

  /** Shutdown: flush all data, end session */
  async shutdown(crashDetected: boolean = false): Promise<void> {
    if (this.saveTimer) {
      clearInterval(this.saveTimer)
      this.saveTimer = null
    }

    // Complete startup tracking
    this.startup.completeStartup(!crashDetected)
    this.startup.stageEnd('main-process')

    // End session
    this.session.endSession(crashDetected)

    // Mark crash state
    if (!crashDetected) {
      this.crash.markSessionClean()
    }

    // Final flush
    await this.flush()
    this.initialized = false
  }

  /** Persist all data to storage */
  async flush(): Promise<void> {
    try {
      await Promise.all([
        this.storage.save('telemetry:crash-events', this.crash.exportEvents()),
        this.storage.save('telemetry:session-records', this.session.exportRecords()),
        this.storage.save('telemetry:session-events', this.session.exportEvents()),
        this.storage.save('telemetry:startup-records', this.startup.exportRecords())
      ])
    } catch (e) {
      console.error('[Telemetry] Flush failed:', (e as Error).message)
    }
  }

  /** Load persisted data from storage */
  private async loadPersistedData(): Promise<void> {
    try {
      const crashEvents = await this.storage.load<CrashEvent[]>('telemetry:crash-events')
      if (crashEvents) this.crash.importEvents(crashEvents)

      const sessionRecords = await this.storage.load<SessionRecord[]>('telemetry:session-records')
      if (sessionRecords) this.session.importRecords(sessionRecords)

      const startupRecords = await this.storage.load<StartupRecord[]>('telemetry:startup-records')
      if (startupRecords) this.startup.importRecords(startupRecords)
    } catch (e) {
      console.error('[Telemetry] Load failed:', (e as Error).message)
    }
  }

  /** Get the telemetry dashboard summary */
  getDashboard(): TelemetryDashboard {
    const crashMetrics = this.getCrashMetrics()
    const sessionMetrics = this.session.getMetrics()
    const startupMetrics = this.startup.getMetrics()

    return {
      crashFreeSessionRate: this.crash.getCrashFreeSessionRate(),
      startupSuccessRate: startupMetrics.startupSuccessRate,
      averageStartupTime: startupMetrics.averageColdStartTime,
      averageColdStartTime: startupMetrics.averageColdStartTime,
      averageWarmStartTime: startupMetrics.averageWarmStartTime,
      averageSessionDuration: sessionMetrics.averageDuration,
      totalSessions: sessionMetrics.totalSessions,
      dailyActiveSessions: sessionMetrics.dailyActiveSessions,
      totalCrashes: crashMetrics.crashCount,
      recoverySuccessRate: this.crash.getRecoverySuccessRate()
    }
  }

  /** Get aggregated crash metrics */
  getCrashMetrics(): CrashMetrics {
    const sessionMetrics = this.session.getMetrics()
    const crashFree = sessionMetrics.totalSessions - (
      this.crash.exportEvents().filter(e =>
        e.type === 'renderer-crash' || e.type === 'unresponsive'
      ).length > 0 ? 1 : 0
    )
    // Count sessions that had no crash events
    const crashedSessionIds = new Set(
      this.crash.exportEvents()
        .filter(e => e.sessionId)
        .map(e => e.sessionId!)
    )
    const crashFreeSessions = sessionMetrics.totalSessions - crashedSessionIds.size
    return this.crash.getMetrics(sessionMetrics.totalSessions, Math.max(0, crashFreeSessions))
  }

  /** Export all telemetry data as a JSON-serializable object (for diagnostics) */
  exportAll(): {
    crashEvents: CrashEvent[]
    sessionRecords: SessionRecord[]
    sessionEvents: SessionEvent[]
    startupRecords: StartupRecord[]
    dashboard: TelemetryDashboard
  } {
    return {
      crashEvents: this.crash.exportEvents(),
      sessionRecords: this.session.exportRecords(),
      sessionEvents: this.session.exportEvents(),
      startupRecords: this.startup.exportRecords(),
      dashboard: this.getDashboard()
    }
  }

  /** Get the storage backend (for integration with Electron main-process storage) */
  getStorage(): ITelemetryStorage {
    return this.storage
  }

  /** Replace the storage backend (e.g., switch from memory to disk after initialization) */
  setStorage(storage: ITelemetryStorage): void {
    this.storage = storage
  }

  /** Clear all telemetry data */
  async clearAll(): Promise<void> {
    this.crash.clear()
    this.session.clear()
    this.startup.clear()
    await Promise.all([
      this.storage.remove('telemetry:crash-events'),
      this.storage.remove('telemetry:session-records'),
      this.storage.remove('telemetry:session-events'),
      this.storage.remove('telemetry:startup-records')
    ])
  }
}

// ── Singleton ──

let _instance: TelemetryService | null = null

export function getTelemetryService(): TelemetryService {
  if (!_instance) {
    _instance = new TelemetryService()
  }
  return _instance
}

export function setTelemetryService(service: TelemetryService): void {
  _instance = service
}
