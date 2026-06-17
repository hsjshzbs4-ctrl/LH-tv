// src/platform/data/index.ts — S5-6 Data Platform Foundation 统一导出

// Types
export {
  EventCategory,
  EventSource,
  type UnifiedEvent,
  type IIngestionSource,
  type DailyMetrics,
  type RealtimeMetrics,
  type DataPipelineConfig,
  DEFAULT_PIPELINE_CONFIG,
} from './types/data.types'

// Pipeline
export { DataPipeline, dataPipeline } from './pipeline/DataPipeline'

// Aggregation
export { MetricsAggregator, metricsAggregator } from './aggregation/MetricsAggregator'

// Warehouse
export { EventWarehouse, eventWarehouse } from './warehouse/EventWarehouse'
