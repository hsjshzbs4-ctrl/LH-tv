// tests/marketplace/marketplace-services.spec.ts
import { describe, it, expect } from 'vitest'
import { marketplaceService } from '@/features/marketplace/services/MarketplaceService'
import { installedPluginService } from '@/features/marketplace/services/InstalledPluginService'

describe('Marketplace Services', () => {
  it('should have marketplaceService', () => {
    expect(marketplaceService).toBeDefined()
    expect(typeof marketplaceService.search).toBe('function')
    expect(typeof marketplaceService.getPopular).toBe('function')
    expect(typeof marketplaceService.getPlugin).toBe('function')
  })

  it('should have installedPluginService', () => {
    expect(installedPluginService).toBeDefined()
    expect(typeof installedPluginService.getAll).toBe('function')
    expect(typeof installedPluginService.install).toBe('function')
    expect(typeof installedPluginService.uninstall).toBe('function')
  })
})
