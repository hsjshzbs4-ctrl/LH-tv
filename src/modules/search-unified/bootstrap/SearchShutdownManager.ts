// modules/search-unified/bootstrap/SearchShutdownManager.ts — CE8-C4
// Graceful shutdown: flush analytics, reports, pending buffers. Max 5 seconds.

import type { SearchDependencyContainer } from './SearchDependencyContainer'
import type { SearchLifecycleManager } from './SearchLifecycleManager'

const MAX_SHUTDOWN_MS = 5000

export interface ShutdownResult {
  readonly completed: boolean
  readonly flushedAnalytics: boolean
  readonly flushedBuffer: boolean
}

export class SearchShutdownManager {
  constructor(
    private container: SearchDependencyContainer,
    private lifecycle: SearchLifecycleManager,
  ) {}

  async shutdown(): Promise<ShutdownResult> {
    this.lifecycle.transition('shutting_down')

    let flushedAnalytics = false
    let flushedBuffer = false

    try {
      // Flush with timeout
      await Promise.race([
        (async () => {
          this.container.analyticsRuntime.flush()
          flushedBuffer = true
          this.container.analyticsRuntime.destroy()
          flushedAnalytics = true
        })(),
        new Promise(r => setTimeout(r, MAX_SHUTDOWN_MS)),
      ])
    } catch {
      // Force shutdown
    }

    this.lifecycle.transition('disposed')

    return {
      completed: flushedAnalytics && flushedBuffer,
      flushedAnalytics,
      flushedBuffer,
    }
  }
}
