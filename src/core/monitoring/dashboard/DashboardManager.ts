// src/core/monitoring/dashboard/DashboardManager.ts - Dashboard 数据聚合
// P4.5 Monitoring Center
//
// 职责：聚合各维度指标 → DashboardData
// 禁止：UI、持久化

import { MetricsCollector } from '../metrics/MetricsCollector'
import { ProviderMetricsTracker } from '../providers/ProviderMetrics'
import { DownloadMetricsTracker } from '../downloads/DownloadMetrics'
import { PlaybackMetricsTracker } from '../playback/PlaybackMetrics'
import type {
  DashboardData,
  ProviderStats,
  SearchMetrics,
  PlaybackMetrics,
  DownloadMetrics,
  WorkerMetrics,
} from '../types/monitor.types'

export class DashboardManager {
  collector = new MetricsCollector()
  providerMetrics = new ProviderMetricsTracker(this.collector)
  downloadMetrics = new DownloadMetricsTracker(this.collector)
  playbackMetrics = new PlaybackMetricsTracker(this.collector)

  /** 已知的 Provider 列表（由外部注入） */
  private knownProviders: Array<{ id: string; name: string; health: string; restartCount: number }> = []

  /** Worker 状态（由外部注入） */
  private workerStates: Array<{
    providerId: string; status: string; isolated: boolean
    restartCount: number; totalCalls: number; failedCalls: number; memoryMB: number
  }> = []

  // ==================== 数据注入 ====================

  setProviders(providers: Array<{ id: string; name: string; health: string; restartCount: number }>): void {
    this.knownProviders = providers
  }

  setWorkerStates(states: Array<{
    providerId: string; status: string; isolated: boolean
    restartCount: number; totalCalls: number; failedCalls: number; memoryMB: number
  }>): void {
    this.workerStates = states
  }

  // ==================== Dashboard 生成 ====================

  getDashboard(): DashboardData {
    const providerStats = this._buildProviderStats()
    const search = this._buildSearchMetrics()
    const playback = this._buildPlaybackMetrics()
    const download = this._buildDownloadMetrics()
    const workers = this._buildWorkerMetrics()

    return {
      timestamp: Date.now(),
      providerStats,
      totalProviders: this.knownProviders.length,
      onlineProviders: providerStats.filter(p => p.health === 'healthy' || p.health === 'degraded').length,
      failedProviders: providerStats.filter(p => p.health === 'offline' || p.health === 'failed').length,
      search,
      playback,
      download,
      workers,
      totalCalls: this.collector.getCount('provider.search.success') + this.collector.getCount('provider.search.fail'),
      avgLatency: this.collector.getStats('provider.search.latency')?.avg || 0,
    }
  }

  // ==================== 内部 ====================

  private _buildProviderStats(): ProviderStats[] {
    return this.knownProviders.map(p => ({
      providerId: p.id,
      providerName: p.name,
      successRate: this.providerMetrics.getProviderSuccessRate(p.id),
      avgLatency: this.collector.getStats('provider.search.latency')?.avg || 0,
      restartCount: p.restartCount,
      health: p.health,
    }))
  }

  private _buildSearchMetrics(): SearchMetrics {
    const totalSearches = this.collector.getCount('search.total')
    const cacheHits = this.collector.getCount('search.cache_hit')
    const avgResponseTime = this.collector.getStats('search.latency')?.avg || 0
    const avgResultCount = this.collector.getStats('search.result_count')?.avg || 0

    return {
      totalSearches,
      cacheHits,
      avgResponseTime,
      avgResultCount,
      todaySearches: totalSearches,
      providerContributions: {},
    }
  }

  private _buildPlaybackMetrics(): PlaybackMetrics {
    return {
      playSuccess: this.collector.getCount('playback.success'),
      playFail: this.collector.getCount('playback.fail'),
      autoSwitchCount: this.playbackMetrics.getAutoSwitchCount(),
      manualSwitchCount: this.collector.getCount('playback.manual_switch'),
      avgFirstFrameTime: this.playbackMetrics.getAvgFirstFrameTime(),
      providerPlayCounts: {},
      switchSuccessRate: this.playbackMetrics.getPlaySuccessRate(),
    }
  }

  private _buildDownloadMetrics(): DownloadMetrics {
    return {
      downloadSuccess: this.collector.getCount('download.success'),
      downloadFail: this.collector.getCount('download.fail'),
      activeTasks: this.downloadMetrics.getActiveCount(),
      avgSpeed: this.downloadMetrics.getAvgSpeed(),
      totalBytes: this.downloadMetrics.getTotalBytes(),
    }
  }

  private _buildWorkerMetrics(): WorkerMetrics[] {
    return this.workerStates.map(w => ({
      providerId: w.providerId,
      status: w.status,
      isolated: w.isolated,
      restartCount: w.restartCount,
      crashCount: this.collector.getCount('provider.crash'),
      totalCalls: w.totalCalls,
      failedCalls: w.failedCalls,
      memoryMB: w.memoryMB,
    }))
  }
}
