// tests/plugin-marketplace/plugin-update.spec.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { PluginUpdateManager } from '@/plugin-marketplace/updates/PluginUpdateManager'
import { pluginStorage } from '@/plugin-marketplace/storage/PluginStorage'
import { storageService } from '@/shared/storage/storage.service'
import { UpdateStatus } from '@/plugin-marketplace/updates/types'

describe('PluginUpdateManager', () => {
  beforeEach(async () => {
    vi.spyOn(storageService, 'getSettings').mockResolvedValue({})
    vi.spyOn(storageService, 'setSettings').mockResolvedValue()
    await pluginStorage.load()
  })
  afterEach(() => { vi.restoreAllMocks() })

  it('should detect no update for new plugin', async () => {
    const mgr = new PluginUpdateManager()
    const result = await mgr.checkForUpdates('nonexistent')
    expect(result.hasUpdate).toBe(false)
    expect(result.currentVersion).toBe('0.0.0')
  })

  it('should update plugin version', async () => {
    await pluginStorage.savePlugin({
      id: 'p1', name: 'Test', version: '1.0.0',
      installedAt: Date.now(), updatedAt: Date.now(),
      enabled: true, grantedPermissions: [], installPath: 'plugins/p1/', updateHistory: [],
    })

    const mgr = new PluginUpdateManager()
    const result = await mgr.update('p1', '2.0.0')
    expect(result.success).toBe(true)
    expect(result.status).toBe(UpdateStatus.COMPLETED)

    const stored = pluginStorage.getPlugin('p1')
    expect(stored!.version).toBe('2.0.0')
    expect(stored!.updateHistory).toHaveLength(1)
    expect(stored!.updateHistory[0].fromVersion).toBe('1.0.0')
    expect(stored!.updateHistory[0].toVersion).toBe('2.0.0')
  })
})
