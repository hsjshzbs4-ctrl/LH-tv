// modules/recommendation/runtime/metrics/RuntimeMetrics.ts — CE9-C
// Runtime performance metrics collection.

export interface RuntimeMetricsSnapshot {
  readonly timestamp: number
  readonly providerLatency: Record<string, number>
  readonly cacheHitRatio: number
  readonly feedGenerationTimeMs: number
  readonly experimentUsage: Record<string, number>
  readonly errorRate: number
  readonly requestsTotal: number
  readonly requestsPerMinute: number
}

export class RuntimeMetrics {
  private requestCount = 0
  private cacheHits = 0
  private errorCount = 0
  private generationTimes: number[] = []
  private providerLatencies: Map<string, number[]> = new Map()
  private experimentCounts: Map<string, number> = new Map()
  private startTime = Date.now()

  /** Record a recommendation request */
  recordRequest(cacheHit: boolean, generationTimeMs: number): void {
    this.requestCount++
    if (cacheHit) this.cacheHits++
    if (generationTimeMs > 5000) this.errorCount++ // >5s = error
    this.generationTimes.push(generationTimeMs)

    // Keep last 1000 entries
    if (this.generationTimes.length > 1000) {
      this.generationTimes.shift()
    }
  }

  /** Record a provider's latency */
  recordProviderLatency(providerName: string, latencyMs: number): void {
    const latencies = this.providerLatencies.get(providerName) ?? []
    latencies.push(latencyMs)
    if (latencies.length > 500) latencies.shift()
    this.providerLatencies.set(providerName, latencies)
  }

  /** Record experiment usage */
  recordExperiment(experimentId: string): void {
    this.experimentCounts.set(
      experimentId,
      (this.experimentCounts.get(experimentId) ?? 0) + 1,
    )
  }

  /** Get current metrics snapshot */
  snapshot(): RuntimeMetricsSnapshot {
    const elapsedMs = Date.now() - this.startTime
    const elapsedMin = elapsedMs / 60000
    const requestsPerMinute = elapsedMin > 0
      ? Math.round(this.requestCount / elapsedMin)
      : 0

    const avgProviderLatency: Record<string, number> = {}
    for (const [name, latencies] of this.providerLatencies) {
      avgProviderLatency[name] = latencies.length > 0
        ? latencies.reduce((s, v) => s + v, 0) / latencies.length
        : 0
    }

    const avgGenerationTime = this.generationTimes.length > 0
      ? this.generationTimes.reduce((s, v) => s + v, 0) / this.generationTimes.length
      : 0

    const cacheHitRatio = this.requestCount > 0
      ? this.cacheHits / this.requestCount
      : 0

    const errorRate = this.requestCount > 0
      ? this.errorCount / this.requestCount
      : 0

    const experimentUsage: Record<string, number> = {}
    for (const [id, count] of this.experimentCounts) {
      experimentUsage[id] = count
    }

    return {
      timestamp: Date.now(),
      providerLatency: avgProviderLatency,
      cacheHitRatio,
      feedGenerationTimeMs: avgGenerationTime,
      experimentUsage,
      errorRate,
      requestsTotal: this.requestCount,
      requestsPerMinute,
    }
  }

  /** Reset all metrics */
  reset(): void {
    this.requestCount = 0
    this.cacheHits = 0
    this.errorCount = 0
    this.generationTimes = []
    this.providerLatencies.clear()
    this.experimentCounts.clear()
    this.startTime = Date.now()
  }
}
