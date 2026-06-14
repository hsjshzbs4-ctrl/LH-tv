// modules/recommendation/runtime/health/RuntimeHealthService.ts — CE9-C
// Runtime health monitoring. Tracks provider status, cache, and overall system health.

import type { IRecommendationProvider, EngineHealth } from '../../domain/contracts/IRecommendationProvider'
import type { RuntimeMetricsSnapshot } from '../metrics/RuntimeMetrics'

export interface RuntimeHealthSnapshot {
  readonly timestamp: number
  readonly status: 'healthy' | 'degraded' | 'unhealthy'
  readonly engineHealth: Record<string, EngineHealth>
  readonly cacheSize: number
  readonly metrics: RuntimeMetricsSnapshot | null
}

export class RuntimeHealthService {
  private engines: Map<string, IRecommendationProvider> = new Map()
  private cacheSizeProvider?: () => number
  private metricsProvider?: () => RuntimeMetricsSnapshot

  /** Register an engine for health monitoring */
  registerEngine(engine: IRecommendationProvider): void {
    this.engines.set(engine.name, engine)
  }

  /** Set cache size provider */
  setCacheSizeProvider(provider: () => number): void {
    this.cacheSizeProvider = provider
  }

  /** Set metrics provider */
  setMetricsProvider(provider: () => RuntimeMetricsSnapshot): void {
    this.metricsProvider = provider
  }

  /** Get current runtime health snapshot */
  getHealth(): RuntimeHealthSnapshot {
    const engineHealth: Record<string, EngineHealth> = {}
    let degradedCount = 0
    let unhealthyCount = 0

    for (const engine of this.engines.values()) {
      const health = engine.healthCheck()
      engineHealth[engine.name] = health

      if (health.state === 'degraded') degradedCount++
      if (health.state === 'disposed' || health.consecutiveErrors > 5) unhealthyCount++
    }

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    if (unhealthyCount > this.engines.size / 3) {
      status = 'unhealthy'
    } else if (degradedCount > 0 || unhealthyCount > 0) {
      status = 'degraded'
    }

    return {
      timestamp: Date.now(),
      status,
      engineHealth,
      cacheSize: this.cacheSizeProvider?.() ?? 0,
      metrics: this.metricsProvider?.() ?? null,
    }
  }

  /** Quick health check — return true if system is operational */
  isOperational(): boolean {
    return this.getHealth().status !== 'unhealthy'
  }
}
