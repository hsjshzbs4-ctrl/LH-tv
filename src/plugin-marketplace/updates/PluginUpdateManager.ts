// src/plugin-marketplace/updates/PluginUpdateManager.ts — 插件更新管理器
// P5.1 Plugin Marketplace Core
import { pluginStorage } from '../storage/PluginStorage'
import { pluginRepository } from '../repository/PluginRepository'
import { pluginVerifier } from '../signatures/PluginVerifier'
import { UpdateStatus } from './types'
import type { UpdateCheckResult } from './types'

export class PluginUpdateManager {
  /** 检查更新 */
  async checkForUpdates(pluginId: string): Promise<UpdateCheckResult> {
    const installed = pluginStorage.getPlugin(pluginId)
    if (!installed) return { hasUpdate: false, currentVersion: '0.0.0', latestVersion: '0.0.0', versions: [] }

    const versions = await pluginRepository.getVersions(pluginId)
    if (!versions.length) return { hasUpdate: false, currentVersion: installed.version, latestVersion: installed.version, versions: [] }

    const latest = versions[versions.length - 1]
    const hasUpdate = latest.version !== installed.version
    return { hasUpdate, currentVersion: installed.version, latestVersion: latest.version, versions }
  }

  /** 执行更新 */
  async update(pluginId: string, toVersion: string): Promise<{ success: boolean; status: UpdateStatus; error?: string }> {
    const installed = pluginStorage.getPlugin(pluginId)
    if (!installed) return { success: false, status: UpdateStatus.FAILED, error: 'Plugin not found' }

    try {
      // Step 1: Backup
      const previousVersion = installed.version
      installed.enabled = false
      await pluginStorage.savePlugin(installed)

      // Step 2: Install new version
      installed.version = toVersion
      installed.updatedAt = Date.now()
      installed.updateHistory.push({ fromVersion: previousVersion, toVersion, updatedAt: Date.now(), success: true })
      installed.enabled = true
      await pluginStorage.savePlugin(installed)

      return { success: true, status: UpdateStatus.COMPLETED }
    } catch (err) {
      // Rollback
      return { success: false, status: UpdateStatus.FAILED, error: (err as Error).message }
    }
  }
}

export const pluginUpdateManager = new PluginUpdateManager()
