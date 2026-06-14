// tests/unit/search-unified/bootstrap-integration.spec.ts — CE8-C4 Integration tests

import { describe, it, expect, beforeEach } from 'vitest'
import { UnifiedSearchModule } from '@/modules/search-unified/bootstrap/UnifiedSearchModule'
import { TEST_CONFIG } from '@/modules/search-unified/bootstrap/SearchModuleConfiguration'
import { SearchLifecycleManager } from '@/modules/search-unified/bootstrap/SearchLifecycleManager'
import { SearchDependencyContainer } from '@/modules/search-unified/bootstrap/SearchDependencyContainer'
import { SearchBootstrapper } from '@/modules/search-unified/bootstrap/SearchBootstrapper'
import { SearchShutdownManager } from '@/modules/search-unified/bootstrap/SearchShutdownManager'
import { SearchReadinessValidator } from '@/modules/search-unified/bootstrap/SearchReadinessValidator'
import { SearchFeatureFlagsManager } from '@/modules/search-unified/bootstrap/SearchFeatureFlags'
import { SearchModuleDiagnostics } from '@/modules/search-unified/bootstrap/SearchModuleDiagnostics'
import type { ISearchProviderPort } from '@/modules/search-unified/application/ports/ISearchProviderPort'
import type { SearchDocument } from '@/modules/search-unified/domain/contracts/ISearchProvider'
import { SearchQuery } from '@/modules/search-unified/domain/value-objects/SearchQuery'

class MockStorage { private d: unknown = []; async load() { return this.d }; async save(d: unknown) { this.d = d }; async clear() { this.d = [] } }

function mockProvider(id: string): ISearchProviderPort {
  return { providerId: id, isAvailable: () => true, search: async (_q: SearchQuery): Promise<SearchDocument[]> => [] }
}

describe('Bootstrap Integration', () => {
  // ─── Lifecycle ───

  it('should transition through lifecycle states', () => {
    const lifecycle = new SearchLifecycleManager()
    expect(lifecycle.getState()).toBe('uninitialized')

    lifecycle.transition('initializing')
    expect(lifecycle.getState()).toBe('initializing')

    lifecycle.transition('ready')
    expect(lifecycle.getState()).toBe('ready')
    expect(lifecycle.isOperational()).toBe(true)
  })

  it('should detect degraded state', () => {
    const lifecycle = new SearchLifecycleManager()
    lifecycle.transition('ready')
    const health = lifecycle.evaluateHealth(3, 1, 0, true)
    expect(health.providersHealthy).toBe(true) // 1/3 available still healthy
    expect(health.runtimeHealthy).toBe(true)
  })

  it('should detect unhealthy when no providers', () => {
    const lifecycle = new SearchLifecycleManager()
    const health = lifecycle.evaluateHealth(0, 0, 0, true)
    expect(health.providersHealthy).toBe(false)
  })

  // ─── Dependency Container ───

  it('should wire all dependencies', () => {
    const config = { ...TEST_CONFIG }
    const container = new SearchDependencyContainer(config, new MockStorage() as any)
    expect(container.providerRegistry).toBeDefined()
    expect(container.runtime).toBeDefined()
    expect(container.analyticsRuntime).toBeDefined()
    expect(container.searchUseCase).toBeDefined()
    expect(container.suggestionsUseCase).toBeDefined()
  })

  it('should register providers', () => {
    const container = new SearchDependencyContainer(TEST_CONFIG, new MockStorage() as any)
    container.registerProvider(mockProvider('tmdb'))
    expect(container.providerRegistry.providerCount).toBe(1)
  })

  // ─── Bootstrapper ───

  it('should bootstrap successfully', async () => {
    const container = new SearchDependencyContainer(TEST_CONFIG, new MockStorage() as any)
    container.registerProvider(mockProvider('tmdb'))
    const lifecycle = new SearchLifecycleManager()
    const bootstrapper = new SearchBootstrapper(container, lifecycle, TEST_CONFIG)

    const result = await bootstrapper.bootstrap()
    expect(result.success).toBe(true)
    expect(lifecycle.getState()).toBe('ready')
  })

  // ─── Shutdown ───

  it('should shutdown gracefully', async () => {
    const container = new SearchDependencyContainer(TEST_CONFIG, new MockStorage() as any)
    const lifecycle = new SearchLifecycleManager()
    const shutdown = new SearchShutdownManager(container, lifecycle)

    const result = await shutdown.shutdown()
    expect(result.completed).toBe(true)
    expect(lifecycle.getState()).toBe('disposed')
  })

  // ─── Readiness ───

  it('should validate readiness', () => {
    const container = new SearchDependencyContainer(TEST_CONFIG, new MockStorage() as any)
    container.registerProvider(mockProvider('tmdb'))
    const validator = new SearchReadinessValidator(container)

    const result = validator.validate()
    expect(result.ready).toBe(true)
    expect(result.passedCount).toBe(8)
  })

  // ─── Feature Flags ───

  it('should manage feature flags', () => {
    const flags = new SearchFeatureFlagsManager({ analytics: true, suggestions: false, profiles: true, trending: true, providerMetrics: true })
    expect(flags.isEnabled('analytics')).toBe(true)
    expect(flags.isEnabled('suggestions')).toBe(false)

    flags.setFlag('suggestions', true)
    expect(flags.isEnabled('suggestions')).toBe(true)
  })

  // ─── Diagnostics ───

  it('should dump module state', () => {
    const container = new SearchDependencyContainer(TEST_CONFIG, new MockStorage() as any)
    container.registerProvider(mockProvider('tmdb'))
    const lifecycle = new SearchLifecycleManager()
    lifecycle.transition('ready')
    const diag = new SearchModuleDiagnostics(container, lifecycle, TEST_CONFIG)

    const snapshot = diag.dumpModuleState()
    expect(snapshot.state).toBe('ready')
    expect(snapshot.providers).toHaveLength(1)
  })

  // ─── Module E2E ───

  it('should initialize and dispose module', async () => {
    const storage = new MockStorage()
    const module = new UnifiedSearchModule(TEST_CONFIG, storage as any)
    // Register a provider before init
    // (in real usage, providers are registered externally)
    await module.initialize()
    expect(module.isInitialized).toBe(true)

    const facade = module.getFacade()
    expect(facade).toBeDefined()

    await module.dispose()
    expect(module.isInitialized).toBe(false)
  })
})
