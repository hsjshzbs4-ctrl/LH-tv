// src/features/marketplace/stores/installed-plugins.store.ts — P5.2 Installed Plugins Store
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { installedPluginService } from '../services/InstalledPluginService'
import { pluginLifecycleManager } from '@/plugin-marketplace'
import type { InstalledPluginMeta } from '@/plugin-marketplace'
import { PluginState } from '@/plugin-marketplace'

export const useInstalledPluginsStore = defineStore('installedPlugins', () => {
  const plugins = ref<InstalledPluginMeta[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const selectedIds = ref<Set<string>>(new Set())

  const enabled = computed(() => plugins.value.filter(p => p.enabled))
  const disabled = computed(() => plugins.value.filter(p => !p.enabled))

  function refresh() {
    plugins.value = installedPluginService.getAll()
  }

  function getState(id: string): PluginState {
    return pluginLifecycleManager.getState(id)
  }

  function toggleSelect(id: string) {
    const next = new Set(selectedIds.value)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    selectedIds.value = next
  }

  async function enablePlugin(id: string) {
    try {
      loading.value = true
      await pluginLifecycleManager.enable(id)
      refresh()
    } catch (e) { error.value = (e as Error).message }
    finally { loading.value = false }
  }

  async function disablePlugin(id: string) {
    try {
      await pluginLifecycleManager.disable(id)
      refresh()
    } catch (e) { error.value = (e as Error).message }
  }

  async function uninstall(id: string) {
    try {
      await installedPluginService.uninstall(id)
      refresh()
    } catch (e) { error.value = (e as Error).message }
  }

  return { plugins, loading, error, selectedIds, enabled, disabled, refresh, getState, toggleSelect, enablePlugin, disablePlugin, uninstall }
})
