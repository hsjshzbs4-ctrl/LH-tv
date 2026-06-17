// src/platform/data/warehouse/EventWarehouse.ts — 事件仓库
// 分区存储 + 保留策略，通过 storageService 持久化每日摘要
// 原始事件仅保留 30 天，每日聚合指标永久保留

import type { UnifiedEvent, DailyMetrics } from '../types/data.types'
import { storageService } from '@/shared/storage/storage.service'
import { dataPipeline } from '../pipeline/DataPipeline'

const WAREHOUSE_KEY = 'pb5_event_warehouse'
const RAW_RETENTION_DAYS = 30
const MAX_RAW_EVENTS = 10000

interface WarehouseData {
  dailyMetrics: Record<string, DailyMetrics>
  lastUpdated: number
}

export class EventWarehouse {
  private dailyMetrics = new Map<string, DailyMetrics>()
  private allEvents: UnifiedEvent[] = []
  private unsubscribe: (() => void) | null = null

  /** 启动仓储 (订阅 DataPipeline) */
  async start(): Promise<void> {
    // 从持久化加载
    await this.load()

    this.unsubscribe = dataPipeline.onFlush((event) => {
      this.allEvents.push(event)
      // 容量限制: 移除最旧的事件
      while (this.allEvents.length > MAX_RAW_EVENTS) {
        this.allEvents.shift()
      }
    })
  }

  /** 停止仓储 */
  stop(): void {
    this.unsubscribe?.()
    this.unsubscribe = null
  }

  /** 存储每日指标 */
  async storeDailyMetrics(metrics: DailyMetrics): Promise<void> {
    this.dailyMetrics.set(metrics.date, metrics)
    await this.persist()
  }

  /** 查询每日指标 */
  getDailyMetrics(date: string): DailyMetrics | null {
    return this.dailyMetrics.get(date) ?? null
  }

  /** 查询日期范围的指标 */
  queryDateRange(from: string, to: string): DailyMetrics[] {
    const result: DailyMetrics[] = []
    for (const [date, metrics] of this.dailyMetrics) {
      if (date >= from && date <= to) {
        result.push(metrics)
      }
    }
    return result.sort((a, b) => a.date.localeCompare(b.date))
  }

  /** 查询原始事件 */
  queryRaw(filter?: {
    category?: string
    source?: string
    from?: number
    to?: number
    limit?: number
  }): UnifiedEvent[] {
    let events = this.allEvents

    if (filter?.category) {
      events = events.filter((e) => e.category === filter.category)
    }
    if (filter?.source) {
      events = events.filter((e) => e.source === filter.source)
    }
    if (filter?.from) {
      events = events.filter((e) => e.timestamp >= filter.from!)
    }
    if (filter?.to) {
      events = events.filter((e) => e.timestamp <= filter.to!)
    }

    const limit = filter?.limit ?? 100
    return events.slice(-limit)
  }

  /** 清理过期数据 (30 天保留策略) */
  async purgeExpired(): Promise<void> {
    const cutoff = Date.now() - RAW_RETENTION_DAYS * 24 * 60 * 60 * 1000
    this.allEvents = this.allEvents.filter((e) => e.timestamp > cutoff)
    await this.persist()
  }

  /** 总事件数 */
  get totalEvents(): number {
    return this.allEvents.length
  }

  // ── 内部 ──

  private async load(): Promise<void> {
    try {
      const settings = await storageService.getSettings()
      const raw = settings[WAREHOUSE_KEY]
      if (raw && typeof raw === 'string') {
        const data = JSON.parse(raw) as WarehouseData
        for (const [date, metrics] of Object.entries(data.dailyMetrics)) {
          this.dailyMetrics.set(date, metrics)
        }
      }
    } catch {
      // 无持久化数据
    }
  }

  private async persist(): Promise<void> {
    const data: WarehouseData = {
      dailyMetrics: Object.fromEntries(this.dailyMetrics),
      lastUpdated: Date.now(),
    }
    await storageService.setSettings({ [WAREHOUSE_KEY]: JSON.stringify(data) })
  }
}

export const eventWarehouse = new EventWarehouse()
