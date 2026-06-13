// src/features/marketplace/stores/permissions.store.ts — P5.2 Permissions Store
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { permissionManager, PluginPermission, PERMISSION_DESCRIPTIONS } from '@/plugin-marketplace'
import { installedPluginService } from '../services/InstalledPluginService'
import type { InstalledPluginMeta } from '@/plugin-marketplace'

export interface PermissionEntry {
  pluginId: string
  pluginName: string
  permissions: string[]
  risk: 'low' | 'medium' | 'high' | 'critical'
}

function calculateRisk(permissions: string[]): PermissionEntry['risk'] {
  const critical = [PluginPermission.STORAGE_ACCESS, PluginPermission.SETTINGS_ACCESS]
  const high = [PluginPermission.DOWNLOAD_ACCESS, PluginPermission.PROVIDER_ACCESS]
  if (permissions.some(p => critical.includes(p as PluginPermission))) return 'critical'
  if (permissions.some(p => high.includes(p as PluginPermission))) return 'high'
  return 'low'
}

export const usePermissionsStore = defineStore('permissions', () => {
  const entries = ref<PermissionEntry[]>([])

  function refresh() {
    const plugins = installedPluginService.getAll()
    entries.value = plugins.map(p => ({
      pluginId: p.id,
      pluginName: p.name,
      permissions: permissionManager.getPermissions(p.id),
      risk: calculateRisk(permissionManager.getPermissions(p.id)),
    }))
  }

  function grant(pluginId: string, perm: PluginPermission) {
    permissionManager.grant(pluginId, perm)
    refresh()
  }

  function revoke(pluginId: string, perm: PluginPermission) {
    permissionManager.revoke(pluginId, perm)
    refresh()
  }

  const allPermissions = computed(() => Object.values(PluginPermission))
  const descriptions = PERMISSION_DESCRIPTIONS

  return { entries, refresh, grant, revoke, allPermissions, descriptions }
})
