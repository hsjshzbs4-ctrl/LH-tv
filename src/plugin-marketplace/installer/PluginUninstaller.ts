// src/plugin-marketplace/installer/PluginUninstaller.ts — 插件卸载器
// P5.1 Plugin Marketplace Core
import { pluginStorage } from '../storage/PluginStorage'
import { permissionManager } from '../permissions/PermissionManager'

export class PluginUninstaller {
  async uninstall(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const existing = pluginStorage.getPlugin(id)
      if (!existing) return { success: false, error: `Plugin "${id}" not found` }

      // Step 1: Disable
      existing.enabled = false
      await pluginStorage.savePlugin(existing)

      // Step 2: Revoke permissions
      permissionManager.revokeAll(id)

      // Step 3: Remove from storage
      await pluginStorage.removePlugin(id)

      return { success: true }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  }
}

export const pluginUninstaller = new PluginUninstaller()
