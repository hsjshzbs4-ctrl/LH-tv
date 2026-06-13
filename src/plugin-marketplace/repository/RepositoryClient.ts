// src/plugin-marketplace/repository/RepositoryClient.ts — 仓储客户端 (Mock)
// P5.1: Mock 实现，不连接真实后端
import type { IRepositoryClient, MarketplacePlugin, PluginVersion, RepositoryQuery, RepositoryResult } from './types'

export class RepositoryClient implements IRepositoryClient {
  private plugins: MarketplacePlugin[] = []

  constructor(plugins?: MarketplacePlugin[]) {
    if (plugins) this.plugins = plugins
  }

  async listPlugins(query?: RepositoryQuery): Promise<RepositoryResult> {
    let filtered = [...this.plugins]
    if (query?.keyword) {
      const kw = query.keyword.toLowerCase()
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(kw) || p.description.toLowerCase().includes(kw) || p.tags.some(t => t.includes(kw)),
      )
    }
    if (query?.tags?.length) {
      filtered = filtered.filter(p => query.tags!.some(t => p.tags.includes(t)))
    }
    const page = query?.page || 1
    const pageSize = query?.pageSize || 20
    const start = (page - 1) * pageSize
    return { plugins: filtered.slice(start, start + pageSize), total: filtered.length, page, pageSize }
  }

  async getPlugin(id: string): Promise<MarketplacePlugin | null> {
    return this.plugins.find(p => p.id === id) || null
  }

  async getVersions(_id: string): Promise<PluginVersion[]> {
    return [{ version: '1.0.0', sdkVersion: '1.0.0', changelog: 'Initial release', publishedAt: new Date().toISOString(), downloadUrl: '', size: 0, checksum: '' }]
  }

  async getChangelog(_id: string, _version: string): Promise<string> {
    return 'Initial release'
  }

  async searchPlugins(keyword: string, query?: RepositoryQuery): Promise<RepositoryResult> {
    return this.listPlugins({ ...query, keyword })
  }
}
