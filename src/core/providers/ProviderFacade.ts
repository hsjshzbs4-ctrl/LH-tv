// src/core/providers/ProviderFacade.ts - 统一数据源入口（P4.3: 动态插件加载）
// View 层唯一允许调用的数据接口
// 禁止 View 直接访问 window.app.xxx() 或 Provider 实例

import type { IProvider, MediaItem, MediaDetail, AggregatedSearchResult } from '@provider-contracts'
import type { ProviderHealth } from './types/provider.types'
import { ProviderRegistry } from './registry/ProviderRegistry'

export class ProviderFacade {
  private registry: ProviderRegistry
  private initialized = false

  constructor() {
    this.registry = new ProviderRegistry()
  }

  /**
   * P5.0: Provider 实例由外部注入（ProviderHostFacade 负责加载）
   * 打破 ProviderFacade → providerSDK 的依赖
   */
  async initialize(providers?: IProvider[]): Promise<void> {
    if (this.initialized) return

    if (providers) {
      for (const provider of providers) {
        this.registry.register(provider)
      }
      console.log(
        `[ProviderFacade] 已加载 ${providers.length} 个 Provider:`,
        providers.map((r) => r.id).join(', '),
      )
    }

    this.initialized = true
  }

  /** 确保已初始化（调用方无需关心顺序） */
  private async _ensureInit(): Promise<void> {
    if (!this.initialized) await this.initialize()
  }

  // ==================== 搜索 ====================

  /**
   * 聚合搜索：并发所有已启用 Provider，合并 + 按评分排序
   */
  async search(keyword: string): Promise<AggregatedSearchResult> {
    await this._ensureInit()
    const providers = this.registry.getSearchProviders()
    if (providers.length === 0) return { items: [], providers: [], totalFromCache: 0, totalFromNetwork: 0 }

    const results = await Promise.allSettled(
      providers.map(p =>
        p.search(keyword).catch(() => [] as MediaItem[])
      )
    )

    const allItems: MediaItem[] = []
    let totalFromCache = 0
    let totalFromNetwork = 0
    const contributed: string[] = []

    for (let i = 0; i < results.length; i++) {
      const r = results[i]
      if (r.status === 'fulfilled' && r.value.length > 0) {
        allItems.push(...r.value)
        contributed.push(providers[i].name)

        // 粗略统计：来自缓存的判断（基类 cachedSearch 会在 ~0ms 返回）
        totalFromNetwork += r.value.length
      }
    }

    // 去重 + 排序 (score DESC → year DESC)
    const seen = new Set<string>()
    const deduped = allItems.filter(item => {
      const key = `${item.title}:${item.type}`.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    deduped.sort((a, b) => {
      const scoreDiff = (b.score || 0) - (a.score || 0)
      if (scoreDiff !== 0) return scoreDiff
      return (b.year || 0) - (a.year || 0)
    })

    return {
      items: deduped,
      providers: contributed,
      totalFromCache,
      totalFromNetwork,
    }
  }

  // ==================== 详情 ====================

  async detail(providerId: string, mediaId: string): Promise<MediaDetail> {
    const provider = this.registry.get(providerId)
    if (!provider) throw new Error(`Provider "${providerId}" 不存在`)
    return provider.detail(mediaId)
  }

  // ==================== 分类目录 ====================

  /** 从指定 Provider 获取分类目录 */
  async catalog(providerId: string, type: string, sub: string): Promise<MediaItem[]> {
    const provider = this.registry.get(providerId)
    if (!provider || !provider.catalog) return []
    return provider.catalog(type, sub)
  }

  /** 从所有支持 catalog 的 Provider 获取分类目录 */
  async catalogAll(type: string, sub: string): Promise<MediaItem[]> {
    const providers = this.registry.getEnabled().filter(p => p.catalog)
    const results = await Promise.allSettled(
      providers.map(p => p.catalog!(type, sub).catch(() => []))
    )
    return results
      .filter((r): r is PromiseFulfilledResult<MediaItem[]> => r.status === 'fulfilled')
      .flatMap(r => r.value)
  }

  // ==================== Provider 管理 ====================

  getProviders(): IProvider[] {
    return this.registry.getAll()
  }

  getEnabledProviders(): IProvider[] {
    return this.registry.getEnabled()
  }

  async healthCheck(): Promise<ProviderHealth[]> {
    return this.registry.checkHealth()
  }

  getHealthCache(): ProviderHealth[] {
    return this.registry.getHealthCache()
  }

  /** 注册自定义 Provider（插件系统使用） */
  registerProvider(provider: IProvider): void {
    this.registry.register(provider)
  }
}

/** 全局单例 */
export const providerFacade = new ProviderFacade()
