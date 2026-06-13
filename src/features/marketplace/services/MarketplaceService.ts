// src/features/marketplace/services/MarketplaceService.ts
// P5.2: Marketplace 服务层 — 封装 PluginRepository 为 UI 友好的 API
import { pluginRepository } from '@/plugin-marketplace'
import type { MarketplacePlugin, RepositoryResult } from '@/plugin-marketplace'

export type PluginCategory = 'providers' | 'downloads' | 'library' | 'ui' | 'utilities' | 'developer' | 'experimental'

const CATEGORY_TAG_MAP: Record<PluginCategory, string[]> = {
  providers: ['provider', 'media', 'video', 'anime'],
  downloads: ['download', 'offline', 'storage'],
  library: ['library', 'media', 'catalog'],
  ui: ['ui', 'theme', 'layout', 'component'],
  utilities: ['utility', 'tool', 'helper'],
  developer: ['developer', 'sdk', 'api', 'debug'],
  experimental: ['experimental', 'alpha', 'beta'],
}

export class MarketplaceService {
  async getFeatured(): Promise<MarketplacePlugin[]> {
    const result = await pluginRepository.listPlugins({ pageSize: 6 })
    return result.plugins
  }

  async getPopular(): Promise<MarketplacePlugin[]> {
    const result = await pluginRepository.listPlugins({ pageSize: 10 })
    return result.plugins.sort((a, b) => b.downloads - a.downloads)
  }

  async getNewest(): Promise<MarketplacePlugin[]> {
    const result = await pluginRepository.listPlugins({ pageSize: 10 })
    return result.plugins.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }

  async search(keyword: string): Promise<RepositoryResult> {
    return pluginRepository.searchPlugins(keyword)
  }

  async getByCategory(category: PluginCategory): Promise<MarketplacePlugin[]> {
    const tags = CATEGORY_TAG_MAP[category] || []
    const result = await pluginRepository.listPlugins({ tags, pageSize: 20 })
    return result.plugins
  }

  async getPlugin(id: string): Promise<MarketplacePlugin | null> {
    return pluginRepository.getPlugin(id)
  }

  async getVersions(id: string) {
    return pluginRepository.getVersions(id)
  }
}

export const marketplaceService = new MarketplaceService()
