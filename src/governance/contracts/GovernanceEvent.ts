// src/governance/contracts/GovernanceEvent.ts — 事件载荷类型
// PB7-S6: GovernanceEventBus 事件载荷定义

import { Priority, GovernanceEventType } from './GovernanceTypes'

/** 治理事件 */
export interface GovernanceEvent {
  id: string
  type: GovernanceEventType
  priority: Priority
  source: string
  payload: Record<string, unknown>
  timestamp: number
}

/** 事件监听器 */
export type EventListener = (event: GovernanceEvent) => void

/** 事件订阅 */
export interface EventSubscription {
  id: string
  type: GovernanceEventType
  priority: Priority
  listener: EventListener
}
