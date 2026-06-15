// src/release/healthMonitor.ts — PB1-012 Health Monitor
// Aggregates crash-free sessions, startup success, recovery success, avg startup time, avg session duration.
// Integrates with telemetry modules for cross-cutting health metrics.

export interface HealthSnapshot {
  timestamp: number
  crashFreeRate: number
  startupSuccessRate: number
  recoveryRate: number
  averageStartupTime: number
  averageSessionDuration: number
  totalSessions: number
  totalCrashes: number
  status: 'healthy' | 'degraded' | 'unhealthy'
}

export interface HealthThresholds {
  crashFreeMin: number       // e.g. 0.95
  startupSuccessMin: number  // e.g. 0.99
  recoveryMin: number        // e.g. 0.90
}

export interface HealthSummary {
  current: HealthSnapshot
  status: 'healthy' | 'degraded' | 'unhealthy'
  thresholds: HealthThresholds
  degradedMetrics: string[]
  history: HealthSnapshot[]
}

const DEFAULT_THRESHOLDS: HealthThresholds = {
  crashFreeMin: 0.95,
  startupSuccessMin: 0.99,
  recoveryMin: 0.90
}

export class HealthMonitor {
  private history: HealthSnapshot[] = []
  private thresholds: HealthThresholds

  constructor(thresholds?: Partial<HealthThresholds>) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds }
  }

  /** Feed health data from telemetry providers */
  feed(data: {
    crashFreeRate: number
    startupSuccessRate: number
    recoveryRate: number
    averageStartupTime: number
    averageSessionDuration: number
    totalSessions: number
    totalCrashes: number
  }): HealthSnapshot {
    const status = this.evaluateStatus(data)

    const snapshot: HealthSnapshot = {
      timestamp: Date.now(),
      crashFreeRate: data.crashFreeRate,
      startupSuccessRate: data.startupSuccessRate,
      recoveryRate: data.recoveryRate,
      averageStartupTime: data.averageStartupTime,
      averageSessionDuration: data.averageSessionDuration,
      totalSessions: data.totalSessions,
      totalCrashes: data.totalCrashes,
      status
    }

    this.history.push(snapshot)
    return snapshot
  }

  /** Evaluate health status against thresholds */
  private evaluateStatus(data: {
    crashFreeRate: number
    startupSuccessRate: number
    recoveryRate: number
  }): 'healthy' | 'degraded' | 'unhealthy' {
    const failures: string[] = []

    if (data.crashFreeRate < this.thresholds.crashFreeMin) failures.push('crash-free')
    if (data.startupSuccessRate < this.thresholds.startupSuccessMin) failures.push('startup')
    if (data.recoveryRate < this.thresholds.recoveryMin) failures.push('recovery')

    if (failures.length >= 2) return 'unhealthy'
    if (failures.length === 1) return 'degraded'
    return 'healthy'
  }

  /** Get degraded metric names */
  getDegradedMetrics(snapshot: HealthSnapshot): string[] {
    const degraded: string[] = []
    if (snapshot.crashFreeRate < this.thresholds.crashFreeMin) degraded.push('crashFreeRate')
    if (snapshot.startupSuccessRate < this.thresholds.startupSuccessMin) degraded.push('startupSuccessRate')
    if (snapshot.recoveryRate < this.thresholds.recoveryMin) degraded.push('recoveryRate')
    return degraded
  }

  /** Get health summary */
  getHealthSummary(): HealthSummary {
    const current = this.history[this.history.length - 1]
    const defaultSnapshot: HealthSnapshot = {
      timestamp: Date.now(),
      crashFreeRate: 1,
      startupSuccessRate: 1,
      recoveryRate: 1,
      averageStartupTime: 0,
      averageSessionDuration: 0,
      totalSessions: 0,
      totalCrashes: 0,
      status: 'healthy'
    }

    const active = current || defaultSnapshot

    return {
      current: active,
      status: active.status,
      thresholds: { ...this.thresholds },
      degradedMetrics: this.getDegradedMetrics(active),
      history: this.history.slice(-30) // last 30 snapshots
    }
  }

  /** Get current status only */
  getStatus(): 'healthy' | 'degraded' | 'unhealthy' {
    const summary = this.getHealthSummary()
    return summary.status
  }

  /** Update thresholds */
  setThresholds(thresholds: Partial<HealthThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds }
  }

  /** Get current thresholds */
  getThresholds(): HealthThresholds {
    return { ...this.thresholds }
  }

  /** Export history for persistence */
  exportHistory(): HealthSnapshot[] {
    return [...this.history]
  }

  /** Import history from persistence */
  importHistory(snapshots: HealthSnapshot[]): void {
    const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000
    this.history = snapshots.filter(s => s.timestamp >= cutoff)
  }

  /** Clear all data */
  clear(): void {
    this.history = []
  }
}
