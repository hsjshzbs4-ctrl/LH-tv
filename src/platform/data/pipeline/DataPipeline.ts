// src/platform/data/pipeline/DataPipeline.ts — 统一数据摄入管线
// 适配器模式：通过 IIngestionSource 订阅现有遥测系统，不修改源

import type {
  UnifiedEvent,
  IIngestionSource,
  DataPipelineConfig,
} from '../types/data.types'
import { DEFAULT_PIPELINE_CONFIG } from '../types/data.types'
import { featureFlagManager, FeatureState } from '@platform/flags'

type EventHandler = (event: UnifiedEvent) => void

export class DataPipeline {
  /** 已注册的摄入源 */
  private sources = new Map<string, IIngestionSource>()
  /** 事件缓冲区 */
  private buffer: UnifiedEvent[] = []
  /** 事件处理器 */
  private handlers = new Set<EventHandler>()
  /** 刷新定时器 */
  private flushTimer: ReturnType<typeof setInterval> | null = null
  /** 是否运行中 */
  private running = false
  /** 配置 */
  private config: DataPipelineConfig

  constructor(config?: Partial<DataPipelineConfig>) {
    this.config = { ...DEFAULT_PIPELINE_CONFIG, ...config }
  }

  // ── 生命周期 ──

  /** 启动管线 */
  async start(): Promise<void> {
    if (!featureFlagManager.isEnabled('pb5.data')) return
    if (this.running) return

    // 启动所有摄入源
    for (const source of this.sources.values()) {
      try {
        source.onEvent((event) => this.ingest(event))
        await source.start()
      } catch {
        // 单个源失败不阻断管线
      }
    }

    // 启动自动刷新
    if (this.config.flushIntervalMs > 0) {
      this.flushTimer = setInterval(() => this.flush(), this.config.flushIntervalMs)
    }

    this.running = true
  }

  /** 停止管线 */
  async stop(): Promise<void> {
    if (!this.running) return

    // 停止定时器
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = null
    }

    // 停 flush 残留数据
    await this.flush()

    // 停止所有摄入源
    for (const source of this.sources.values()) {
      try { await source.stop() } catch { /* silent */ }
    }

    this.running = false
  }

  // ── 摄入源管理 ──

  /** 注册摄入源 */
  registerSource(source: IIngestionSource): void {
    this.sources.set(source.name, source)
  }

  /** 移除摄入源 */
  unregisterSource(name: string): void {
    this.sources.delete(name)
  }

  /** 获取已注册的摄入源 */
  getSources(): IIngestionSource[] {
    return Array.from(this.sources.values())
  }

  // ── 事件摄入 ──

  /** 摄入单个事件 (适配器调用) */
  ingest(event: UnifiedEvent): void {
    // 去重
    if (this.buffer.some((e) => e.id === event.id)) return

    this.buffer.push(event)

    // 缓冲区满时立即刷新
    if (this.buffer.length >= this.config.maxBufferSize) {
      this.flush()
    }
  }

  /** 批量摄入 */
  ingestBatch(events: UnifiedEvent[]): void {
    for (const event of events) {
      this.ingest(event)
    }
  }

  // ── 事件消费 ──

  /** 注册事件处理器 (MetricsAggregator, EventWarehouse 等) */
  onFlush(handler: EventHandler): () => void {
    this.handlers.add(handler)
    return () => this.handlers.delete(handler)
  }

  /** 刷新缓冲区到所有处理器 */
  flush(): void {
    if (this.buffer.length === 0) return

    const batch = this.buffer.splice(0)
    for (const handler of this.handlers) {
      try {
        for (const event of batch) {
          handler(event)
        }
      } catch {
        // 单个处理器失败不阻断其他处理器
      }
    }
  }

  // ── 查询 ──

  /** 缓冲区大小 */
  get bufferSize(): number {
    return this.buffer.length
  }

  /** 是否运行中 */
  get isRunning(): boolean {
    return this.running
  }
}

/** 全局单例 */
export const dataPipeline = new DataPipeline()
