// src/governance/event/GovernanceEventBus.ts — 全局唯一事件总线
// PB7-S6: Priority 排序, FIFO 同优先级, dispatchSync/Async/flush
// 审查要求: 单例, 全局唯一, 禁止模块自行创建 EventBus

import { featureFlagManager } from '@platform/flags'
import { Priority, GovernanceEventType } from '../contracts'
import type { GovernanceEvent, EventListener } from '../contracts'

export class GovernanceEventBus {
  private static instance: GovernanceEventBus

  private subscribers = new Map<GovernanceEventType, Array<{ listener: EventListener; priority: Priority }>>()
  private wildcards: Array<{ listener: EventListener; priority: Priority }> = []
  private asyncQueue: GovernanceEvent[] = []
  private processing = false

  static getInstance(): GovernanceEventBus {
    if (!GovernanceEventBus.instance) {
      GovernanceEventBus.instance = new GovernanceEventBus()
    }
    return GovernanceEventBus.instance
  }

  private constructor() {
    this.ensureEnabled()
  }

  /** 订阅 */
  subscribe(type: GovernanceEventType, listener: EventListener, priority = Priority.NORMAL): () => void {
    let list = this.subscribers.get(type)
    if (!list) { list = []; this.subscribers.set(type, list) }
    const entry = { listener, priority }
    list.push(entry)
    list.sort((a, b) => b.priority - a.priority) // 高优先在前
    return () => {
      const idx = list!.indexOf(entry)
      if (idx >= 0) list!.splice(idx, 1)
    }
  }

  /** 订阅所有事件 */
  subscribeAll(listener: EventListener, priority = Priority.NORMAL): () => void {
    const entry = { listener, priority }
    this.wildcards.push(entry)
    this.wildcards.sort((a, b) => b.priority - a.priority)
    return () => {
      const idx = this.wildcards.indexOf(entry)
      if (idx >= 0) this.wildcards.splice(idx, 1)
    }
  }

  /** 发布 (同步优先) */
  publish(type: GovernanceEventType, source: string, payload: Record<string, unknown> = {}, priority = Priority.NORMAL): void {
    const event: GovernanceEvent = {
      id: `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,6)}`,
      type, priority, source, payload, timestamp: Date.now(),
    }
    this.dispatchSync(event)
  }

  /** 同步分发 (CRITICAL/HIGH 事件) */
  dispatchSync(event: GovernanceEvent): void {
    const targets = this.subscribers.get(event.type) ?? []
    for (const { listener } of targets) {
      try { listener(event) } catch { /* isolate */ }
    }
    for (const { listener } of this.wildcards) {
      try { listener(event) } catch { /* isolate */ }
    }
  }

  /** 异步分发 (LOW/NORMAL 可批处理) */
  dispatchAsync(event: GovernanceEvent): void {
    this.asyncQueue.push(event)
    this.asyncQueue.sort((a, b) => b.priority - a.priority) // 高优先在前
    if (!this.processing) this.scheduleFlush()
  }

  /** 刷新异步队列 */
  flush(): void {
    while (this.asyncQueue.length > 0) {
      const event = this.asyncQueue.shift()!
      this.dispatchSync(event)
    }
    this.processing = false
  }

  /** 等待空闲 */
  async waitUntilIdle(): Promise<void> {
    while (this.asyncQueue.length > 0) {
      this.flush()
      await new Promise((r) => setTimeout(r, 0))
    }
  }

  unsubscribe(type: GovernanceEventType, listener: EventListener): void {
    const list = this.subscribers.get(type)
    if (list) {
      const idx = list.findIndex((e) => e.listener === listener)
      if (idx >= 0) list.splice(idx, 1)
    }
  }

  clear(): void {
    this.subscribers.clear()
    this.wildcards = []
    this.asyncQueue = []
  }

  private scheduleFlush(): void {
    this.processing = true
    setTimeout(() => this.flush(), 0)
  }

  private ensureEnabled(): void {
    if (!featureFlagManager.isEnabled('pb7.governance')) {
      throw new Error('Governance is not enabled. Enable pb7.governance feature flag.')
    }
  }
}
