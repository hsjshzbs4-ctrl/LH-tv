// src/telemetry/crashReporter.ts — PB1-001 Crash Reporter
// Tracks renderer crashes, unresponsive events, load failures, and recovery outcomes.
// Pure TypeScript — no framework dependencies.

export interface CrashEvent {
  id: string
  timestamp: number
  type: 'renderer-crash' | 'unresponsive' | 'load-failure' | 'recovery-attempt' | 'recovery-success' | 'recovery-failure'
  reason: string
  exitCode?: number
  recoveryAction?: 'reload' | 'wait' | 'quit' | 'retry'
  sessionId?: string
}

export interface CrashMetrics {
  crashCount: number
  crashFreeSessions: number
  totalSessions: number
  recoveryAttempts: number
  recoverySuccesses: number
  recoveryFailures: number
  crashReasons: Record<string, number> // reason → count
  recentCrashes: CrashEvent[]
}

function generateId(): string {
  return `crash-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export class CrashReporter {
  private events: CrashEvent[] = []
  private sessionCrashed = false
  private currentRecoveryId: string | null = null

  /** Record a renderer crash (render-process-gone) */
  recordCrash(reason: string, exitCode?: number, sessionId?: string): CrashEvent {
    const event: CrashEvent = {
      id: generateId(),
      timestamp: Date.now(),
      type: 'renderer-crash',
      reason,
      exitCode,
      sessionId
    }
    this.events.push(event)
    this.sessionCrashed = true
    return event
  }

  /** Record an unresponsive event */
  recordUnresponsive(sessionId?: string): CrashEvent {
    const event: CrashEvent = {
      id: generateId(),
      timestamp: Date.now(),
      type: 'unresponsive',
      reason: 'renderer-unresponsive',
      sessionId
    }
    this.events.push(event)
    this.sessionCrashed = true
    return event
  }

  /** Record a load failure (did-fail-load) */
  recordLoadFailure(errorCode: number, errorDescription: string, sessionId?: string): CrashEvent {
    const event: CrashEvent = {
      id: generateId(),
      timestamp: Date.now(),
      type: 'load-failure',
      reason: `${errorDescription} (${errorCode})`,
      exitCode: errorCode,
      sessionId
    }
    this.events.push(event)
    this.sessionCrashed = true
    return event
  }

  /** Begin a recovery attempt — returns recoveryId */
  beginRecovery(action: 'reload' | 'wait' | 'quit' | 'retry', sessionId?: string): string {
    this.currentRecoveryId = generateId()
    const event: CrashEvent = {
      id: this.currentRecoveryId,
      timestamp: Date.now(),
      type: 'recovery-attempt',
      reason: `recovery-${action}`,
      recoveryAction: action,
      sessionId
    }
    this.events.push(event)
    return this.currentRecoveryId
  }

  /** Record successful recovery */
  recordRecoverySuccess(durationMs?: number): void {
    if (!this.currentRecoveryId) return
    const event: CrashEvent = {
      id: generateId(),
      timestamp: Date.now(),
      type: 'recovery-success',
      reason: `recovery succeeded${durationMs ? ` in ${durationMs}ms` : ''}`,
      exitCode: durationMs,
      sessionId: undefined
    }
    this.events.push(event)
    this.sessionCrashed = false
    this.currentRecoveryId = null
  }

  /** Record failed recovery */
  recordRecoveryFailure(reason: string): void {
    const event: CrashEvent = {
      id: generateId(),
      timestamp: Date.now(),
      type: 'recovery-failure',
      reason,
      sessionId: undefined
    }
    this.events.push(event)
    this.currentRecoveryId = null
  }

  /** Check if current session has experienced a crash */
  hasSessionCrashed(): boolean {
    return this.sessionCrashed
  }

  /** Get crash-free session rate */
  getCrashFreeSessionRate(totalSessions: number = 0, crashFreeSessions: number = 0): number {
    const effectiveTotal = totalSessions > 0 ? totalSessions : this.getMetrics().totalSessions
    if (effectiveTotal === 0) return 1
    const effectiveCrashFree = totalSessions > 0 ? crashFreeSessions : this.getMetrics().crashFreeSessions
    return effectiveCrashFree / effectiveTotal
  }

  /** Get recovery success rate */
  getRecoverySuccessRate(): number {
    const m = this.getMetrics()
    if (m.recoveryAttempts === 0) return 1
    return m.recoverySuccesses / m.recoveryAttempts
  }

  /** Compute and return aggregated metrics */
  getMetrics(totalSessions: number = 0, crashFreeSessions: number = 0): CrashMetrics {
    const reasonCounts: Record<string, number> = {}
    let recoveryAttempts = 0
    let recoverySuccesses = 0
    let recoveryFailures = 0

    for (const event of this.events) {
      if (event.type === 'recovery-attempt') recoveryAttempts++
      if (event.type === 'recovery-success') recoverySuccesses++
      if (event.type === 'recovery-failure') recoveryFailures++
      if (event.type === 'renderer-crash' || event.type === 'unresponsive' || event.type === 'load-failure') {
        reasonCounts[event.reason] = (reasonCounts[event.reason] || 0) + 1
      }
    }

    const crashes = this.events.filter(
      e => e.type === 'renderer-crash' || e.type === 'unresponsive' || e.type === 'load-failure'
    )

    return {
      crashCount: crashes.length,
      crashFreeSessions,
      totalSessions,
      recoveryAttempts,
      recoverySuccesses,
      recoveryFailures,
      crashReasons: reasonCounts,
      recentCrashes: crashes.slice(-10)
    }
  }

  /** Export all raw events for persistence */
  exportEvents(): CrashEvent[] {
    return [...this.events]
  }

  /** Import events from persistence (append mode — does NOT clear existing) */
  importEvents(events: CrashEvent[]): void {
    this.events.push(...events)
    // Prune events older than 30 days
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000
    this.events = this.events.filter(e => e.timestamp >= cutoff)
  }

  /** Clear all events (for testing/reset) */
  clear(): void {
    this.events = []
    this.sessionCrashed = false
    this.currentRecoveryId = null
  }

  /** Mark session as crash-free (called on clean exit) */
  markSessionClean(): void {
    this.sessionCrashed = false
  }
}
