// src/plugin-marketplace/repository/PluginRepository.ts — 插件仓储服务
// P5.1 Plugin Marketplace Core
import { RepositoryClient } from './RepositoryClient'
import type { MarketplacePlugin, PluginVersion, RepositoryQuery, RepositoryResult } from './types'

export class PluginRepository {
  private client: RepositoryClient

  constructor(client?: RepositoryClient) {
    this.client = client || new RepositoryClient()
  }

  async listPlugins(query?: RepositoryQuery): Promise<RepositoryResult> {
    return this.client.listPlugins(query)
  }

  async getPlugin(id: string): Promise<MarketplacePlugin | null> {
    return this.client.getPlugin(id)
  }

  async getVersions(id: string): Promise<PluginVersion[]> {
    return this.client.getVersions(id)
  }

  async searchPlugins(keyword: string, query?: RepositoryQuery): Promise<RepositoryResult> {
    return this.client.searchPlugins(keyword, query)
  }
}

export const pluginRepository = new PluginRepository()
