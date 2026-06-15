// src/telemetry/sessionMetrics.ts — PB1-002 Session Metrics
// Tracks application start/exit, session duration, daily active sessions.
// Pure TypeScript — no framework dependencies.

export interface SessionEvent {
  id: string
  timestamp: number
  type: 'session-start' | 'session-end' | 'session-pause' | 'session-resume'
  sessionId: string
}

export interface SessionRecord {
  sessionId: string
  startTime: number
  endTime: number | null
  duration: number | null // computed on end
  crashDetected: boolean
}

export interface SessionMetrics {
  totalSessions: number
  activeSessions: number
  averageDuration: number
  dailyActiveSessions: number
  totalDuration: number
  sessionsToday: number
  peakConcurrentSessions: number
}

function generateId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function getDayKey(timestamp: number = Date.now()): string {
  return new Date(timestamp).toISOString().slice(0, 10) // "2026-06-15"
}

export class SessionMetricsTracker {
  private events: SessionEvent[] = []
  private currentSessionId: string | null = null
  private sessionStartTime: number | null = null
  private isPaused = false
  private pauseStartTime: number | null = null
  private totalPauseDuration = 0
  private completedSessions: SessionRecord[] = []
  private activeSessionCount = 0

  /** Start a new session. Returns sessionId. */
  startSession(): string {
    // End previous session if still active
    if (this.currentSessionId && this.sessionStartTime) {
      this.endSession(false)
    }

    this.currentSessionId = generateId()
    this.sessionStartTime = Date.now()
    this.isPaused = false
    this.totalPauseDuration = 0
    this.activeSessionCount++

    const event: SessionEvent = {
      id: generateId(),
      timestamp: this.sessionStartTime,
      type: 'session-start',
      sessionId: this.currentSessionId
    }
    this.events.push(event)
    return this.currentSessionId
  }

  /** End the current session */
  endSession(crashDetected: boolean = false): SessionRecord | null {
    if (!this.currentSessionId || !this.sessionStartTime) return null

    // Resume from pause if needed (don't lose final elapsed time)
    if (this.isPaused && this.pauseStartTime) {
      this.totalPauseDuration += Date.now() - this.pauseStartTime
    }

    const endTime = Date.now()
    const rawDuration = endTime - this.sessionStartTime
    const duration = Math.max(0, rawDuration - this.totalPauseDuration)

    const event: SessionEvent = {
      id: generateId(),
      timestamp: endTime,
      type: 'session-end',
      sessionId: this.currentSessionId
    }
    this.events.push(event)

    const record: SessionRecord = {
      sessionId: this.currentSessionId,
      startTime: this.sessionStartTime,
      endTime,
      duration,
      crashDetected
    }
    this.completedSessions.push(record)
    this.activeSessionCount = Math.max(0, this.activeSessionCount - 1)

    this.currentSessionId = null
    this.sessionStartTime = null
    this.isPaused = false
    this.totalPauseDuration = 0

    return record
  }

  /** Pause the current session (app goes to background) */
  pauseSession(): void {
    if (!this.isPaused && this.currentSessionId) {
      this.isPaused = true
      this.pauseStartTime = Date.now()
      const event: SessionEvent = {
        id: generateId(),
        timestamp: this.pauseStartTime,
        type: 'session-pause',
        sessionId: this.currentSessionId
      }
      this.events.push(event)
    }
  }

  /** Resume from pause (app comes to foreground) */
  resumeSession(): void {
    if (this.isPaused && this.pauseStartTime) {
      this.totalPauseDuration += Date.now() - this.pauseStartTime
      this.isPaused = false
      this.pauseStartTime = null
      const event: SessionEvent = {
        id: generateId(),
        timestamp: Date.now(),
        type: 'session-resume',
        sessionId: this.currentSessionId!
      }
      this.events.push(event)
    }
  }

  /** Get current session ID (null if no active session) */
  getCurrentSessionId(): string | null {
    return this.currentSessionId
  }

  /** Get current session duration in ms (excluding pauses) */
  getCurrentSessionDuration(): number {
    if (!this.sessionStartTime) return 0
    const now = Date.now()
    let elapsed = now - this.sessionStartTime
    if (this.isPaused && this.pauseStartTime) {
      elapsed -= (now - this.pauseStartTime)
    }
    elapsed -= this.totalPauseDuration
    return Math.max(0, elapsed)
  }

  /** Compute aggregated session metrics */
  getMetrics(): SessionMetrics {
    const now = Date.now()
    const today = getDayKey(now)
    const completed = this.completedSessions

    const totalDuration = completed.reduce((sum, s) => sum + (s.duration || 0), 0)
    const sessionsToday = completed.filter(
      s => getDayKey(s.startTime) === today
    ).length

    return {
      totalSessions: completed.length,
      activeSessions: this.activeSessionCount,
      averageDuration: completed.length > 0 ? totalDuration / completed.length : 0,
      dailyActiveSessions: sessionsToday,
      totalDuration,
      sessionsToday,
      peakConcurrentSessions: Math.max(1, this.activeSessionCount)
    }
  }

  /** Export all session records for persistence */
  exportRecords(): SessionRecord[] {
    return [...this.completedSessions]
  }

  /** Export raw events */
  exportEvents(): SessionEvent[] {
    return [...this.events]
  }

  /** Import records from persistence */
  importRecords(records: SessionRecord[]): void {
    // Prune records older than 30 days
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000
    this.completedSessions = records.filter(r => r.startTime >= cutoff)
  }

  /** Clear all data */
  clear(): void {
    this.events = []
    this.completedSessions = []
    this.currentSessionId = null
    this.sessionStartTime = null
    this.isPaused = false
    this.pauseStartTime = null
    this.totalPauseDuration = 0
    this.activeSessionCount = 0
  }
}
