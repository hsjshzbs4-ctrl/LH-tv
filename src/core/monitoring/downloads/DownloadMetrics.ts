// src/core/monitoring/downloads/DownloadMetrics.ts - 下载维度指标
// P4.5 Monitoring Center

import { MetricsCollector } from '../metrics/MetricsCollector'

export class DownloadMetricsTracker {
  constructor(private collector: MetricsCollector) {}

  recordDownloadStart(): void {
    this.collector.increment('download.started')
    this.collector.gauge('download.active', this.getActiveCount() + 1)
  }

  recordDownloadSuccess(bytes: number, speed: number): void {
    this.collector.increment('download.success')
    this.collector.record('download.speed', speed)
    this.collector.record('download.bytes', bytes)
    this.collector.gauge('download.active', Math.max(0, this.getActiveCount() - 1))
  }

  recordDownloadFail(): void {
    this.collector.increment('download.fail')
    this.collector.gauge('download.active', Math.max(0, this.getActiveCount() - 1))
  }

  getActiveCount(): number {
    return this.collector.getSum('download.active')
  }

  getSuccessRate(): number {
    const success = this.collector.getCount('download.success')
    const fail = this.collector.getCount('download.fail')
    const total = success + fail
    return total > 0 ? success / total : 1
  }

  getAvgSpeed(): number {
    const stats = this.collector.getStats('download.speed')
    return stats?.avg || 0
  }

  getTotalBytes(): number {
    return this.collector.getSum('download.bytes')
  }
}
