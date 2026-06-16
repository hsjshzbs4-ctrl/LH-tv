// src/player/telemetry/ProductionTelemetryManager.ts — PB3-S3-6 Production Telemetry
// 只读使用 PB1 Telemetry。提供 sampling + rate limiting。

export interface TelemetryConfig {
  sampleRate: number       // 0-1
  rateLimitPerMin: number
  privacySafe: boolean
}

const DEFAULT_CONFIG: TelemetryConfig = {
  sampleRate: 1,
  rateLimitPerMin: 120,
  privacySafe: true,
}

export interface PerformanceMetric {
  name: string
  value: number
  unit: string
  timestamp: number
}

export class ProductionTelemetryManager {
  private config: TelemetryConfig
  private metrics: PerformanceMetric[] = []
  private eventCounts = new Map<string, number>()
  private windowStart = Date.now()
  private _startupTime = 0

  get startupTime(): number { return this._startupTime }

  constructor(config?: Partial<TelemetryConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this._startupTime = performance.now()
  }

  /** 记录性能指标（带采样） */
  record(name: string, value: number, unit: string = 'ms'): void {
    if (Math.random() > this.config.sampleRate) return
    if (!this._checkRateLimit(name)) return

    this.metrics.push({ name, value, unit, timestamp: Date.now() })
    if (this.metrics.length > 200) this.metrics = this.metrics.slice(-200)
  }

  /** 记录启动时间 */
  recordStartup(): void {
    this._startupTime = performance.now()
    this.record('startup_time', this._startupTime, 'ms')
  }

  /** 记录剧集加载时间 */
  recordEpisodeLoad(durationMs: number): void {
    this.record('episode_load_time', durationMs, 'ms')
  }

  /** 记录缓冲事件 */
  recordBufferEvent(): void { this.record('buffer_event', 1, 'count') }

  /** 记录恢复事件 */
  recordRecovery(): void { this.record('recovery_event', 1, 'count') }

  /** 记录 crash */
  recordCrash(): void { this.record('crash_event', 1, 'count') }

  /** 记录内存告警 */
  recordMemoryWarning(heapMB: number): void {
    this.record('memory_warning', heapMB, 'MB')
  }

  /** 记录网络告警 */
  recordNetworkWarning(): void { this.record('network_warning', 1, 'count') }

  /** 获取指标摘要 */
  getSummary(): { events: number; metrics: number; startupTime: number } {
    return {
      events: Array.from(this.eventCounts.values()).reduce((a, b) => a + b, 0),
      metrics: this.metrics.length,
      startupTime: this._startupTime,
    }
  }

  /** 获取指标列表 */
  getMetrics(name?: string): PerformanceMetric[] {
    return name ? this.metrics.filter(m => m.name === name) : this.metrics
  }

  destroy(): void { this.metrics = []; this.eventCounts.clear() }

  private _checkRateLimit(name: string): boolean {
    const now = Date.now()
    if (now - this.windowStart > 60000) {
      this.eventCounts.clear()
      this.windowStart = now
    }
    const count = (this.eventCounts.get(name) || 0) + 1
    this.eventCounts.set(name, count)
    return count <= this.config.rateLimitPerMin
  }
}
