// tests/marketplace/marketplace-stores.spec.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMarketplaceStore } from '@/features/marketplace/stores/marketplace.store'
import { useInstalledPluginsStore } from '@/features/marketplace/stores/installed-plugins.store'
import { usePermissionsStore } from '@/features/marketplace/stores/permissions.store'

describe('Marketplace Pinia Stores', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should create marketplace store with defaults', () => {
    const store = useMarketplaceStore()
    expect(store.loading).toBe(false)
    expect(store.searchQuery).toBe('')
    expect(store.selectedCategory).toBe('all')
    expect(store.featured).toEqual([])
    expect(store.popular).toEqual([])
  })

  it('should create installed plugins store with defaults', () => {
    const store = useInstalledPluginsStore()
    expect(store.plugins).toEqual([])
    expect(store.enabled).toEqual([])
    expect(store.disabled).toEqual([])
  })

  it('should create permissions store with defaults', () => {
    const store = usePermissionsStore()
    expect(store.entries).toEqual([])
    expect(store.allPermissions.length).toBeGreaterThan(0)
  })

  it('should have clearSearch method on marketplace store', () => {
    const store = useMarketplaceStore()
    store.clearSearch()
    expect(store.searchQuery).toBe('')
  })
})
