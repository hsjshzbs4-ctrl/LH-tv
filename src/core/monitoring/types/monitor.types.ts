// src/core/monitoring/types/monitor.types.ts - 监控中心类型定义
// P4.5 Monitoring Center

// ==================== Provider 指标 ====================

export interface ProviderMetrics {
  providerId: string
  providerName: string
  /** 搜索成功次数 */
  searchSuccess: number
  /** 搜索失败次数 */
  searchFail: number
  /** 详情调用次数 */
  detailCalls: number
  /** 平均响应时间 (ms) */
  avgResponseTime: number
  /** 最后成功时间 */
  lastSuccessAt: number
  /** 最后失败时间 */
  lastFailureAt: number
  /** Worker 重启次数 */
  restartCount: number
  /** Worker 崩溃次数 */
  crashCount: number
  /** 健康状态 */
  health: string
}

export interface ProviderStats {
  providerId: string
  providerName: string
  successRate: number
  avgLatency: number
  restartCount: number
  health: string
}

// ==================== 搜索指标 ====================

export interface SearchMetrics {
  /** 总搜索次数 */
  totalSearches: number
  /** 缓存命中次数 */
  cacheHits: number
  /** 平均响应时间 (ms) */
  avgResponseTime: number
  /** 平均结果数 */
  avgResultCount: number
  /** 今日搜索次数 */
  todaySearches: number
  /** Provider 贡献次数 */
  providerContributions: Record<string, number>
}

// ==================== 播放指标 ====================

export interface PlaybackMetrics {
  /** 播放成功次数 */
  playSuccess: number
  /** 播放失败次数 */
  playFail: number
  /** 自动换源次数 */
  autoSwitchCount: number
  /** 手动换源次数 */
  manualSwitchCount: number
  /** 平均首帧时间 (ms) */
  avgFirstFrameTime: number
  /** 各 Provider 播放次数 */
  providerPlayCounts: Record<string, number>
  /** 换源成功率 */
  switchSuccessRate: number
}

// ==================== 下载指标 ====================

export interface DownloadMetrics {
  /** 下载成功数 */
  downloadSuccess: number
  /** 下载失败数 */
  downloadFail: number
  /** 活跃任务数 */
  activeTasks: number
  /** 平均速度 (bytes/s) */
  avgSpeed: number
  /** 总下载字节数 */
  totalBytes: number
}

// ==================== Worker 指标 ====================

export interface WorkerMetrics {
  providerId: string
  status: string
  isolated: boolean
  restartCount: number
  crashCount: number
  totalCalls: number
  failedCalls: number
  memoryMB: number
}

// ==================== Dashboard ====================

export interface DashboardData {
  /** 时间戳 */
  timestamp: number
  /** Provider 统计汇总 */
  providerStats: ProviderStats[]
  /** Provider 总数 */
  totalProviders: number
  /** 在线 Provider 数 */
  onlineProviders: number
  /** 失败 Provider 数 */
  failedProviders: number
  /** 搜索指标 */
  search: SearchMetrics
  /** 播放指标 */
  playback: PlaybackMetrics
  /** 下载指标 */
  download: DownloadMetrics
  /** Worker 指标 */
  workers: WorkerMetrics[]
  /** 总调用次数 */
  totalCalls: number
  /** 平均延迟 */
  avgLatency: number
}

// ==================== 指标记录 ====================

export interface MetricRecord {
  name: string
  value: number
  tags?: Record<string, string>
  timestamp: number
}
