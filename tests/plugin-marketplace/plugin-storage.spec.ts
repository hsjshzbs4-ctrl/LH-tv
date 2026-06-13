// tests/plugin-marketplace/plugin-storage.spec.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { PluginStorage } from '@/plugin-marketplace/storage/PluginStorage'
import { storageService } from '@/shared/storage/storage.service'

describe('PluginStorage', () => {
  let storage: PluginStorage

  beforeEach(() => {
    vi.spyOn(storageService, 'getSettings').mockResolvedValue({})
    vi.spyOn(storageService, 'setSettings').mockResolvedValue()
    storage = new PluginStorage()
  })
  afterEach(() => { vi.restoreAllMocks() })

  it('should save and retrieve plugins', async () => {
    await storage.load()
    await storage.savePlugin({
      id: 'p1', name: 'Test', version: '1.0.0',
      installedAt: Date.now(), updatedAt: Date.now(),
      enabled: true, grantedPermissions: [], installPath: 'plugins/p1/', updateHistory: [],
    })
    expect(storage.getPlugin('p1')).toBeDefined()
    expect(storage.getPlugin('p1')!.name).toBe('Test')
  })

  it('should remove plugins', async () => {
    await storage.load()
    await storage.savePlugin({
      id: 'p1', name: 'Test', version: '1.0.0',
      installedAt: Date.now(), updatedAt: Date.now(),
      enabled: true, grantedPermissions: [], installPath: 'plugins/p1/', updateHistory: [],
    })
    await storage.removePlugin('p1')
    expect(storage.getPlugin('p1')).toBeUndefined()
  })

  it('should filter enabled plugins', async () => {
    await storage.load()
    await storage.savePlugin({ id: 'a', name: 'A', version: '1.0.0', installedAt: Date.now(), updatedAt: Date.now(), enabled: true, grantedPermissions: [], installPath: 'p/a/', updateHistory: [] })
    await storage.savePlugin({ id: 'b', name: 'B', version: '1.0.0', installedAt: Date.now(), updatedAt: Date.now(), enabled: false, grantedPermissions: [], installPath: 'p/b/', updateHistory: [] })
    expect(storage.getEnabledPlugins()).toHaveLength(1)
  })

  it('should notify subscribers on save', async () => {
    await storage.load()
    let count = 0
    storage.subscribe(() => { count++ })
    await storage.savePlugin({ id: 'p1', name: 'Test', version: '1.0.0', installedAt: Date.now(), updatedAt: Date.now(), enabled: true, grantedPermissions: [], installPath: 'p/p1/', updateHistory: [] })
    expect(count).toBe(1)
  })
})
