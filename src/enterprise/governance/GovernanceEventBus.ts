// src/enterprise/governance/GovernanceEventBus.ts — 治理事件总线
// PB7-S5.1: 统一事件流 — RBAC/Audit/Compliance/Metrics 通过 EventBus 解耦
// 架构: Module → GovernanceEventBus → Audit/Compliance/Notification/Metrics

import { featureFlagManager } from '@platform/flags'

/** 治理事件类型 */
export enum GovernanceEventType {
  /** RBAC: 角色分配/撤销 */
  ROLE_ASSIGNED = 'role.assigned',
  ROLE_REVOKED = 'role.revoked',
  /** 组织: 租户/部门/工作空间变更 */
  TENANT_CREATED = 'tenant.created',
  TENANT_DELETED = 'tenant.deleted',
  WORKSPACE_CREATED = 'workspace.created',
  MEMBER_ADDED = 'member.added',
  /** 合规: 策略变更 */
  POLICY_CREATED = 'policy.created',
  POLICY_ENABLED = 'policy.enabled',
  POLICY_DISABLED = 'policy.disabled',
  /** 审计: 内部审计事件 */
  SNAPSHOT_CREATED = 'snapshot.created',
  SNAPSHOT_RESTORED = 'snapshot.restored',
  /** 系统 */
  SYSTEM_ERROR = 'system.error',
}

/** 治理事件 */
export interface GovernanceEvent {
  type: GovernanceEventType
  source: string
  payload: Record<string, unknown>
  timestamp: number
}

/** 事件监听器 */
export type EventListener = (event: GovernanceEvent) => void

export class GovernanceEventBus {
  private listeners = new Map<GovernanceEventType, Set<EventListener>>()
  private wildcardListeners = new Set<EventListener>()

  /** 订阅特定事件类型 */
  subscribe(eventType: GovernanceEventType, listener: EventListener): () => void {
    this.ensureEnabled()
    let set = this.listeners.get(eventType)
    if (!set) {
      set = new Set()
      this.listeners.set(eventType, set)
    }
    set.add(listener)
    return () => set!.delete(listener)
  }

  /** 订阅所有事件 */
  subscribeAll(listener: EventListener): () => void {
    this.wildcardListeners.add(listener)
    return () => this.wildcardListeners.delete(listener)
  }

  /** 发布事件 */
  emit(event: GovernanceEvent): void {
    // 发送给特定监听器
    const set = this.listeners.get(event.type)
    if (set) {
      for (const listener of set) {
        try { listener(event) } catch { /* 监听器异常不影响其他监听器 */ }
      }
    }
    // 发送给通配符监听器
    for (const listener of this.wildcardListeners) {
      try { listener(event) } catch { /* ignore */ }
    }
  }

  /** 便捷发布 */
  publish(type: GovernanceEventType, source: string, payload: Record<string, unknown> = {}): void {
    this.emit({ type, source, payload, timestamp: Date.now() })
  }

  /** 清空所有监听器 */
  clear(): void {
    this.listeners.clear()
    this.wildcardListeners.clear()
  }

  private ensureEnabled(): void {
    if (!featureFlagManager.isEnabled('pb7.enterprise')) {
      throw new Error('Enterprise Integration is not enabled. Enable pb7.enterprise feature flag.')
    }
  }
}

export const governanceEventBus = new GovernanceEventBus()
