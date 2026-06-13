// developer-platform/repository-server/PluginRegistry.ts — Official Repository Registry
import type { PluginSubmission } from '../shared/types'

export interface RegisteredPlugin {
  id: string; name: string; version: string; developerId: string
  description: string; permissions: string[]; sdkVersion: string
  publishedAt: number; downloads: number; rating: number
  versions: RegisteredVersion[]
}

export interface RegisteredVersion {
  version: string; sdkVersion: string; changelog: string
  publishedAt: number; checksum: string; size: number
}

export class PluginRegistry {
  private plugins = new Map<string, RegisteredPlugin>()

  register(submission: PluginSubmission): RegisteredPlugin {
    const m = submission.manifest as Record<string, unknown>
    const plugin: RegisteredPlugin = {
      id: m.id as string, name: m.name as string, version: m.version as string,
      developerId: submission.developerId, description: (m.description as string) || '',
      permissions: (m.permissions as string[]) || [], sdkVersion: (m.sdkVersion as string) || '',
      publishedAt: Date.now(), downloads: 0, rating: 0,
      versions: [{ version: m.version as string, sdkVersion: (m.sdkVersion as string) || '', changelog: 'Initial release', publishedAt: Date.now(), checksum: '', size: 0 }],
    }
    this.plugins.set(plugin.id, plugin)
    return plugin
  }

  get(id: string): RegisteredPlugin | undefined { return this.plugins.get(id) }
  getAll(): RegisteredPlugin[] { return Array.from(this.plugins.values()) }
  search(keyword: string): RegisteredPlugin[] {
    const kw = keyword.toLowerCase()
    return this.getAll().filter(p => p.name.toLowerCase().includes(kw) || p.description.toLowerCase().includes(kw))
  }
  incrementDownloads(id: string): void {
    const p = this.plugins.get(id)
    if (p) p.downloads++
  }
}

export const pluginRegistry = new PluginRegistry()
