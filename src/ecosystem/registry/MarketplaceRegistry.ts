// src/ecosystem/registry/MarketplaceRegistry.ts — 唯一 Marketplace SSOT
// PB7-S3: 单一 Registry 入口，禁止多 Registry / 多 Source Of Truth

import type { ExtensionManifest } from '../contracts/ExtensionManifest'
import { validateManifest } from '../contracts/ExtensionManifest'
import { ExtensionState } from '../contracts/ExtensionManifest'

/** Marketplace 条目 */
export interface MarketplaceEntry {
  manifest: ExtensionManifest
  state: ExtensionState
  /** 安装次数 */
  installs: number
  /** 评分 */
  rating: number
  /** 注册时间 */
  registeredAt: number
  /** 更新时间 */
  updatedAt: number
}

/** 查询选项 */
export interface RegistryQuery {
  /** 按扩展类型过滤 */
  type?: ExtensionManifest['type']
  /** 搜索关键词 */
  keyword?: string
  /** 排序 */
  sort?: 'installs' | 'rating' | 'updated' | 'name'
  /** 排序方向 */
  order?: 'asc' | 'desc'
  /** 分页 */
  offset?: number
  /** 分页 */
  limit?: number
}

export class MarketplaceRegistry {
  private entries = new Map<string, MarketplaceEntry>()

  /**
   * 注册扩展到 Marketplace
   * Manifest 必须通过校验，这是唯一入口点
   */
  register(manifest: unknown): { success: boolean; entry?: MarketplaceEntry; error?: string } {
    // 1. Manifest 校验 (SSOT — 所有入口都必须通过此校验)
    const validation = validateManifest(manifest)
    if (!validation.valid) {
      return { success: false, error: `Manifest validation failed: ${validation.errors.join('; ')}` }
    }
    const validManifest = manifest as ExtensionManifest

    // 2. 唯一性检查
    if (this.entries.has(validManifest.id)) {
      return { success: false, error: `Extension "${validManifest.id}" already registered in Marketplace` }
    }

    // 3. 注册
    const entry: MarketplaceEntry = {
      manifest: validManifest,
      state: ExtensionState.REGISTERED,
      installs: 0,
      rating: 0,
      registeredAt: Date.now(),
      updatedAt: Date.now(),
    }

    this.entries.set(validManifest.id, entry)
    return { success: true, entry }
  }

  /** 搜索 Marketplace */
  search(query: RegistryQuery = {}): MarketplaceEntry[] {
    let results = Array.from(this.entries.values())

    // 过滤
    if (query.type) {
      results = results.filter((e) => e.manifest.type === query.type)
    }

    if (query.keyword) {
      const kw = query.keyword.toLowerCase()
      results = results.filter(
        (e) =>
          e.manifest.name.toLowerCase().includes(kw) ||
          e.manifest.description.toLowerCase().includes(kw) ||
          e.manifest.id.toLowerCase().includes(kw),
      )
    }

    // 排序
    const order = query.order ?? 'desc'
    const multiplier = order === 'asc' ? 1 : -1

    switch (query.sort) {
      case 'installs':
        results.sort((a, b) => (a.installs - b.installs) * multiplier)
        break
      case 'rating':
        results.sort((a, b) => (a.rating - b.rating) * multiplier)
        break
      case 'updated':
        results.sort((a, b) => (a.updatedAt - b.updatedAt) * multiplier)
        break
      case 'name':
      default:
        results.sort((a, b) => a.manifest.name.localeCompare(b.manifest.name) * multiplier)
    }

    // 分页
    const offset = query.offset ?? 0
    const limit = query.limit ?? 50
    return results.slice(offset, offset + limit)
  }

  /** 获取单个条目 */
  get(id: string): MarketplaceEntry | null {
    return this.entries.get(id) ?? null
  }

  /** 检查扩展是否存在 */
  has(id: string): boolean {
    return this.entries.has(id)
  }

  /** 更新安装统计 */
  recordInstall(id: string): void {
    const entry = this.entries.get(id)
    if (entry) {
      entry.installs++
      entry.updatedAt = Date.now()
    }
  }

  /** 更新评分 */
  updateRating(id: string, rating: number): void {
    const entry = this.entries.get(id)
    if (entry) {
      entry.rating = Math.max(0, Math.min(5, rating))
      entry.updatedAt = Date.now()
    }
  }

  /** 更新状态 */
  setState(id: string, state: ExtensionState): void {
    const entry = this.entries.get(id)
    if (entry) {
      entry.state = state
      entry.updatedAt = Date.now()
    }
  }

  /** 注销扩展 */
  unregister(id: string): boolean {
    return this.entries.delete(id)
  }

  /** 列出所有条目 */
  listAll(): MarketplaceEntry[] {
    return Array.from(this.entries.values())
  }

  /** 统计 */
  stats() {
    const entries = this.listAll()
    return {
      total: entries.length,
      byType: {
        plugin: entries.filter((e) => e.manifest.type === 'plugin').length,
        theme: entries.filter((e) => e.manifest.type === 'theme').length,
        ai_agent: entries.filter((e) => e.manifest.type === 'ai_agent').length,
        template: entries.filter((e) => e.manifest.type === 'template').length,
        capability_pack: entries.filter((e) => e.manifest.type === 'capability_pack').length,
      },
      totalInstalls: entries.reduce((sum, e) => sum + e.installs, 0),
    }
  }
}

/** 全局唯一 Marketplace Registry 实例 */
export const marketplaceRegistry = new MarketplaceRegistry()
