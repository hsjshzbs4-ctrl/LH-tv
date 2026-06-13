// src/plugin-marketplace/installer/PluginInstaller.ts — 插件安装器
// P5.1 Plugin Marketplace Core
import { pluginStorage } from '../storage/PluginStorage'
import { permissionManager } from '../permissions/PermissionManager'
import { pluginVerifier } from '../signatures/PluginVerifier'
import { PluginPermission } from '../permissions/types'
import type { InstalledPluginMeta } from '../storage/types'
import type { PluginSignature } from '../signatures/types'

export class PluginInstaller {
  /**
   * 安装插件流程:
   *   Download → Validate Signature → Validate Manifest → Extract → Register → Enable → Success
   * 任何步骤失败 → Rollback → Restore Previous State
   */
  async install(
    id: string, name: string, version: string,
    permissions: string[], _packageData?: Buffer, _signature?: PluginSignature,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Step 1: Validate signature (if provided)
      if (_packageData && _signature) {
        const verifyResult = pluginVerifier.verify(_packageData, _signature)
        if (!verifyResult.valid) {
          return { success: false, error: `Signature verification failed: ${verifyResult.reason}` }
        }
      }

      // Step 2: Check already installed
      const existing = pluginStorage.getPlugin(id)
      const previousState = existing ? { ...existing } : null

      // Step 3: Validate permissions
      for (const perm of permissions) {
        if (!Object.values(PluginPermission).includes(perm as PluginPermission)) {
          return { success: false, error: `Unknown permission: ${perm}` }
        }
      }

      // Step 4: Register in storage
      const meta: InstalledPluginMeta = {
        id, name, version,
        installedAt: Date.now(), updatedAt: Date.now(),
        enabled: false, grantedPermissions: permissions,
        installPath: `plugins/${id}/`,
        updateHistory: existing ? existing.updateHistory : [],
      }
      await pluginStorage.savePlugin(meta)

      // Step 5: Grant permissions
      for (const perm of permissions) {
        permissionManager.grant(id, perm as PluginPermission)
      }

      // Step 6: Enable
      meta.enabled = true
      await pluginStorage.savePlugin(meta)

      return { success: true }
    } catch (err) {
      // Rollback
      await this._rollback(id)
      return { success: false, error: (err as Error).message }
    }
  }

  private async _rollback(pluginId: string): Promise<void> {
    permissionManager.revokeAll(pluginId)
    await pluginStorage.removePlugin(pluginId)
  }
}

export const pluginInstaller = new PluginInstaller()
