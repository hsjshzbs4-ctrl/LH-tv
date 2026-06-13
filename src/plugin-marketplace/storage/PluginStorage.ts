// src/plugin-marketplace/storage/PluginStorage.ts — 插件本地持久化
// P5.1 Plugin Marketplace Core
import { storageService } from '@/shared/storage/storage.service'
import type { InstalledPluginMeta } from './types'

type Subscriber = () => void

export class PluginStorage {
  private plugins = new Map<string, InstalledPluginMeta>()
  private subscribers = new Set<Subscriber>()
  private loaded = false

  async load(): Promise<void> {
    if (this.loaded) return
    try {
      const raw = await storageService.getSettings()
      const data = (raw as Record<string, unknown>).installedPlugins
      if (Array.isArray(data)) {
        for (const p of data as InstalledPluginMeta[]) {
          this.plugins.set(p.id, p)
        }
      }
    } catch { /* ignore */ }
    this.loaded = true
  }

  async savePlugin(meta: InstalledPluginMeta): Promise<void> {
    this.plugins.set(meta.id, meta)
    await this._persist()
    this._notify()
  }

  async removePlugin(id: string): Promise<void> {
    this.plugins.delete(id)
    await this._persist()
    this._notify()
  }

  getPlugin(id: string): InstalledPluginMeta | undefined {
    return this.plugins.get(id)
  }

  getAllPlugins(): InstalledPluginMeta[] {
    return Array.from(this.plugins.values())
  }

  getEnabledPlugins(): InstalledPluginMeta[] {
    return this.getAllPlugins().filter(p => p.enabled)
  }

  subscribe(cb: Subscriber): () => void {
    this.subscribers.add(cb)
    return () => { this.subscribers.delete(cb) }
  }

  private async _persist(): Promise<void> {
    try {
      const settings = await storageService.getSettings()
      await storageService.setSettings({
        ...settings,
        installedPlugins: Array.from(this.plugins.values()),
      })
    } catch { /* ignore */ }
  }

  private _notify(): void {
    this.subscribers.forEach(fn => { try { fn() } catch { /* */ } })
  }
}

export const pluginStorage = new PluginStorage()
