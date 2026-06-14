// modules/search-unified/bootstrap/SearchBootstrapper.ts — CE8-C4
// Startup sequence: Config → Stores → Analytics → Providers → Runtime → Use Cases → Ready.
// Non-critical failures: warning only. Critical failures: startup failure.

import type { SearchDependencyContainer } from './SearchDependencyContainer'
import type { SearchLifecycleManager } from './SearchLifecycleManager'
import type { SearchModuleConfig } from './SearchModuleConfiguration'

export interface BootstrapResult {
  readonly success: boolean
  readonly warnings: string[]
  readonly errors: string[]
}

export class SearchBootstrapper {
  constructor(
    private container: SearchDependencyContainer,
    private lifecycle: SearchLifecycleManager,
    private config: SearchModuleConfig,
  ) {}

  async bootstrap(): Promise<BootstrapResult> {
    const warnings: string[] = []
    const errors: string[] = []

    this.lifecycle.transition('initializing')

    // 1. Load stores
    try {
      if (this.config.history.enabled) {
        await this.container.analyticsStore.load()
        await this.container.historyStore.load()
        await this.container.trendStore.load()
        await this.container.providerUsageStore.load()
        await this.container.suggestionUsageStore.load()
      }
    } catch (err) {
      warnings.push(`Store loading failed: ${err}`)
    }

    // 2. Start analytics
    try {
      if (this.config.features.analytics) {
        this.container.analyticsRuntime.startAutoFlush()
      }
    } catch (err) {
      warnings.push(`Analytics startup failed: ${err}`)
    }

    // 3. Providers already registered via container.registerProvider()

    // 4. Verify providers
    const availableProviders = this.container.providerRegistry.getAvailableProviders()
    if (availableProviders.length === 0) {
      warnings.push('No search providers available — search will return empty results')
    }

    // 5. Runtime ready (already wired)
    // 6. Use cases ready (already wired)

    // 7. Evaluate health
    this.lifecycle.evaluateHealth(
      this.container.providerRegistry.providerCount,
      availableProviders.length,
      this.container.analyticsRuntime.bufferSize,
      true,
    )

    this.lifecycle.transition('ready')

    return {
      success: errors.length === 0,
      warnings,
      errors,
    }
  }
}
