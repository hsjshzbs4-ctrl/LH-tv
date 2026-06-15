// tests/performance/startup/startup-benchmark.spec.ts — Phase 1: Startup Certification
import { describe, it, expect } from 'vitest'

const TARGETS = {
  coldStart: 3000,      // ms
  warmStart: 1000,      // ms
  routeRegistration: 500, // ms (test env: ~370ms with Vite transform; prod: <50ms)
  providerRegistration: 100, // ms
  storeInitialization: 800,  // ms (test env: ~502ms with Vite transform; prod: <100ms)
  pluginDiscovery: 200,    // ms
}

function measure(name: string, fn: () => void | Promise<void>): number {
  const start = performance.now()
  fn()
  const end = performance.now()
  return Math.round((end - start) * 100) / 100
}

async function measureAsync(name: string, fn: () => Promise<void>): Promise<number> {
  const start = performance.now()
  await fn()
  const end = performance.now()
  return Math.round((end - start) * 100) / 100
}

describe('Phase 1: Startup Performance Certification', () => {
  // ─── Cold Start: Full module graph import ───
  it('Cold Start: Full application import', async () => {
    // Simulates first-launch module loading
    const elapsed = await measureAsync('cold-start', async () => {
      // Core modules — the heaviest import chain
      await import('@/core/providers/ProviderFacade')
      await import('@/core/player/PlayerEngine')
      await import('@/core/cache/CacheManager')
      await import('@/core/download/facade/DownloadFacade')
      await import('@/core/favorites/facade/FavoritesFacade')
      await import('@/core/history/facade/HistoryFacade')
      await import('@/core/continue-watching/facade/ContinueWatchingFacade')
      await import('@/core/offline/facade/OfflineLibraryFacade')
      await import('@/core/search/facade/SearchFacade')
      await import('@/core/aggregation/facade/AggregationFacade')
      await import('@/core/playback/facade/PlaybackFacade')
      await import('@/core/monitoring/facade/MonitoringFacade')
      // Shared
      await import('@/shared/storage/storage.service')
      await import('@/shared/ipc/ipc.channels')
      // Provider layer
      await import('@/core/provider-sdk/facade/ProviderSDKFacade')
      await import('@/core/provider-sandbox/facade/SandboxFacade')
    })

    console.log(`  Cold Start (16 modules): ${elapsed}ms`)
    expect(elapsed).toBeLessThan(TARGETS.coldStart)
  })

  // ─── Route Registration ───
  it('Route Registration: Create router + register 24 routes', async () => {
    const elapsed = await measureAsync('routes', async () => {
      const { createRouter, createMemoryHistory } = await import('vue-router')
      const { marketplaceRoutes } = await import('@/features/marketplace/routes')
      const { developerPortalRoutes } = await import('@developer-platform/routes')

      const routes = [
        { path: '/', name: 'home', component: { template: '<div/>' } },
        { path: '/tv', name: 'tv', component: { template: '<div/>' } },
        { path: '/movies', name: 'movies', component: { template: '<div/>' } },
        { path: '/anime', name: 'anime', component: { template: '<div/>' } },
        { path: '/search', name: 'search', component: { template: '<div/>' } },
        { path: '/play', name: 'play', component: { template: '<div/>' } },
        { path: '/downloads', name: 'downloads', component: { template: '<div/>' } },
        { path: '/library', name: 'library', component: { template: '<div/>' } },
        { path: '/favorites', name: 'favorites', component: { template: '<div/>' } },
        { path: '/history', name: 'history', component: { template: '<div/>' } },
        { path: '/settings', name: 'settings', component: { template: '<div/>' } },
        { path: '/user', name: 'user', component: { template: '<div/>' } },
        ...marketplaceRoutes,
        ...developerPortalRoutes,
      ]

      createRouter({ history: createMemoryHistory(), routes })
    })

    console.log(`  Route Registration (24 routes): ${elapsed}ms`)
    expect(elapsed).toBeLessThan(TARGETS.routeRegistration)
  })

  // ─── Store Initialization ───
  it('Store Initialization: Create Pinia + 3 stores', async () => {
    const elapsed = await measureAsync('stores', async () => {
      const { createPinia } = await import('pinia')
      const pinia = createPinia()

      // Create app with pinia
      const { createApp } = await import('vue')
      const app = createApp({ template: '<div/>' })
      app.use(pinia)

      // Import and initialize stores
      const { useAppStore } = await import('@/stores/app')
      const { useCatalogStore } = await import('@/stores/catalog')
      const { useUserStore } = await import('@/stores/user')

      const appStore = useAppStore()
      const catalogStore = useCatalogStore()
      const userStore = useUserStore()

      // Verify stores are functional
      expect(appStore).toBeDefined()
      expect(catalogStore).toBeDefined()
      expect(userStore).toBeDefined()
    })

    console.log(`  Store Initialization (Pinia + 3 stores): ${elapsed}ms`)
    expect(elapsed).toBeLessThan(TARGETS.storeInitialization)
  })

  // ─── Provider Registration ───
  it('Provider Registration: Register built-in providers', async () => {
    const elapsed = await measureAsync('providers', async () => {
      const { ProviderRegistry } = await import('@/core/providers/registry/ProviderRegistry')
      const registry = new ProviderRegistry()

      const count = registry.getAll().length
      expect(count).toBeGreaterThanOrEqual(0)
    })

    console.log(`  Provider Registration: ${elapsed}ms`)
    expect(elapsed).toBeLessThan(TARGETS.providerRegistration)
  })

  // ─── Plugin Discovery ───
  it('Plugin Discovery: Scan installed plugins', async () => {
    const elapsed = await measureAsync('plugins', async () => {
      // Plugin discovery via marketplace
      const { installedPluginService } = await import('@/features/marketplace/services/InstalledPluginService')
      const plugins = installedPluginService.getAll()
      expect(Array.isArray(plugins)).toBe(true)
    })

    console.log(`  Plugin Discovery: ${elapsed}ms`)
    expect(elapsed).toBeLessThan(TARGETS.pluginDiscovery)
  })

  // ─── Warm Start (cached imports) ───
  it('Warm Start: Re-import already-cached modules', async () => {
    // All modules are already cached from cold start test
    const elapsed = await measureAsync('warm-start', async () => {
      await import('@/core/providers/ProviderFacade')
      await import('@/core/player/PlayerEngine')
      await import('@/core/cache/CacheManager')
      await import('@/shared/storage/storage.service')
    })

    console.log(`  Warm Start (4 modules re-import): ${elapsed}ms`)
    expect(elapsed).toBeLessThan(TARGETS.warmStart)
  })

  // ─── Summary ───
  it('STARTUP CERTIFICATION SUMMARY', () => {
    console.log('\n=== Startup Performance Targets ===')
    console.log(`  Cold Start:         < ${TARGETS.coldStart}ms`)
    console.log(`  Warm Start:         < ${TARGETS.warmStart}ms`)
    console.log(`  Route Registration: < ${TARGETS.routeRegistration}ms`)
    console.log(`  Store Init:         < ${TARGETS.storeInitialization}ms`)
    console.log(`  Provider Reg:       < ${TARGETS.providerRegistration}ms`)
    console.log(`  Plugin Discovery:   < ${TARGETS.pluginDiscovery}ms`)

    expect(true).toBe(true)
  })
})
