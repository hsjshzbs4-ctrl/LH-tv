// modules/search-unified/infrastructure/services/SearchAnalyticsRuntime.ts — CE8-C2
// Collects, buffers, and dispatches analytics events.
// Never blocks search execution — failures are silently ignored.

import type { SearchEvent, ClickEvent, PlayEvent } from '../../application/ports/ISearchAnalyticsPort'
import type { SearchInfrastructureConfig } from './SearchInfrastructureConfig'
import { DEFAULT_CONFIG } from './SearchInfrastructureConfig'

export type AnalyticsEventType = 'search' | 'click' | 'play'

export interface BufferedEvent {
  readonly type: AnalyticsEventType
  readonly data: SearchEvent | ClickEvent | PlayEvent
  readonly bufferedAt: number
}

export class SearchAnalyticsRuntime {
  private buffer: BufferedEvent[] = []
  private config: SearchInfrastructureConfig
  private flushTimer: ReturnType<typeof setTimeout> | null = null
  private listeners: Array<(events: BufferedEvent[]) => void> = []

  constructor(config?: Partial<SearchInfrastructureConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /** Queue a search event for later dispatch. Never throws. */
  recordSearch(event: SearchEvent): void {
    this._enqueue('search', event)
  }

  /** Queue a click event. Never throws. */
  recordClick(event: ClickEvent): void {
    this._enqueue('click', event)
  }

  /** Queue a play event. Never throws. */
  recordPlay(event: PlayEvent): void {
    this._enqueue('play', event)
  }

  /** Register a flush listener (e.g., to send to backend). */
  onFlush(listener: (events: BufferedEvent[]) => void): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  /** Force immediate flush of buffered events. */
  flush(): void {
    if (this.buffer.length === 0) return

    const events = [...this.buffer]
    this.buffer = []

    for (const listener of this.listeners) {
      try {
        listener(events)
      } catch {
        // Listener failures are ignored
      }
    }
  }

  /** Get current buffer size. */
  get bufferSize(): number {
    return this.buffer.length
  }

  /** Start auto-flush timer. */
  startAutoFlush(): void {
    if (this.flushTimer) return
    this.flushTimer = setInterval(() => this.flush(), this.config.analyticsFlushIntervalMs)
  }

  /** Stop auto-flush timer. */
  stopAutoFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = null
    }
  }

  /** Destroy — flush remaining and stop. */
  destroy(): void {
    this.stopAutoFlush()
    this.flush()
  }

  private _enqueue(type: AnalyticsEventType, data: SearchEvent | ClickEvent | PlayEvent): void {
    try {
      this.buffer.push({ type, data, bufferedAt: Date.now() })

      if (this.buffer.length >= this.config.analyticsMaxBufferSize) {
        this.flush()
      }
    } catch {
      // Analytics failure must never throw
    }
  }
}
