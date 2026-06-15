// src/telemetry/startupMetrics.ts — PB1-003 Startup Metrics
// Tracks cold/warm start timing, store initialization, plugin discovery, renderer ready.
// Pure TypeScript — no framework dependencies.

export interface StartupStage {
  name: string
  startTime: number
  endTime: number | null
  duration: number | null
}

export interface StartupRecord {
  id: string
  timestamp: number
  type: 'cold-start' | 'warm-start'
  stages: StartupStage[]
  totalDuration: number | null
  success: boolean
  errorMessage?: string
}

export interface StartupMetrics {
  coldStartCount: number
  warmStartCount: number
  averageColdStartTime: number
  averageWarmStartTime: number
  startupSuccessRate: number
  stageAverages: Record<string, number> // stage → average ms
  recentStartups: StartupRecord[]
}

const KNOWN_STAGES = [
  'main-process',
  'store-initialization',
  'plugin-discovery',
  'renderer-ready',
  'window-created'
] as const

function generateId(): string {
  return `startup-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export class StartupMetricsTracker {
  private records: StartupRecord[] = []
  private currentStartup: StartupRecord | null = null

  /** Begin tracking a startup sequence */
  beginStartup(type: 'cold-start' | 'warm-start'): string {
    const id = generateId()
    this.currentStartup = {
      id,
      timestamp: Date.now(),
      type,
      stages: KNOWN_STAGES.map(name => ({
        name,
        startTime: 0,
        endTime: null,
        duration: null
      })),
      totalDuration: null,
      success: false
    }
    return id
  }

  /** Mark a stage as started */
  stageStart(stage: string): void {
    if (!this.currentStartup) return
    const s = this.currentStartup.stages.find(st => st.name === stage)
    if (s) s.startTime = Date.now()
  }

  /** Mark a stage as completed */
  stageEnd(stage: string): void {
    if (!this.currentStartup) return
    const s = this.currentStartup.stages.find(st => st.name === stage)
    if (s && s.startTime > 0) {
      s.endTime = Date.now()
      s.duration = s.endTime - s.startTime
    }
  }

  /** Record a custom stage that wasn't in the initial list */
  recordCustomStage(name: string, duration: number): void {
    if (!this.currentStartup) return
    this.currentStartup.stages.push({
      name,
      startTime: 0,
      endTime: 0,
      duration
    })
  }

  /** Complete the startup sequence (success) */
  completeStartup(success: boolean = true, errorMessage?: string): StartupRecord | null {
    if (!this.currentStartup) return null

    // Close any unclosed stages
    for (const stage of this.currentStartup.stages) {
      if (stage.startTime > 0 && stage.endTime === null) {
        stage.endTime = Date.now()
        stage.duration = stage.endTime - stage.startTime
      }
    }

    // Total duration = sum of all stage durations
    const totalDuration = this.currentStartup.stages.reduce(
      (sum, s) => sum + (s.duration || 0), 0
    )

    this.currentStartup.totalDuration = totalDuration
    this.currentStartup.success = success
    if (errorMessage) this.currentStartup.errorMessage = errorMessage

    const record = { ...this.currentStartup }
    this.records.push(record)
    this.currentStartup = null
    return record
  }

  /** Get startup success rate */
  getStartupSuccessRate(): number {
    if (this.records.length === 0) return 1
    const successful = this.records.filter(r => r.success).length
    return successful / this.records.length
  }

  /** Get average startup time */
  getAverageStartupTime(type?: 'cold-start' | 'warm-start'): number {
    const filtered = type
      ? this.records.filter(r => r.type === type)
      : this.records
    if (filtered.length === 0) return 0
    const total = filtered.reduce((sum, r) => sum + (r.totalDuration || 0), 0)
    return total / filtered.length
  }

  /** Compute aggregated startup metrics */
  getMetrics(): StartupMetrics {
    const cold = this.records.filter(r => r.type === 'cold-start')
    const warm = this.records.filter(r => r.type === 'warm-start')

    // Stage averages across all startups
    const stageAverages: Record<string, number> = {}
    const stageDurations: Record<string, number[]> = {}

    for (const record of this.records) {
      for (const stage of record.stages) {
        if (stage.duration !== null && stage.duration > 0) {
          if (!stageDurations[stage.name]) stageDurations[stage.name] = []
          stageDurations[stage.name].push(stage.duration)
        }
      }
    }

    for (const [name, durations] of Object.entries(stageDurations)) {
      stageAverages[name] = durations.reduce((a, b) => a + b, 0) / durations.length
    }

    return {
      coldStartCount: cold.length,
      warmStartCount: warm.length,
      averageColdStartTime: this.getAverageStartupTime('cold-start'),
      averageWarmStartTime: this.getAverageStartupTime('warm-start'),
      startupSuccessRate: this.getStartupSuccessRate(),
      stageAverages,
      recentStartups: this.records.slice(-20)
    }
  }

  /** Export records for persistence */
  exportRecords(): StartupRecord[] {
    return [...this.records]
  }

  /** Import records from persistence */
  importRecords(records: StartupRecord[]): void {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000
    this.records = records.filter(r => r.timestamp >= cutoff)
  }

  /** Clear all data */
  clear(): void {
    this.records = []
    this.currentStartup = null
  }
}
