// modules/search-unified/infrastructure/services/InfrastructureDiagnostics.ts — CE8-C2
// Observability: dumps metrics, health, provider status for monitoring/debugging.

import type { SearchProviderRegistry } from './SearchProviderRegistry'
import type { SearchProviderMetrics, ProviderStats } from '../metrics/SearchProviderMetrics'
import type { SearchHealthMonitor, HealthStatus } from './SearchHealthMonitor'

export interface DiagnosticsSnapshot {
  readonly timestamp: number
  readonly providers: ProviderDiagnostic[]
  readonly health: HealthDiagnostic[]
  readonly metrics: MetricsDiagnostic
}

export interface ProviderDiagnostic {
  readonly providerId: string
  readonly available: boolean
}

export interface HealthDiagnostic {
  readonly providerId: string
  readonly status: HealthStatus
  readonly consecutiveFailures: number
}

export interface MetricsDiagnostic {
  readonly totalCalls: number
  readonly providerStats: Map<string, ProviderStats>
}

export class InfrastructureDiagnostics {
  constructor(
    private registry: SearchProviderRegistry,
    private metrics: SearchProviderMetrics,
    private healthMonitor: SearchHealthMonitor,
  ) {}

  /** Dump complete diagnostics snapshot. */
  dump(): DiagnosticsSnapshot {
    return {
      timestamp: Date.now(),
      providers: this.dumpProviders(),
      health: this.dumpHealth(),
      metrics: this.dumpMetrics(),
    }
  }

  /** Dump registered provider status. */
  dumpProviders(): ProviderDiagnostic[] {
    return this.registry.getAllProviders().map(p => ({
      providerId: p.providerId,
      available: p.isAvailable(),
    }))
  }

  /** Dump health status for all tracked providers. */
  dumpHealth(): HealthDiagnostic[] {
    return this.healthMonitor.getAllStatuses().map(s => ({
      providerId: s.providerId,
      status: s.status,
      consecutiveFailures: s.consecutiveFailures,
    }))
  }

  /** Dump aggregated metrics. */
  dumpMetrics(): MetricsDiagnostic {
    return {
      totalCalls: this.metrics.totalCalls,
      providerStats: this.metrics.getAllStats(),
    }
  }
}
