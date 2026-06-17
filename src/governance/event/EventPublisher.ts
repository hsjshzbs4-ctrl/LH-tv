// src/governance/event/EventPublisher.ts — 发布包装

import { GovernanceEventBus } from './GovernanceEventBus'
import { Priority, GovernanceEventType } from '../contracts'

export class EventPublisher {
  static publish(type: GovernanceEventType, source: string, payload: Record<string, unknown> = {}, priority = Priority.NORMAL): void {
    GovernanceEventBus.getInstance().publish(type, source, payload, priority)
  }

  static publishAsync(event: Parameters<GovernanceEventBus['dispatchAsync']>[0]): void {
    GovernanceEventBus.getInstance().dispatchAsync(event)
  }

  static flush(): void {
    GovernanceEventBus.getInstance().flush()
  }
}
