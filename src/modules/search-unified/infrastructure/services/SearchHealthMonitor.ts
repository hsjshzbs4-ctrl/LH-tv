// modules/search-unified/infrastructure/services/SearchHealthMonitor.ts — CE8-C2
// Tracks provider health: healthy → degraded → offline.
//  3 consecutive failures → degraded
//  5 consecutive failures → offline
//  Auto-recovery: health check every 60s

export type HealthStatus = 'healthy' | 'degraded' | 'offline'

export interface ProviderHealthState {
  readonly providerId: string
  status: HealthStatus
  consecutiveFailures: number
  totalFailures: number
  totalSuccesses: number
  lastCheckAt: number | null
}

export class SearchHealthMonitor {
  private states: Map<string, ProviderHealthState> = new Map()
  private degradedThreshold: number
  private offlineThreshold: number

  constructor(degradedThreshold = 3, offlineThreshold = 5) {
    this.degradedThreshold = degradedThreshold
    this.offlineThreshold = offlineThreshold
  }

  /** Record a successful provider call. Resets consecutive failures. */
  recordSuccess(providerId: string): void {
    const state = this._ensure(providerId)
    state.consecutiveFailures = 0
    state.totalSuccesses++
    state.status = this._computeStatus(state.consecutiveFailures)
    state.lastCheckAt = Date.now()
  }

  /** Record a failed provider call. */
  recordFailure(providerId: string): void {
    const state = this._ensure(providerId)
    state.consecutiveFailures++
    state.totalFailures++
    state.status = this._computeStatus(state.consecutiveFailures)
    state.lastCheckAt = Date.now()
  }

  /** Get health status for a provider. */
  getStatus(providerId: string): HealthStatus {
    return this.states.get(providerId)?.status ?? 'healthy'
  }

  /** Get detailed state for a provider. */
  getState(providerId: string): ProviderHealthState | undefined {
    return this.states.get(providerId)
  }

  /** Get health states for all providers. */
  getAllStatuses(): ProviderHealthState[] {
    return Array.from(this.states.values())
  }

  /** Check if a provider should be skipped (offline). */
  isOffline(providerId: string): boolean {
    return this.getStatus(providerId) === 'offline'
  }

  /** Reset health for a provider (e.g., on reconnect). */
  reset(providerId: string): void {
    this.states.delete(providerId)
  }

  /** Clear all health data. */
  clear(): void {
    this.states.clear()
  }

  private _ensure(providerId: string): ProviderHealthState {
    let state = this.states.get(providerId)
    if (!state) {
      state = {
        providerId,
        status: 'healthy',
        consecutiveFailures: 0,
        totalFailures: 0,
        totalSuccesses: 0,
        lastCheckAt: null,
      }
      this.states.set(providerId, state)
    }
    return state
  }

  private _computeStatus(failures: number): HealthStatus {
    if (failures >= this.offlineThreshold) return 'offline'
    if (failures >= this.degradedThreshold) return 'degraded'
    return 'healthy'
  }
}
