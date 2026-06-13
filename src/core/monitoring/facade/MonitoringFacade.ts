// src/core/monitoring/facade/MonitoringFacade.ts - 监控门面
// P4.5 Monitoring Center
//
// View 层唯一切入点：指标记录 + Dashboard 数据
// 禁止 View 直接访问 MetricsCollector / DashboardManager

import { DashboardManager } from '../dashboard/DashboardManager'
import type { DashboardData } from '../types/monitor.types'

export class MonitoringFacade {
  private dashboard = new DashboardManager()

  // ==================== 快捷访问 ====================

  get collector() { return this.dashboard.collector }
  get providerMetrics() { return this.dashboard.providerMetrics }
  get downloadMetrics() { return this.dashboard.downloadMetrics }
  get playbackMetrics() { return this.dashboard.playbackMetrics }

  // ==================== 搜索指标 ====================

  recordSearch(keyword: string, responseTime: number, resultCount: number, cacheHit: boolean): void {
    this.collector.increment('search.total')
    this.collector.record('search.latency', responseTime)
    this.collector.record('search.result_count', resultCount)
    if (cacheHit) this.collector.increment('search.cache_hit')
  }

  // ==================== Dashboard ====================

  getDashboard(): DashboardData {
    return this.dashboard.getDashboard()
  }

  /** 同步 Provider 列表（从 ProviderRegistry） */
  syncProviders(providers: Array<{ id: string; name: string; health: string; restartCount: number }>): void {
    this.dashboard.setProviders(providers)
  }

  /** 同步 Worker 状态（从 WorkerPool） */
  syncWorkerStates(states: Array<{
    providerId: string; status: string; isolated: boolean
    restartCount: number; totalCalls: number; failedCalls: number; memoryMB: number
  }>): void {
    this.dashboard.setWorkerStates(states)
  }

  // ==================== 导出 ====================

  exportJSON(): string {
    return JSON.stringify(this.getDashboard(), null, 2)
  }

  exportCSV(): string {
    const d = this.getDashboard()
    const headers = ['Provider', 'SuccessRate', 'AvgLatency', 'Health', 'Restarts']
    const rows = d.providerStats.map(p =>
      [p.providerName, p.successRate.toFixed(2), p.avgLatency.toFixed(0), p.health, String(p.restartCount)]
    )
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  }

  reset(): void {
    this.collector.resetAll()
  }
}

/** 全局单例 */
export const monitoring = new MonitoringFacade()
