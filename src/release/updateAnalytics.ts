// src/release/updateAnalytics.ts — PB1-011 Update Analytics
// Tracks update available/downloaded/installed/failed, rollback events.
// Pure TypeScript — no framework dependencies.

export interface UpdateEvent {
  id: string
  timestamp: number
  type: 'update-available' | 'update-downloaded' | 'update-installed' | 'update-failed' | 'rollback'
  fromVersion: string
  toVersion: string | null
  failureReason?: string
  downloadSize?: number
  downloadDuration?: number
}

export interface UpdateMetrics {
  totalChecks: number
  updatesAvailable: number
  updatesDownloaded: number
  updatesInstalled: number
  updatesFailed: number
  rollbacks: number
  updateSuccessRate: number
  downloadSuccessRate: number
  rollbackRate: number
  failureReasons: Record<string, number>
  currentVersion: string
}

function generateId(): string {
  return `upd-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export class UpdateAnalytics {
  private events: UpdateEvent[] = []
  private currentVersion: string

  constructor(currentVersion: string = '2.0.0') {
    this.currentVersion = currentVersion
  }

  /** An update was found to be available */
  recordUpdateAvailable(fromVersion: string, toVersion: string, downloadSize?: number): UpdateEvent {
    const event: UpdateEvent = {
      id: generateId(),
      timestamp: Date.now(),
      type: 'update-available',
      fromVersion,
      toVersion,
      downloadSize
    }
    this.events.push(event)
    return event
  }

  /** Update was successfully downloaded */
  recordUpdateDownloaded(fromVersion: string, toVersion: string, downloadDuration?: number): UpdateEvent {
    const event: UpdateEvent = {
      id: generateId(),
      timestamp: Date.now(),
      type: 'update-downloaded',
      fromVersion,
      toVersion,
      downloadDuration
    }
    this.events.push(event)
    return event
  }

  /** Update was successfully installed */
  recordUpdateInstalled(fromVersion: string, toVersion: string): UpdateEvent {
    this.currentVersion = toVersion
    const event: UpdateEvent = {
      id: generateId(),
      timestamp: Date.now(),
      type: 'update-installed',
      fromVersion,
      toVersion
    }
    this.events.push(event)
    return event
  }

  /** Update failed */
  recordUpdateFailed(fromVersion: string, toVersion: string | null, reason: string): UpdateEvent {
    const event: UpdateEvent = {
      id: generateId(),
      timestamp: Date.now(),
      type: 'update-failed',
      fromVersion,
      toVersion,
      failureReason: reason
    }
    this.events.push(event)
    return event
  }

  /** User performed a rollback */
  recordRollback(fromVersion: string, toVersion: string, reason?: string): UpdateEvent {
    this.currentVersion = toVersion
    const event: UpdateEvent = {
      id: generateId(),
      timestamp: Date.now(),
      type: 'rollback',
      fromVersion,
      toVersion,
      failureReason: reason
    }
    this.events.push(event)
    return event
  }

  /** Get update success rate */
  getUpdateSuccessRate(): number {
    const installed = this.events.filter(e => e.type === 'update-installed').length
    const failed = this.events.filter(e => e.type === 'update-failed').length
    const total = installed + failed
    if (total === 0) return 1
    return installed / total
  }

  /** Compute update metrics */
  getMetrics(): UpdateMetrics {
    const failureReasons: Record<string, number> = {}
    for (const event of this.events) {
      if (event.type === 'update-failed' && event.failureReason) {
        failureReasons[event.failureReason] = (failureReasons[event.failureReason] || 0) + 1
      }
    }

    const available = this.events.filter(e => e.type === 'update-available').length
    const downloaded = this.events.filter(e => e.type === 'update-downloaded').length
    const installed = this.events.filter(e => e.type === 'update-installed').length
    const failed = this.events.filter(e => e.type === 'update-failed').length
    const rollbacks = this.events.filter(e => e.type === 'rollback').length

    const downloadAttempts = downloaded + failed
    const updateAttempts = installed + failed

    return {
      totalChecks: available + this.events.filter(e => e.type !== 'update-available' && e.type !== 'update-downloaded' && e.type !== 'update-installed' && e.type !== 'update-failed' && e.type !== 'rollback').length,
      updatesAvailable: available,
      updatesDownloaded: downloaded,
      updatesInstalled: installed,
      updatesFailed: failed,
      rollbacks,
      updateSuccessRate: updateAttempts > 0 ? installed / updateAttempts : 1,
      downloadSuccessRate: downloadAttempts > 0 ? downloaded / downloadAttempts : 1,
      rollbackRate: installed > 0 ? rollbacks / installed : 0,
      failureReasons,
      currentVersion: this.currentVersion
    }
  }

  /** Get update success rate for dashboard */
  getUpdateSuccessRateForDashboard(): number {
    return this.getUpdateSuccessRate()
  }

  /** Export events for persistence */
  exportEvents(): UpdateEvent[] {
    return [...this.events]
  }

  /** Import events from persistence */
  importEvents(events: UpdateEvent[]): void {
    const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000
    this.events = events.filter(e => e.timestamp >= cutoff)
    const lastInstalled = this.events.filter(e => e.type === 'update-installed').pop()
    if (lastInstalled && lastInstalled.toVersion) {
      this.currentVersion = lastInstalled.toVersion
    }
  }

  /** Clear all data */
  clear(): void {
    this.events = []
  }
}
