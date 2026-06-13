// src/core/aggregation/health/ProviderHealthManager.ts - Provider 健康状态管理
// P4.1 Multi-Source Aggregation Engine
//
// 状态机规则：
//   连续 5 次失败 → OFFLINE
//   连续 3 次成功 → HEALTHY
//   失败但未达阈值 → DEGRADED
//
// 职责：健康追踪、状态转换、降级决策
// 禁止：UI、搜索逻辑、Provider 调用

import { ProviderHealthStatus } from '../types/aggregation.types'
import type { ProviderHealthSnapshot } from '../types/aggregation.types'

interface ProviderHealthState {
  providerId: string
  providerName: string
  status: ProviderHealthStatus
  consecutiveFailures: number
  consecutiveSuccesses: number
  lastCheck: number
}

/** 状态转换阈值 */
const OFFLINE_THRESHOLD = 5    // 连续失败 N 次 → OFFLINE
const RECOVER_THRESHOLD = 3    // 连续成功 N 次 → HEALTHY

export class ProviderHealthManager {
  private states = new Map<string, ProviderHealthState>()

  // ==================== 注册 / 注销 ====================

  /** 注册 Provider（首次默认为 HEALTHY） */
  register(providerId: string, providerName: string): void {
    if (!this.states.has(providerId)) {
      this.states.set(providerId, {
        providerId,
        providerName,
        status: ProviderHealthStatus.HEALTHY,
        consecutiveFailures: 0,
        consecutiveSuccesses: 0,
        lastCheck: Date.now(),
      })
    }
  }

  unregister(providerId: string): void {
    this.states.delete(providerId)
  }

  // ==================== 状态标记 ====================

  /** 标记成功 → 递增连续成功、重置连续失败 */
  markSuccess(providerId: string, responseTime?: number): void {
    const state = this.states.get(providerId)
    if (!state) return

    state.consecutiveSuccesses++
    state.consecutiveFailures = 0
    state.lastCheck = Date.now()

    // 恢复逻辑：连续成功达阈值 → HEALTHY
    if (
      state.status !== ProviderHealthStatus.HEALTHY &&
      state.consecutiveSuccesses >= RECOVER_THRESHOLD
    ) {
      state.status = ProviderHealthStatus.HEALTHY
      state.consecutiveSuccesses = 0 // 重置计数器
    }
  }

  /** 标记失败 → 递增连续失败、重置连续成功 */
  markFailure(providerId: string): void {
    const state = this.states.get(providerId)
    if (!state) return

    state.consecutiveFailures++
    state.consecutiveSuccesses = 0
    state.lastCheck = Date.now()

    // 降级逻辑
    if (state.consecutiveFailures >= OFFLINE_THRESHOLD) {
      state.status = ProviderHealthStatus.OFFLINE
    } else if (state.consecutiveFailures > 0) {
      state.status = ProviderHealthStatus.DEGRADED
    }
  }

  // ==================== 查询 ====================

  /** 获取 Provider 健康状态 */
  getHealth(providerId: string): ProviderHealthStatus {
    return this.states.get(providerId)?.status ?? ProviderHealthStatus.HEALTHY
  }

  /** P4.4: 标记为永久失效（超过最大重启次数） */
  markFailed(providerId: string): void {
    const state = this.states.get(providerId)
    if (!state) return
    state.status = ProviderHealthStatus.FAILED
    state.lastCheck = Date.now()
  }

  /** Provider 是否健康（可用于搜索） */
  isHealthy(providerId: string): boolean {
    const status = this.getHealth(providerId)
    return status !== ProviderHealthStatus.OFFLINE && status !== ProviderHealthStatus.FAILED
  }

  /** 获取所有健康快照 */
  getAllSnapshots(): ProviderHealthSnapshot[] {
    return Array.from(this.states.values()).map((s) => ({
      providerId: s.providerId,
      providerName: s.providerName,
      status: s.status,
      consecutiveFailures: s.consecutiveFailures,
      consecutiveSuccesses: s.consecutiveSuccesses,
      lastCheck: s.lastCheck,
    }))
  }

  /** 获取健康 Provider ID 列表 */
  getHealthyProviderIds(): string[] {
    return Array.from(this.states.values())
      .filter((s) => s.status !== ProviderHealthStatus.OFFLINE && s.status !== ProviderHealthStatus.FAILED)
      .map((s) => s.providerId)
  }

  /** Debug：获取所有状态 */
  get allStates(): ReadonlyMap<string, ProviderHealthState> {
    return this.states
  }
}
