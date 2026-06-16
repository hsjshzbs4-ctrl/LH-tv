// src/telemetry/analyticsBatchQueue.ts — PB3-S2-2 Analytics Batch Queue
// 批量发送遥测事件，减少网络请求。只读使用 PB1 Telemetry，不修改。

export interface BatchConfig {
  maxSize: number
  flushIntervalMs: number
}

const DEFAULT_CONFIG: BatchConfig = {
  maxSize: 50,
  flushIntervalMs: 5000,
}

interface QueuedEvent {
  type: string
  timestamp: number
  data?: Record<string, unknown>
}

export class AnalyticsBatchQueue {
  private queue: QueuedEvent[] = []
  private config: BatchConfig
  private timer: ReturnType<typeof setInterval> | null = null
  private _flushCount = 0
  private _droppedCount = 0
  private _totalQueued = 0

  get size(): number { return this.queue.length }
  get flushCount(): number { return this._flushCount }
  get droppedCount(): number { return this._droppedCount }
  get totalQueued(): number { return this._totalQueued }

  constructor(config?: Partial<BatchConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.startTimer()
    this._bindUnload()
  }

  /** 入队单个事件 */
  enqueue(event: QueuedEvent): void {
    this._totalQueued++
    if (this.queue.length >= this.config.maxSize) {
      this._droppedCount++
      console.warn('[PB3-S2] Analytics queue full, dropping oldest')
      this.queue.shift()
    }
    this.queue.push(event)
    if (this.queue.length >= this.config.maxSize) {
      this.flush()
    }
  }

  /** 批量发送 */
  flush(): void {
    if (this.queue.length === 0) return
    const batch = this.queue.splice(0)
    this._flushCount++

    try {
      // 通过 PB1 telemetryService 发送（不修改其内部）
      const { getTelemetryService } = require('@/telemetry')
      const ts = getTelemetryService()
      for (const ev of batch) {
        ts.session.recordEvent({
          type: ev.type,
          timestamp: ev.timestamp,
          data: ev.data || {},
        })
      }
    } catch {
      // 静默失败，不丢失事件 — 放回队列
      this.queue.unshift(...batch)
    }
  }

  /** 强制清空 */
  forceFlush(): void { this.flush() }

  /** 获取统计信息 */
  getStats(): { size: number; flushCount: number; dropped: number; total: number } {
    return {
      size: this.queue.length,
      flushCount: this._flushCount,
      dropped: this._droppedCount,
      total: this._totalQueued,
    }
  }

  destroy(): void {
    this.flush()
    if (this.timer) { clearInterval(this.timer); this.timer = null }
  }

  private startTimer(): void {
    this.timer = setInterval(() => this.flush(), this.config.flushIntervalMs)
  }

  private _bindUnload(): void {
    if (typeof window === 'undefined') return
    window.addEventListener('beforeunload', () => this.flush())
  }
}

/** 全局单例 */
export const analyticsQueue = new AnalyticsBatchQueue()
