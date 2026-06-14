// modules/search-unified/infrastructure/metrics/SearchProviderMetrics.ts — CE8-C1
// Tracks per-provider search metrics: latency, errors, success rate, timeouts.
// Read-only metrics — no side effects, no persistence.

export interface ProviderMetric {
  readonly providerId: string
  readonly durationMs: number
  readonly success: boolean
  readonly timestamp: number
}

export interface ProviderStats {
  readonly totalCalls: number
  readonly successCount: number
  readonly errorCount: number
  readonly timeoutCount: number
  readonly successRate: number
  readonly averageLatencyMs: number
  readonly lastCallAt: number | null
}

export class SearchProviderMetrics {
  private metrics: ProviderMetric[] = []
  private providerTimeouts: Map<string, number> = new Map()

  /** Record a successful search call. */
  recordSuccess(providerId: string, durationMs: number): void {
    this.metrics.push({
      providerId,
      durationMs: Math.round(durationMs),
      success: true,
      timestamp: Date.now(),
    })
  }

  /** Record a failed search call. */
  recordError(providerId: string): void {
    this.metrics.push({
      providerId,
      durationMs: 0,
      success: false,
      timestamp: Date.now(),
    })
  }

  /** Record a timeout. */
  recordTimeout(providerId: string): void {
    this.providerTimeouts.set(
      providerId,
      (this.providerTimeouts.get(providerId) ?? 0) + 1,
    )
    this.recordError(providerId)
  }

  /** Get stats for a specific provider. */
  getProviderStats(providerId: string): ProviderStats {
    const providerMetrics = this.metrics.filter(m => m.providerId === providerId)
    const totalCalls = providerMetrics.length
    const successCount = providerMetrics.filter(m => m.success).length
    const errorCount = totalCalls - successCount
    const successLatencies = providerMetrics
      .filter(m => m.success)
      .map(m => m.durationMs)

    return {
      totalCalls,
      successCount,
      errorCount,
      timeoutCount: this.providerTimeouts.get(providerId) ?? 0,
      successRate: totalCalls > 0 ? Math.round((successCount / totalCalls) * 100) / 100 : 0,
      averageLatencyMs: successLatencies.length > 0
        ? Math.round(successLatencies.reduce((s, v) => s + v, 0) / successLatencies.length)
        : 0,
      lastCallAt: providerMetrics.length > 0
        ? Math.max(...providerMetrics.map(m => m.timestamp))
        : null,
    }
  }

  /** Get stats for all providers. */
  getAllStats(): Map<string, ProviderStats> {
    const providers = new Set(this.metrics.map(m => m.providerId))
    return new Map([...providers].map(p => [p, this.getProviderStats(p)]))
  }

  /** Total metrics recorded. */
  get totalCalls(): number {
    return this.metrics.length
  }

  /** Clear all metrics. */
  clear(): void {
    this.metrics = []
    this.providerTimeouts.clear()
  }
}
