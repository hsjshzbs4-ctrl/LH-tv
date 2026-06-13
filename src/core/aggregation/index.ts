// src/core/aggregation/index.ts - P4.1 Multi-Source Aggregation Engine
// 多源聚合搜索、详情聚合、Provider 健康管理、加权排序

export { AggregationFacade, aggregationFacade } from './facade/AggregationFacade'
export { AggregationEngine } from './engine/AggregationEngine'
export { ProviderHealthManager } from './health/ProviderHealthManager'
export { ProviderRanker } from './ranking/ProviderRanker'
export { ProviderHealthStatus } from './types/aggregation.types'
export type {
  ProviderScore,
  AggregatedSearchItem,
  AggregatedSearchResponse,
  AggregatedMediaDetail,
  MediaDetailSource,
  ProviderHealthSnapshot,
} from './types/aggregation.types'
