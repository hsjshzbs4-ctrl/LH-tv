// src/core/aggregation/engine/AggregationEngine.ts - 多源聚合引擎核心
// P4.1 Multi-Source Aggregation Engine
//
// 职责：并发搜索、结果去重合并、详情聚合、自动降级
// 禁止：UI、IPC、持久化
//
// 架构：
//   AggregationEngine
//     ├── ProviderRegistry (via ProviderFacade)  → Provider 列表
//     ├── ProviderHealthManager                   → 健康状态 + 降级决策
//     ├── ProviderRanker                          → 加权排序
//     └── Provider.search()                       → 并发调用各 Provider

import { providerFacade } from '@/core/providers'
import type { IProvider, MediaItem, MediaDetail, ProviderHealth } from '@/core/providers'
import { ProviderHealthManager } from '../health/ProviderHealthManager'
import { ProviderRanker } from '../ranking/ProviderRanker'
import type { SandboxFacade } from '@/core/provider-sandbox'
import { monitoring } from '@/core/monitoring'
import type {
  AggregatedSearchItem,
  AggregatedSearchResponse,
  AggregatedMediaDetail,
  MediaDetailSource,
  ProviderScore,
  ProviderHealthSnapshot,
} from '../types/aggregation.types'
import { ProviderHealthStatus } from '../types/aggregation.types'

type Subscriber = () => void

export class AggregationEngine {
  private healthManager = new ProviderHealthManager()
  private ranker = new ProviderRanker()
  private subscribers = new Set<Subscriber>()
  /** P4.4: 可选沙箱（通过 ProviderHost 隔离调用） */
  private sandbox?: SandboxFacade

  // 缓存
  private searchCache = new Map<string, { items: AggregatedSearchItem[]; providers: string[]; ts: number }>()
  private detailCache = new Map<string, { detail: AggregatedMediaDetail; ts: number }>()
  private readonly SEARCH_CACHE_TTL = 5 * 60 * 1000   // 5 分钟
  private readonly DETAIL_CACHE_TTL = 10 * 60 * 1000  // 10 分钟

  // ==================== 初始化 ====================

  constructor(sandbox?: SandboxFacade) {
    // 从 ProviderFacade 同步所有 Provider 到健康管理
    const providers = providerFacade.getProviders()
    for (const p of providers) {
      this.healthManager.register(p.id, p.name)
    }

    // P4.4: 可选沙箱隔离
    if (sandbox) {
      this.sandbox = sandbox
      // 将 Provider 注册到沙箱
      sandbox.registerAll(providers)
    }
  }

  /** 动态注册新 Provider（插件系统使用） */
  registerProvider(provider: IProvider): void {
    this.healthManager.register(provider.id, provider.name)
  }

  // ==================== 搜索聚合 ====================

  /**
   * 多源聚合搜索
   * 1. 获取全部 Provider（跳过低优先级/离线）
   * 2. 按权重排序
   * 3. 并发搜索（Promise.allSettled，单源失败不影响其他）
   * 4. 合并结果 + 标准化去重
   * 5. 更新健康状态
   */
  async aggregateSearch(keyword: string): Promise<AggregatedSearchResponse> {
    const kw = keyword.trim()
    if (!kw) return { items: [], providers: [], totalResults: 0 }

    // 检查缓存
    const cacheKey = kw.toLowerCase()
    const cached = this.searchCache.get(cacheKey)
    if (cached && Date.now() - cached.ts < this.SEARCH_CACHE_TTL) {
      monitoring.recordSearch(kw, 0, cached.items.length, true)
      return { items: cached.items, providers: cached.providers, totalResults: cached.items.length }
    }

    const searchStart = performance.now()

    // 获取可搜索的 Provider（启用 + 非 OFFLINE）
    const providers = this._getSearchableProviders()

    if (providers.length === 0) {
      return { items: [], providers: [], totalResults: 0 }
    }

    // 并发搜索（P4.4: 可选通过沙箱隔离调用）
    const startTimes = new Map<string, number>()
    const results = await Promise.allSettled(
      providers.map(async (p) => {
        startTimes.set(p.id, performance.now())
        // P4.4: 沙箱模式 → 通过 ProviderHost 隔离调用
        const items = this.sandbox
          ? await this.sandbox.search(p.id, kw).catch(() => [] as MediaItem[])
          : await p.search(kw)
        return { provider: p, items }
      }),
    )

    // 处理结果：合并 + 健康标记
    const allItems: Array<{ item: MediaItem; providerId: string }> = []
    const contributedProviders = new Set<string>()

    for (let i = 0; i < results.length; i++) {
      const r = results[i]
      const provider = providers[i]

      if (r.status === 'fulfilled') {
        const elapsed = performance.now() - (startTimes.get(provider.id) || 0)
        if (r.value.items.length > 0) {
          contributedProviders.add(provider.id)
          for (const item of r.value.items) {
            allItems.push({ item, providerId: provider.id })
          }
        }
        this.healthManager.markSuccess(provider.id, elapsed)
        monitoring.providerMetrics.recordSearchSuccess(provider.id, elapsed)
      } else {
        // Provider 搜索失败
        this.healthManager.markFailure(provider.id)
        monitoring.providerMetrics.recordSearchFail(provider.id)
      }
    }

    // P4.5: 记录搜索指标
    const searchElapsed = performance.now() - searchStart
    monitoring.recordSearch(kw, searchElapsed, allItems.length, false)

    // 标准化去重（标题归一化）
    const merged = this._dedupAndMerge(allItems)
    const providersList = Array.from(contributedProviders)

    // 写缓存
    this.searchCache.set(cacheKey, { items: merged, providers: providersList, ts: Date.now() })

    return { items: merged, providers: providersList, totalResults: merged.length }
  }

  // ==================== 详情聚合 ====================

  /**
   * 多源详情聚合
   * 从多个 Provider 获取同一媒体的详情，合并 sources
   */
  async aggregateDetail(mediaId: string, keyword?: string): Promise<AggregatedMediaDetail | null> {
    const cacheKey = mediaId
    const cached = this.detailCache.get(cacheKey)
    if (cached && Date.now() - cached.ts < this.DETAIL_CACHE_TTL) {
      return cached.detail
    }

    const providers = this._getSearchableProviders()
    if (providers.length === 0) return null

    const results = await Promise.allSettled(
      providers.map(async (p) => {
        // 先用 search 找到对应的 mediaId，再调 detail
        if (keyword) {
          const searchResults = await p.search(keyword)
          const match = searchResults.find(
            (item) => item.id === mediaId || item.title === keyword,
          )
          if (match) {
            return { provider: p, detail: await p.detail(match.id) }
          }
        }
        // fallback: 直接用 mediaId 调 detail
        try {
          return { provider: p, detail: await p.detail(mediaId) }
        } catch {
          return null
        }
      }),
    )

    const sources: MediaDetailSource[] = []
    let title = ''
    let cover = ''
    let description = ''
    const providerIds: string[] = []

    for (let i = 0; i < results.length; i++) {
      const r = results[i]

      if (r.status === 'fulfilled' && r.value?.detail) {
        const { provider, detail } = r.value
        providerIds.push(provider.id)
        this.healthManager.markSuccess(provider.id)

        if (!title) title = detail.title
        if (!cover) cover = detail.cover
        if (!description) description = detail.description

        sources.push({
          providerId: provider.id,
          providerName: provider.name,
          episodes: detail.episodes.map((ep) => ({
            id: ep.id,
            title: ep.title,
            episodeNumber: ep.episodeNumber,
          })),
        })
      } else if (r.status === 'rejected') {
        this.healthManager.markFailure(providers[i].id)
      }
    }

    if (sources.length === 0) return null

    const detail: AggregatedMediaDetail = {
      mediaId,
      title,
      cover,
      description,
      sources,
      providerIds,
    }

    this.detailCache.set(cacheKey, { detail, ts: Date.now() })
    return detail
  }

  // ==================== Provider 管理 ====================

  /** 获取所有可用的 Provider（已注册 + 健康/降级，排除 OFFLINE） */
  private _getSearchableProviders(): IProvider[] {
    const all = providerFacade.getEnabledProviders()
    const healthyIds = new Set(this.healthManager.getHealthyProviderIds())

    // 注册未追踪的 Provider
    for (const p of all) {
      if (!this.healthManager.allStates.has(p.id)) {
        this.healthManager.register(p.id, p.name)
      }
    }

    const searchable = all.filter((p) => {
      // 已注册到 healthManager → 检查健康状态
      if (this.healthManager.allStates.has(p.id)) {
        return this.healthManager.isHealthy(p.id)
      }
      return p.enabled
    })

    // 按 priority 排序（低 priority 值 = 高优先级）
    return searchable.sort((a, b) => a.priority - b.priority)
  }

  /** 获取 Provider 排名列表（按加权评分） */
  getRankedProviders(): string[] {
    const providers = providerFacade.getEnabledProviders()
    const scores: ProviderScore[] = providers.map((p) => {
      const state = this.healthManager.allStates.get(p.id)
      return {
        providerId: p.id,
        successRate: state
          ? state.status === ProviderHealthStatus.HEALTHY
            ? 1.0
            : state.status === ProviderHealthStatus.DEGRADED
              ? 0.5
              : 0.0
          : 1.0,
        responseTime: 1000, // 默认 1s，后续从健康检查更新
        priority: p.priority,
      }
    })
    return this.ranker.rank(scores)
  }

  /** 获取所有 Provider 健康快照 */
  getHealthSnapshots(): ProviderHealthSnapshot[] {
    return this.healthManager.getAllSnapshots()
  }

  /** 获取健康 Provider ID 列表 */
  getHealthyProviderIds(): string[] {
    return this.healthManager.getHealthyProviderIds()
  }

  // ==================== 缓存 ====================

  clearSearchCache(keyword?: string): void {
    if (keyword) {
      this.searchCache.delete(keyword.toLowerCase())
    } else {
      this.searchCache.clear()
    }
  }

  clearDetailCache(mediaId?: string): void {
    if (mediaId) {
      this.detailCache.delete(mediaId)
    } else {
      this.detailCache.clear()
    }
  }

  // ==================== 订阅 ====================

  subscribe(callback: Subscriber): () => void {
    this.subscribers.add(callback)
    return () => { this.subscribers.delete(callback) }
  }

  private _notify(): void {
    this.subscribers.forEach((fn) => {
      try { fn() } catch { /* ignore */ }
    })
  }

  // ==================== 内部：去重合并 ====================

  /**
   * 标准化标题 → 去重合并
   * 同名结果保留评分最高的，同时合并 providerIds
   */
  private _dedupAndMerge(
    entries: Array<{ item: MediaItem; providerId: string }>,
  ): AggregatedSearchItem[] {
    // 按归一化标题分组
    const groups = new Map<string, AggregatedSearchItem>()

    for (const { item, providerId } of entries) {
      const key = this._normalize(item.title)

      const existing = groups.get(key)
      if (existing) {
        // 合并 providerIds
        if (!existing.providerIds.includes(providerId)) {
          existing.providerIds.push(providerId)
        }
        // 保留评分更高的
        const existingScore = item.score ?? 0
        if (existingScore > 0 || !existing.description) {
          // keep existing (better scored)
        }
      } else {
        groups.set(key, {
          mediaId: item.id,
          title: item.title,
          cover: item.cover,
          description: item.remark,
          providerIds: [providerId],
        })
      }
    }

    return Array.from(groups.values())
  }

  /**
   * 标题标准化：去空格、去括号、去特殊字符、统一小写
   * "斗罗大陆（国语）" → "斗罗大陆"
   * "Douluo Dalu" → "douluodalu"
   */
  private _normalize(title: string): string {
    return title
      .toLowerCase()
      .replace(/[\s　]+/g, '')
      .replace(/[（(][^）)]*[）)]/g, '')
      .replace(/[·•・∙·]/g, '')
      .replace(/[：:：]/g, '')
      .replace(/[^\w一-鿿぀-ゟ゠-ヿ]/g, '')
  }
}
