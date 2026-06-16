// src/integration/events/integrationEvents.ts — PB2-S2 Integration Event Bus
// PATCH 5: 解耦 ContinueWatching/ProgressSync/Recommendation/Analytics
// 为 PB3 TV Mode / PB4 Android 提供统一事件订阅

export enum IntegrationEvent {
  PLAYER_RESUMED = 'integration:player_resumed',
  PLAYER_COMPLETED = 'integration:player_completed',
  PROGRESS_SYNCED = 'integration:progress_synced',
  RECOMMENDATION_READY = 'integration:recommendation_ready',
  WATCH_HISTORY_UPDATED = 'integration:watch_history_updated',
}

type EventPayload = Record<string, unknown>
type EventCallback = (payload: EventPayload) => void

class IntegrationEventBus {
  private listeners = new Map<IntegrationEvent, Set<EventCallback>>()

  /** 发布事件 */
  emit(event: IntegrationEvent, payload: EventPayload = {}): void {
    const subs = this.listeners.get(event)
    if (!subs) return
    for (const cb of subs) {
      try { cb({ ...payload, timestamp: Date.now() }) }
      catch { /* 静默 */ }
    }
  }

  /** 订阅事件 */
  on(event: IntegrationEvent, cb: EventCallback): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set())
    this.listeners.get(event)!.add(cb)
    return () => { this.listeners.get(event)?.delete(cb) }
  }

  /** 取消所有订阅 */
  clear(): void { this.listeners.clear() }
}

/** 全局单例 */
export const integrationEvents = new IntegrationEventBus()
