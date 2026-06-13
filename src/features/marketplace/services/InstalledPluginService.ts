// src/features/marketplace/services/InstalledPluginService.ts
// P5.2: 已安装插件服务层
import { pluginStorage, pluginInstaller, pluginUninstaller } from '@/plugin-marketplace'
import type { InstalledPluginMeta } from '@/plugin-marketplace'

export class InstalledPluginService {
  getAll(): InstalledPluginMeta[] {
    return pluginStorage.getAllPlugins()
  }

  getEnabled(): InstalledPluginMeta[] {
    return pluginStorage.getEnabledPlugins()
  }

  getDisabled(): InstalledPluginMeta[] {
    return this.getAll().filter(p => !p.enabled)
  }

  getPlugin(id: string): InstalledPluginMeta | undefined {
    return pluginStorage.getPlugin(id)
  }

  async install(id: string, name: string, version: string, permissions: string[]) {
    return pluginInstaller.install(id, name, version, permissions)
  }

  async uninstall(id: string) {
    return pluginUninstaller.uninstall(id)
  }

  subscribe(cb: () => void): () => void {
    return pluginStorage.subscribe(cb)
  }
}

export const installedPluginService = new InstalledPluginService()
