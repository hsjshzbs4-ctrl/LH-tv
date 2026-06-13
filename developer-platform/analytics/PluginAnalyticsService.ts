// developer-platform/analytics/PluginAnalyticsService.ts
import type { PluginAnalytics } from '../shared/types'

export class PluginAnalyticsService {
  private data = new Map<string, PluginAnalytics>()

  track(pluginId: string): PluginAnalytics {
    if (!this.data.has(pluginId)) {
      this.data.set(pluginId, { pluginId, downloads: 0, installs: 0, uninstalls: 0, activeUsers: 0, updateRate: 0, crashRate: 0, dailyDownloads: [], weeklyDownloads: [] })
    }
    return this.data.get(pluginId)!
  }

  recordDownload(pluginId: string): void { this.track(pluginId).downloads++ }
  recordInstall(pluginId: string): void { this.track(pluginId).installs++ }
  recordUninstall(pluginId: string): void { this.track(pluginId).uninstalls++ }
  recordCrash(pluginId: string): void { this.track(pluginId).crashRate++ }

  get(pluginId: string): PluginAnalytics | undefined { return this.data.get(pluginId) }
  getAll(): PluginAnalytics[] { return Array.from(this.data.values()) }
  getTopDownloads(limit = 10): PluginAnalytics[] {
    return this.getAll().sort((a, b) => b.downloads - a.downloads).slice(0, limit)
  }
}

export const pluginAnalyticsService = new PluginAnalyticsService()
