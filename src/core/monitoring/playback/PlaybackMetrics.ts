// src/core/monitoring/playback/PlaybackMetrics.ts - 播放维度指标
// P4.5 Monitoring Center

import { MetricsCollector } from '../metrics/MetricsCollector'

export class PlaybackMetricsTracker {
  constructor(private collector: MetricsCollector) {}

  recordPlaySuccess(providerId: string, firstFrameTime: number): void {
    this.collector.increment('playback.success')
    this.collector.record('playback.first_frame', firstFrameTime, { provider: providerId })
    this.collector.increment('playback.provider_plays', { provider: providerId })
  }

  recordPlayFail(providerId: string): void {
    this.collector.increment('playback.fail')
    this.collector.increment('playback.provider_fails', { provider: providerId })
  }

  recordAutoSwitch(fromProvider: string, toProvider: string): void {
    this.collector.increment('playback.auto_switch')
    this.collector.increment('playback.auto_switch_detail', { from: fromProvider, to: toProvider })
  }

  recordManualSwitch(fromProvider: string, toProvider: string): void {
    this.collector.increment('playback.manual_switch')
  }

  getPlaySuccessRate(): number {
    const success = this.collector.getCount('playback.success')
    const fail = this.collector.getCount('playback.fail')
    const total = success + fail
    return total > 0 ? success / total : 1
  }

  getAutoSwitchCount(): number {
    return this.collector.getCount('playback.auto_switch')
  }

  getAvgFirstFrameTime(): number {
    const stats = this.collector.getStats('playback.first_frame')
    return stats?.avg || 0
  }
}
