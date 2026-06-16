// src/integration/analytics/playbackAnalytics.ts — PB2-S2 Playback Analytics Dashboard
// 只读使用 PB1 Telemetry，不修改 telemetry schema

import { getTelemetryService } from '@/telemetry'

export interface PlaybackAnalyticsSnapshot {
  watchTimeTotal: number
  completionRate: number
  episodeDropoff: Record<string, number>
  qualityUsage: Record<string, number>
  subtitleUsage: number
}

export class PlaybackAnalytics {
  /** 获取播放分析快照 */
  getSnapshot(): PlaybackAnalyticsSnapshot {
    const ts = getTelemetryService()
    const dashboard = ts.getDashboard()
    const allData = ts.exportAll()

    // 计算观看时长（从 session records）
    const watchTimeTotal = allData.sessionRecords.reduce(
      (sum, r) => sum + (r.duration || 0), 0,
    )

    // 计算完成率
    const completionRate = allData.sessionEvents.length > 0
      ? allData.sessionEvents.filter(e => e.type === 'session-end').length / allData.sessionEvents.length
      : 0

    // 剧集 drop-off（从 session 事件推断）
    const episodeDropoff: Record<string, number> = {}
    for (const record of allData.sessionRecords) {
      const key = record.sessionId
      episodeDropoff[key] = (episodeDropoff[key] || 0) + 1
    }

    // 画质使用（从 session metrics 推断，stub）
    const qualityUsage: Record<string, number> = { 'Auto': 100 }

    return {
      watchTimeTotal: Math.round(watchTimeTotal / 60), // 转为分钟
      completionRate: Math.round(completionRate * 100),
      episodeDropoff,
      qualityUsage,
      subtitleUsage: 0,
    }
  }

  /** 刷新分析 */
  refresh(): PlaybackAnalyticsSnapshot {
    return this.getSnapshot()
  }
}

export const playbackAnalytics = new PlaybackAnalytics()
