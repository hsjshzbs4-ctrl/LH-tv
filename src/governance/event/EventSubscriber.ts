// src/governance/event/EventSubscriber.ts — 订阅包装

import { GovernanceEventBus } from './GovernanceEventBus'
import { Priority, GovernanceEventType } from '../contracts'
import type { EventListener } from '../contracts'

export class EventSubscriber {
  static on(type: GovernanceEventType, listener: EventListener, priority = Priority.NORMAL): () => void {
    return GovernanceEventBus.getInstance().subscribe(type, listener, priority)
  }

  static onAll(listener: EventListener, priority = Priority.NORMAL): () => void {
    return GovernanceEventBus.getInstance().subscribeAll(listener, priority)
  }
}
