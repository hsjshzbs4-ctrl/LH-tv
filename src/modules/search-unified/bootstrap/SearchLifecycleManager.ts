// modules/search-unified/bootstrap/SearchLifecycleManager.ts — CE8-C4
// Module lifecycle states. Tracks health from multiple sources.

export type ModuleState =
  | 'uninitialized'
  | 'initializing'
  | 'ready'
  | 'degraded'
  | 'shutting_down'
  | 'disposed'

export interface ModuleHealth {
  readonly state: ModuleState
  readonly providersHealthy: boolean
  readonly analyticsHealthy: boolean
  readonly storesHealthy: boolean
  readonly runtimeHealthy: boolean
  readonly details: string[]
}

export class SearchLifecycleManager {
  private state: ModuleState = 'uninitialized'
  private healthDetails: string[] = []

  transition(newState: ModuleState): void {
    this.state = newState
  }

  getState(): ModuleState { return this.state }

  /** Evaluate overall health from subsystem statuses. */
  evaluateHealth(
    providersCount: number,
    providersAvailable: number,
    analyticsBufferSize: number,
    storesLoaded: boolean,
  ): ModuleHealth {
    const details: string[] = []
    let degraded = false

    const providersHealthy = providersCount > 0 && providersAvailable > 0
    if (!providersHealthy) {
      details.push(`Providers: ${providersAvailable}/${providersCount} available`)
      degraded = true
    }

    const analyticsHealthy = analyticsBufferSize < 500
    if (!analyticsHealthy) {
      details.push(`Analytics buffer: ${analyticsBufferSize} (high)`)
    }

    const storesHealthy = storesLoaded
    if (!storesHealthy) {
      details.push('Stores: not loaded')
      degraded = true
    }

    const runtimeHealthy = providersAvailable > 0
    if (!runtimeHealthy) {
      details.push('Runtime: no available providers')
      degraded = true
    }

    if (degraded && this.state === 'ready') {
      this.state = 'degraded'
    } else if (!degraded && this.state === 'degraded') {
      this.state = 'ready'
    }

    this.healthDetails = details

    return {
      state: this.state,
      providersHealthy,
      analyticsHealthy,
      storesHealthy,
      runtimeHealthy,
      details,
    }
  }

  isOperational(): boolean {
    return this.state === 'ready' || this.state === 'degraded'
  }
}
