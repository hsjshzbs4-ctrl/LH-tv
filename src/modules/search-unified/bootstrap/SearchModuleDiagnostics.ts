// modules/search-unified/bootstrap/SearchModuleDiagnostics.ts — CE8-C4
// Unified diagnostics: module state, providers, analytics, health, config.

import type { SearchDependencyContainer } from './SearchDependencyContainer'
import type { SearchModuleConfig } from './SearchModuleConfiguration'
import type { SearchLifecycleManager, ModuleHealth } from './SearchLifecycleManager'

export interface ModuleDiagnosticSnapshot {
  readonly timestamp: number
  readonly state: string
  readonly health: ModuleHealth
  readonly providers: Array<{ id: string; available: boolean }>
  readonly analytics: { bufferSize: number; totalCalls: number }
  readonly config: SearchModuleConfig
}

export class SearchModuleDiagnostics {
  constructor(
    private container: SearchDependencyContainer,
    private lifecycle: SearchLifecycleManager,
    private config: SearchModuleConfig,
  ) {}

  dumpModuleState(): ModuleDiagnosticSnapshot {
    const health = this.lifecycle.evaluateHealth(
      this.container.providerRegistry.providerCount,
      this.container.providerRegistry.getAvailableProviders().length,
      this.container.analyticsRuntime.bufferSize,
      true,
    )

    return {
      timestamp: Date.now(),
      state: this.lifecycle.getState(),
      health,
      providers: this.dumpProviders(),
      analytics: this.dumpAnalytics(),
      config: this.dumpConfiguration(),
    }
  }

  dumpProviders(): Array<{ id: string; available: boolean }> {
    return this.container.providerRegistry.getAllProviders().map(p => ({
      id: p.providerId,
      available: p.isAvailable(),
    }))
  }

  dumpAnalytics(): { bufferSize: number; totalCalls: number } {
    return {
      bufferSize: this.container.analyticsRuntime.bufferSize,
      totalCalls: this.container.metrics.totalCalls,
    }
  }

  dumpHealth(): ModuleHealth {
    return this.lifecycle.evaluateHealth(
      this.container.providerRegistry.providerCount,
      this.container.providerRegistry.getAvailableProviders().length,
      this.container.analyticsRuntime.bufferSize,
      true,
    )
  }

  dumpConfiguration(): SearchModuleConfig {
    return { ...this.config }
  }
}
