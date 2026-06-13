// src/core/aggregation/facade/AggregationFacade.ts - 聚合门面（View 层唯一切入点）
// P4.1 Multi-Source Aggregation Engine
//
// 禁止 View 直接访问 AggregationEngine / ProviderHealthManager / ProviderRanker

import { AggregationEngine } from '../engine/AggregationEngine'
import type {
  AggregatedSearchResponse,
  AggregatedMediaDetail,
  ProviderHealthSnapshot,
} from '../types/aggregation.types'

export class AggregationFacade {
  private engine = new AggregationEngine()

  /** 多源聚合搜索 */
  async search(keyword: string): Promise<AggregatedSearchResponse> {
    return this.engine.aggregateSearch(keyword)
  }

  /** 多源聚合详情 */
  async detail(mediaId: string, keyword?: string): Promise<AggregatedMediaDetail | null> {
    return this.engine.aggregateDetail(mediaId, keyword)
  }

  /** 获取 Provider 排名 */
  getRankedProviders(): string[] {
    return this.engine.getRankedProviders()
  }

  /** 获取健康 Provider ID 列表 */
  getHealthyProviders(): string[] {
    return this.engine.getHealthyProviderIds()
  }

  /** 获取所有 Provider 健康快照（开发模式/调试用） */
  getHealthSnapshots(): ProviderHealthSnapshot[] {
    return this.engine.getHealthSnapshots()
  }

  /** 清空搜索缓存 */
  clearSearchCache(keyword?: string): void {
    this.engine.clearSearchCache(keyword)
  }

  /** 清空详情缓存 */
  clearDetailCache(mediaId?: string): void {
    this.engine.clearDetailCache(mediaId)
  }

  /** 订阅变更 */
  subscribe(callback: () => void): () => void {
    return this.engine.subscribe(callback)
  }
}

/** 全局单例 */
export const aggregationFacade = new AggregationFacade()
