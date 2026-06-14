// modules/search-unified/bootstrap/UnifiedSearchModule.ts — CE8-C4
// Module root. Creates the complete unified search wiring.
// Public API: initialize() → getFacade() → dispose()

import type { SearchModuleConfig } from './SearchModuleConfiguration'
import { PRODUCTION_CONFIG } from './SearchModuleConfiguration'
import { SearchDependencyContainer } from './SearchDependencyContainer'
import { SearchBootstrapper } from './SearchBootstrapper'
import { SearchShutdownManager } from './SearchShutdownManager'
import { SearchLifecycleManager } from './SearchLifecycleManager'
import { SearchModuleDiagnostics } from './SearchModuleDiagnostics'
import { SearchReadinessValidator } from './SearchReadinessValidator'
import { SearchFeatureFlagsManager } from './SearchFeatureFlags'
import { UnifiedSearchFacade } from './UnifiedSearchFacade'
import type { IStorageAdapter } from '../infrastructure/storage/stores/SearchAnalyticsStore'

export class UnifiedSearchModule {
  private container!: SearchDependencyContainer
  private lifecycle!: SearchLifecycleManager
  private diagnostics!: SearchModuleDiagnostics
  private readiness!: SearchReadinessValidator
  private flags!: SearchFeatureFlagsManager
  private facade!: UnifiedSearchFacade
  private bootstrapper!: SearchBootstrapper
  private shutdownManager!: SearchShutdownManager
  private _initialized = false

  constructor(
    private config: SearchModuleConfig = PRODUCTION_CONFIG,
    private storageAdapter?: IStorageAdapter,
  ) {}

  /** Initialize the module. Must be called before getFacade(). */
  async initialize(): Promise<void> {
    if (this._initialized) return

    const storage = this.storageAdapter ?? this._createDefaultStorage()

    // Build dependency tree
    this.container = new SearchDependencyContainer(this.config, storage)
    this.lifecycle = new SearchLifecycleManager()
    this.flags = new SearchFeatureFlagsManager(this.config.features)
    this.diagnostics = new SearchModuleDiagnostics(this.container, this.lifecycle, this.config)
    this.readiness = new SearchReadinessValidator(this.container)
    this.facade = new UnifiedSearchFacade(this.container, this.diagnostics, this.readiness, this.flags)
    this.bootstrapper = new SearchBootstrapper(this.container, this.lifecycle, this.config)
    this.shutdownManager = new SearchShutdownManager(this.container, this.lifecycle)

    // Execute startup
    const result = await this.bootstrapper.bootstrap()
    if (!result.success && result.errors.length > 0) {
      throw new Error(`Module startup failed: ${result.errors.join('; ')}`)
    }

    this._initialized = true
  }

  /** Get the unified search facade. */
  getFacade(): UnifiedSearchFacade {
    if (!this._initialized) throw new Error('Module not initialized. Call initialize() first.')
    return this.facade
  }

  /** Get module status. */
  getStatus() {
    return this.lifecycle.getState()
  }

  /** Graceful shutdown. */
  async dispose(): Promise<void> {
    if (!this._initialized) return
    await this.shutdownManager.shutdown()
    this._initialized = false
  }

  get isInitialized(): boolean { return this._initialized }

  private _createDefaultStorage(): IStorageAdapter {
    // Default: in-memory (tests / non-Electron)
    let data: unknown = []
    return {
      load: async () => data,
      save: async (d) => { data = d },
      clear: async () => { data = [] },
    }
  }
}
