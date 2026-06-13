// src/core/monitoring/metrics/MetricsCollector.ts - 统一指标收集器
// P4.5 Monitoring Center
//
// 职责：高性能指标收集 (record/increment/gauge/getStats)
// 性能：Map 存储 O(1)，开销 <1%
// 禁止：UI、阻塞操作

import type { MetricRecord } from '../types/monitor.types'

/** 指标值（支持计数器 + 直方图） */
interface MetricEntry {
  /** 累计值 */
  sum: number
  /** 计数（用于计算平均值） */
  count: number
  /** 最小值 */
  min: number
  /** 最大值 */
  max: number
  /** 最后更新时间 */
  lastUpdated: number
  /** 标签维度数据 */
  tags: Map<string, { sum: number; count: number }>
}

export class MetricsCollector {
  private metrics = new Map<string, MetricEntry>()
  private records: MetricRecord[] = []
  private readonly MAX_RECORDS = 10_000

  // ==================== 记录 ====================

  /** 记录一个值（累加） */
  record(name: string, value: number, tags?: Record<string, string>): void {
    let entry = this.metrics.get(name)
    if (!entry) {
      entry = { sum: 0, count: 0, min: Infinity, max: -Infinity, lastUpdated: 0, tags: new Map() }
      this.metrics.set(name, entry)
    }

    entry.sum += value
    entry.count++
    entry.min = Math.min(entry.min, value)
    entry.max = Math.max(entry.max, value)
    entry.lastUpdated = Date.now()

    // 标签维度
    if (tags) {
      const tagKey = Object.entries(tags).sort().map(([k, v]) => `${k}=${v}`).join(',')
      let tagEntry = entry.tags.get(tagKey)
      if (!tagEntry) {
        tagEntry = { sum: 0, count: 0 }
        entry.tags.set(tagKey, tagEntry)
      }
      tagEntry.sum += value
      tagEntry.count++
    }

    // 历史记录（限制条数）
    this.records.push({ name, value, tags, timestamp: Date.now() })
    if (this.records.length > this.MAX_RECORDS) {
      this.records = this.records.slice(-this.MAX_RECORDS / 2)
    }
  }

  /** 计数器 +1 */
  increment(name: string, tags?: Record<string, string>): void {
    this.record(name, 1, tags)
  }

  /** 设置仪表值（覆盖，不计入统计） */
  gauge(name: string, value: number): void {
    const entry = this.metrics.get(name)
    if (entry) {
      entry.sum = value
      entry.lastUpdated = Date.now()
    } else {
      this.metrics.set(name, { sum: value, count: 0, min: value, max: value, lastUpdated: Date.now(), tags: new Map() })
    }
  }

  // ==================== 查询 ====================

  /** 获取指标统计 */
  getStats(name: string): { sum: number; count: number; avg: number; min: number; max: number } | null {
    const entry = this.metrics.get(name)
    if (!entry) return null
    return {
      sum: entry.sum,
      count: entry.count,
      avg: entry.count > 0 ? entry.sum / entry.count : 0,
      min: entry.min === Infinity ? 0 : entry.min,
      max: entry.max === -Infinity ? 0 : entry.max,
    }
  }

  /** 获取计数器值 */
  getCount(name: string): number {
    const entry = this.metrics.get(name)
    return entry?.count || 0
  }

  /** 获取累计值 */
  getSum(name: string): number {
    const entry = this.metrics.get(name)
    return entry?.sum || 0
  }

  /** 获取所有指标名称 */
  getMetricNames(): string[] {
    return Array.from(this.metrics.keys())
  }

  /** 获取最近记录 */
  getRecentRecords(limit = 100): MetricRecord[] {
    return this.records.slice(-limit)
  }

  // ==================== 管理 ====================

  /** 重置指定指标 */
  reset(name: string): void {
    this.metrics.delete(name)
  }

  /** 重置全部 */
  resetAll(): void {
    this.metrics.clear()
    this.records = []
  }
}
