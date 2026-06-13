// tests/plugin-marketplace/marketplace-integration.spec.ts — Marketplace 集成测试
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { PluginInstaller } from '@/plugin-marketplace/installer/PluginInstaller'
import { PluginUninstaller } from '@/plugin-marketplace/installer/PluginUninstaller'
import { PluginLifecycleManager } from '@/plugin-marketplace/runtime/PluginLifecycleManager'
import { PluginUpdateManager } from '@/plugin-marketplace/updates/PluginUpdateManager'
import { pluginStorage } from '@/plugin-marketplace/storage/PluginStorage'
import { permissionManager } from '@/plugin-marketplace/permissions/PermissionManager'
import { storageService } from '@/shared/storage/storage.service'
import { PluginPermission } from '@/plugin-marketplace/permissions/types'
import { PluginState } from '@/plugin-marketplace/storage/types'

describe('Marketplace Integration', () => {
  beforeEach(async () => {
    vi.spyOn(storageService, 'getSettings').mockResolvedValue({})
    vi.spyOn(storageService, 'setSettings').mockResolvedValue()
    await pluginStorage.load()
  })
  afterEach(() => { vi.restoreAllMocks() })

  // Install → Enable → Disable → Uninstall
  it('should complete full install lifecycle', async () => {
    const installer = new PluginInstaller()
    const uninstaller = new PluginUninstaller()

    // Install
    const r = await installer.install('lifecycle-test', 'Lifecycle', '1.0.0', ['NETWORK_ACCESS', 'STORAGE_ACCESS'])
    expect(r.success).toBe(true)

    // Verify storage
    expect(pluginStorage.getPlugin('lifecycle-test')).toBeDefined()

    // Verify permissions
    expect(permissionManager.check('lifecycle-test', PluginPermission.NETWORK_ACCESS)).toBe(true)
    expect(permissionManager.check('lifecycle-test', PluginPermission.STORAGE_ACCESS)).toBe(true)

    // Disable
    const lc = new PluginLifecycleManager()
    lc.getOrCreate('lifecycle-test')
    await lc.disable('lifecycle-test')
    expect(lc.getState('lifecycle-test')).toBe(PluginState.DISABLED)

    // Enable
    await lc.enable('lifecycle-test')
    expect(lc.getState('lifecycle-test')).toBe(PluginState.ENABLED)

    // Uninstall
    const ur = await uninstaller.uninstall('lifecycle-test')
    expect(ur.success).toBe(true)
    expect(pluginStorage.getPlugin('lifecycle-test')).toBeUndefined()
  })

  // Update flow
  it('should complete update with version history', async () => {
    const installer = new PluginInstaller()
    await installer.install('updatable', 'Updatable', '1.0.0', ['NETWORK_ACCESS'])

    const mgr = new PluginUpdateManager()
    const result = await mgr.update('updatable', '2.0.0')
    expect(result.success).toBe(true)

    const stored = pluginStorage.getPlugin('updatable')
    expect(stored!.version).toBe('2.0.0')
    expect(stored!.updateHistory).toHaveLength(1)
  })

  // Isolation: one plugin crash doesn't affect others
  it('should isolate plugin failures', () => {
    const lc = new PluginLifecycleManager()
    lc.getOrCreate('plugin-a')
    lc.getOrCreate('plugin-b')

    lc.recordError('plugin-a', 'crash!')
    expect(lc.getMetrics('plugin-a').errors).toBe(1)
    expect(lc.getMetrics('plugin-b').errors).toBe(0)
  })
})
