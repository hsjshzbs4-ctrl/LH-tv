// modules/recommendation/runtime/telemetry/TelemetryCollector.ts — CE9-C
// Collects and buffers recommendation telemetry events (Req 9).
// 7 event types: impression, click, play, favorite, dismiss, hide, complete.

export type TelemetryEventType =
  | 'impression'
  | 'click'
  | 'play'
  | 'favorite'
  | 'dismiss'
  | 'hide'
  | 'complete'

export interface TelemetryEvent {
  readonly type: TelemetryEventType
  readonly feedId: string
  readonly sectionId?: string
  readonly mediaId?: string
  readonly position?: number
  readonly timestamp: number
  readonly metadata?: Record<string, unknown>
}

export type FlushHandler = (events: TelemetryEvent[]) => Promise<void>

export class TelemetryCollector {
  private buffer: TelemetryEvent[] = []
  private maxBufferSize: number
  private flushIntervalMs: number
  private handlers: FlushHandler[] = []
  private timer: ReturnType<typeof setInterval> | null = null
  private totalCollected = 0
  private totalFlushed = 0
  private flushErrors = 0

  constructor(maxBufferSize: number = 100, flushIntervalMs: number = 30_000) {
    this.maxBufferSize = maxBufferSize
    this.flushIntervalMs = flushIntervalMs
  }

  /** Register a flush handler */
  onFlush(handler: FlushHandler): void {
    this.handlers.push(handler)
  }

  /** Start auto-flush timer */
  start(): void {
    if (this.timer) return
    this.timer = setInterval(() => this.flush(), this.flushIntervalMs)
  }

  /** Stop auto-flush timer */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  /** Collect a telemetry event */
  collect(event: TelemetryEvent): void {
    this.buffer.push(event)
    this.totalCollected++

    if (this.buffer.length >= this.maxBufferSize) {
      this.flush().catch(() => {})
    }
  }

  /** Force flush buffered events to handlers */
  async flush(): Promise<void> {
    if (this.buffer.length === 0) return

    const batch = this.buffer.splice(0)
    let success = false

    for (const handler of this.handlers) {
      try {
        await handler([...batch])
        success = true
      } catch {
        this.flushErrors++
      }
    }

    if (success) {
      this.totalFlushed += batch.length
    } else {
      // Re-queue at most 10 events on failure
      this.buffer.unshift(...batch.slice(0, 10))
    }
  }

  /** Get collector statistics */
  getStats(): {
    bufferSize: number
    totalCollected: number
    totalFlushed: number
    flushErrors: number
  } {
    return {
      bufferSize: this.buffer.length,
      totalCollected: this.totalCollected,
      totalFlushed: this.totalFlushed,
      flushErrors: this.flushErrors,
    }
  }

  /** Convenience methods for each event type */
  impression(feedId: string, sectionId: string, items: string[]): void {
    this.collect({
      type: 'impression',
      feedId,
      sectionId,
      timestamp: Date.now(),
      metadata: { itemCount: items.length, items },
    })
  }

  click(feedId: string, sectionId: string, mediaId: string, position: number): void {
    this.collect({ type: 'click', feedId, sectionId, mediaId, position, timestamp: Date.now() })
  }

  play(feedId: string, mediaId: string, sourceId: string): void {
    this.collect({ type: 'play', feedId, mediaId, timestamp: Date.now(), metadata: { sourceId } })
  }

  favorite(feedId: string, mediaId: string): void {
    this.collect({ type: 'favorite', feedId, mediaId, timestamp: Date.now() })
  }

  dismiss(feedId: string, sectionId: string, mediaId: string, reason: string): void {
    this.collect({ type: 'dismiss', feedId, sectionId, mediaId, timestamp: Date.now(), metadata: { reason } })
  }

  hide(feedId: string, sectionId: string): void {
    this.collect({ type: 'hide', feedId, sectionId, timestamp: Date.now() })
  }

  complete(feedId: string, mediaId: string, watchedDuration: number, totalDuration: number): void {
    this.collect({
      type: 'complete', feedId, mediaId, timestamp: Date.now(),
      metadata: { watchedDuration, totalDuration },
    })
  }
}
