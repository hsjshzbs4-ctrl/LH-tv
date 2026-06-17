// src/platform/data/aggregation/MetricsAggregator.ts — 指标聚合器
// 从 DataPipeline 消费 UnifiedEvent，计算实时和每日指标

import type { UnifiedEvent, DailyMetrics, RealtimeMetrics } from '../types/data.types'
import { EventCategory } from '../types/data.types'
import { dataPipeline } from '../pipeline/DataPipeline'

/** 滑动窗口计数器 */
class WindowedCounter {
  private buckets = new Map<string, number[]>()
  private windowMs: number

  constructor(windowMs: number = 5 * 60 * 1000) {
    this.windowMs = windowMs
  }

  /** 添加计数 */
  increment(key: string): void {
    const now = Date.now()
    let entries = this.buckets.get(key)
    if (!entries) {
      entries = []
      this.buckets.set(key, entries)
    }
    entries.push(now)
    // 清理过期条目
    this.prune(key, entries, now)
  }

  /** 获取窗口内计数 */
  count(key: string): number {
    const entries = this.buckets.get(key)
    if (!entries) return 0
    this.prune(key, entries, Date.now())
    return entries.length
  }

  private prune(key: string, entries: number[], now: number): void {
    const cutoff = now - this.windowMs
    this.buckets.set(key, entries.filter((t) => t > cutoff))
  }
}

export class MetricsAggregator {
  private dailyEvents: UnifiedEvent[] = []
  private dailyDate: string = ''
  private realtimeCounter = new WindowedCounter()
  private errorCounter = new WindowedCounter()
  private activeUsers = new Set<string>()
  private unsubscribe: (() => void) | null = null

  /** 启动聚合 (订阅 DataPipeline) */
  start(): void {
    this.unsubscribe = dataPipeline.onFlush((event) => this.process(event))
  }

  /** 停止聚合 */
  stop(): void {
    this.unsubscribe?.()
    this.unsubscribe = null
  }

  /** 获取今日指标 */
  getDailyMetrics(): DailyMetrics {
    this.ensureDailyRotation()

    const totalWatchTime = this.dailyEvents
      .filter((e) => e.category === EventCategory.PLAYBACK)
      .reduce((sum, e) => sum + ((e.payload.durationMs as number) || 0), 0)

    const playbackStarts = this.dailyEvents.filter(
      (e) => e.name === 'playback:start',
    ).length

    const playbackErrors = this.dailyEvents.filter(
      (e) => e.name === 'playback:error',
    ).length

    const crashCount = this.dailyEvents.filter(
      (e) => e.category === EventCategory.RECOVERY && e.name === 'crash',
    ).length

    const recoveryCount = this.dailyEvents.filter(
      (e) => e.category === EventCategory.RECOVERY && e.name === 'recovery',
    ).length

    const categoryBreakdown: Record<string, number> = {}
    for (const e of this.dailyEvents) {
      categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + 1
    }

    return {
      date: this.dailyDate,
      totalEvents: this.dailyEvents.length,
      activeUsers: this.activeUsers.size,
      totalWatchTimeMs: totalWatchTime,
      playbackStarts,
      playbackErrors,
      crashCount,
      recoveryCount,
      avgSessionDurationMs: 0, // 由 SessionAdapter 计算
      categoryBreakdown,
    }
  }

  /** 获取实时指标 (5 分钟窗口) */
  getRealtimeMetrics(): RealtimeMetrics {
    return {
      timestamp: Date.now(),
      eventsPerMinute: this.realtimeCounter.count('events'),
      activeUsersLast5Min: this.activeUsers.size,
      errorsLast5Min: this.errorCounter.count('errors'),
      ingestBacklog: dataPipeline.bufferSize,
    }
  }

  // ── 内部 ──

  private process(event: UnifiedEvent): void {
    this.ensureDailyRotation()

    this.dailyEvents.push(event)
    this.realtimeCounter.increment('events')

    if (event.payload.userId) {
      this.activeUsers.add(event.payload.userId as string)
    }

    if (
      event.name.includes('error') ||
      event.category === EventCategory.RECOVERY
    ) {
      this.errorCounter.increment('errors')
    }
  }

  private ensureDailyRotation(): void {
    const today = new Date().toISOString().split('T')[0]
    if (this.dailyDate !== today) {
      this.dailyEvents = []
      this.dailyDate = today
      this.activeUsers.clear()
    }
  }
}

export const metricsAggregator = new MetricsAggregator()
