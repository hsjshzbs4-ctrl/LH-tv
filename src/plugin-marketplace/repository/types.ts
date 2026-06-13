// src/plugin-marketplace/repository/types.ts — Marketplace 仓储类型定义
// P5.1 Plugin Marketplace Core

/** Marketplace 插件信息 */
export interface MarketplacePlugin {
  id: string
  name: string
  version: string
  description: string
  author: string
  homepage?: string
  repository?: string
  icon?: string
  tags: string[]
  permissions: string[]
  sdkVersion: string
  downloads: number
  rating: number
  updatedAt: string
}

/** 插件版本信息 */
export interface PluginVersion {
  version: string
  sdkVersion: string
  changelog: string
  publishedAt: string
  downloadUrl: string
  size: number
  checksum: string
}

/** 仓储查询参数 */
export interface RepositoryQuery {
  keyword?: string
  tags?: string[]
  author?: string
  sdkVersion?: string
  page?: number
  pageSize?: number
}

/** 仓储查询结果 */
export interface RepositoryResult {
  plugins: MarketplacePlugin[]
  total: number
  page: number
  pageSize: number
}

/** 仓储客户端接口 */
export interface IRepositoryClient {
  listPlugins(query?: RepositoryQuery): Promise<RepositoryResult>
  getPlugin(id: string): Promise<MarketplacePlugin | null>
  getVersions(id: string): Promise<PluginVersion[]>
  getChangelog(id: string, version: string): Promise<string>
  searchPlugins(keyword: string, query?: RepositoryQuery): Promise<RepositoryResult>
}
