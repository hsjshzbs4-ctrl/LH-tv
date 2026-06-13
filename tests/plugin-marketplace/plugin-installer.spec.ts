// tests/plugin-marketplace/plugin-installer.spec.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { PluginInstaller } from '@/plugin-marketplace/installer/PluginInstaller'
import { PluginUninstaller } from '@/plugin-marketplace/installer/PluginUninstaller'
import { pluginStorage } from '@/plugin-marketplace/storage/PluginStorage'
import { permissionManager } from '@/plugin-marketplace/permissions/PermissionManager'
import { storageService } from '@/shared/storage/storage.service'

describe('Plugin Installer', () => {
  beforeEach(async () => {
    vi.spyOn(storageService, 'getSettings').mockResolvedValue({})
    vi.spyOn(storageService, 'setSettings').mockResolvedValue()
    await pluginStorage.load()
  })
  afterEach(() => { vi.restoreAllMocks() })

  it('should install plugin with valid permissions', async () => {
    const installer = new PluginInstaller()
    const result = await installer.install('test-plugin', 'Test Plugin', '1.0.0', ['NETWORK_ACCESS'])
    expect(result.success).toBe(true)

    const stored = pluginStorage.getPlugin('test-plugin')
    expect(stored).toBeDefined()
    expect(stored!.enabled).toBe(true)
    expect(stored!.grantedPermissions).toContain('NETWORK_ACCESS')
  })

  it('should reject unknown permission', async () => {
    const installer = new PluginInstaller()
    const result = await installer.install('bad-plugin', 'Bad', '1.0.0', ['INVALID_PERMISSION'])
    expect(result.success).toBe(false)
    expect(result.error).toContain('Unknown permission')
  })

  it('should uninstall and clean up', async () => {
    const installer = new PluginInstaller()
    await installer.install('p1', 'P1', '1.0.0', ['NETWORK_ACCESS'])

    const uninstaller = new PluginUninstaller()
    const result = await uninstaller.uninstall('p1')
    expect(result.success).toBe(true)
    expect(pluginStorage.getPlugin('p1')).toBeUndefined()
  })

  it('should reject uninstall of non-existent plugin', async () => {
    const uninstaller = new PluginUninstaller()
    const result = await uninstaller.uninstall('nonexistent')
    expect(result.success).toBe(false)
  })
})
