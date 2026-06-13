// src/core/monitoring/index.ts - P4.5 Monitoring Center
// 统一监控：Provider / 搜索 / 播放 / 下载 / Worker 指标

export { MonitoringFacade, monitoring } from './facade/MonitoringFacade'
export { DashboardManager } from './dashboard/DashboardManager'
export { MetricsCollector } from './metrics/MetricsCollector'
export { ProviderMetricsTracker } from './providers/ProviderMetrics'
export { DownloadMetricsTracker } from './downloads/DownloadMetrics'
export { PlaybackMetricsTracker } from './playback/PlaybackMetrics'
export type {
  ProviderMetrics,
  ProviderStats,
  SearchMetrics,
  PlaybackMetrics as PlaybackMetricsData,
  DownloadMetrics as DownloadMetricsData,
  WorkerMetrics,
  DashboardData,
  MetricRecord,
} from './types/monitor.types'
