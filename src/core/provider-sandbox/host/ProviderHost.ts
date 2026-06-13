// src/core/provider-sandbox/host/ProviderHost.ts - Provider 托管主机
// P4.4 Provider Sandbox
//
// 替代直接 Provider 调用，提供统一的隔离执行环境：
//   - 超时回收 (10s)
//   - 崩溃恢复 (max 3 次重启)
//   - 状态追踪 (HEALTHY / DEGRADED / FAILED)
//   - 双模运行 (Worker 隔离 / 主线程隔离)
//
// 架构：
//   AggregationEngine → ProviderHost → WorkerPool → Worker/InThread → Provider
//
// 禁止：UI、直接 Provider 调用

import { WorkerPool } from '../pool/WorkerPool'
import { WorkerStatus } from '../types/sandbox.types'
import type { ProviderHostConfig } from '../types/sandbox.types'
import { DEFAULT_HOST_CONFIG } from '../types/sandbox.types'
import type { IProvider, MediaItem, MediaDetail } from '@provider-contracts'

type Subscriber = (providerId: string) => void

export class ProviderHost {
  private pool: WorkerPool
  private config: ProviderHostConfig
  private subscribers = new Set<Subscriber>()

  /** 每个 Provider 的重启次数（跨 Worker 生命周期） */
  private totalRestarts = new Map<string, number>()

  constructor(config?: Partial<ProviderHostConfig>) {
    this.config = { ...DEFAULT_HOST_CONFIG, ...config }
    this.pool = new WorkerPool(this.config)
  }

  // ==================== Provider 注册 ====================

  /**
   * 注册 Provider（自动选择隔离模式）
   * 默认使用主线程隔离（兼容 window.app.* 依赖）
   */
  register(provider: IProvider): void {
    this.pool.registerInThread(provider)
    this.totalRestarts.set(provider.id, 0)
  }

  /** 批量注册 */
  registerAll(providers: IProvider[]): void {
    for (const p of providers) {
      this.register(p)
    }
  }

  /** 注销 Provider */
  unregister(providerId: string): void {
    this.pool.destroyWorker(providerId)
    this.totalRestarts.delete(providerId)
  }

  // ==================== 搜索 ====================

  async search(providerId: string, keyword: string): Promise<MediaItem[]> {
    const response = await this._callWithRecovery(
      providerId,
      'search',
      [keyword],
    )
    if (!response.success) {
      throw new Error(response.error || '搜索失败')
    }
    return (response.data as MediaItem[]) || []
  }

  // ==================== 详情 ====================

  async detail(providerId: string, mediaId: string): Promise<MediaDetail> {
    const response = await this._callWithRecovery(
      providerId,
      'detail',
      [mediaId],
    )
    if (!response.success) {
      throw new Error(response.error || '获取详情失败')
    }
    return response.data as MediaDetail
  }

  // ==================== 健康检查 ====================

  async healthCheck(providerId: string): Promise<boolean> {
    try {
      const response = await this._callWithRecovery(
        providerId,
        'healthCheck',
        [],
      )
      return response.success
    } catch {
      return false
    }
  }

  // ==================== 状态管理 ====================

  /** 获取 Provider 是否健康 */
  isProviderHealthy(providerId: string): boolean {
    const state = this.pool.getWorker(providerId)
    if (!state) return false
    return (
      state.status === WorkerStatus.IDLE ||
      state.status === WorkerStatus.BUSY
    )
  }

  /** 获取所有注册的 Provider ID */
  getRegisteredProviderIds(): string[] {
    return this.pool.getAllWorkers().map((w) => w.providerId)
  }

  /** Debug：获取所有 Provider 的调试信息 */
  getDebugInfo() {
    return this.pool
      .getAllWorkers()
      .map((w) => this.pool.getDebugInfo(w.providerId))
      .filter(Boolean)
  }

  // ==================== 订阅 ====================

  subscribe(callback: Subscriber): () => void {
    this.subscribers.add(callback)
    const unsubPool = this.pool.subscribe(callback)
    return () => {
      this.subscribers.delete(callback)
      unsubPool()
    }
  }

  // ==================== 清理 ====================

  destroy(): void {
    this.pool.destroy()
    this.totalRestarts.clear()
  }

  // ==================== 内部 ====================

  /**
   * 带崩溃恢复的调用
   * 失败 → 重启 Worker → 重试（最多 maxRestarts 次）
   */
  private async _callWithRecovery(
    providerId: string,
    method: 'search' | 'detail' | 'healthCheck',
    params: unknown[],
  ) {
    const maxRestarts = this.config.maxRestarts
    let lastResponse

    for (let attempt = 0; attempt <= maxRestarts; attempt++) {
      const response = await this.pool.call(providerId, method, params)

      if (response.success) return response

      lastResponse = response

      // 最后一次尝试，不再重启
      if (attempt >= maxRestarts) break

      // 重启 Provider
      const totalRestarts = (this.totalRestarts.get(providerId) || 0) + 1
      this.totalRestarts.set(providerId, totalRestarts)

      if (totalRestarts > maxRestarts) {
        // 超过最大重启次数 → FAILED
        console.error(
          `[ProviderHost] Provider "${providerId}" 超过最大重启次数 (${maxRestarts})，标记为 FAILED`,
        )
        break
      }

      console.warn(
        `[ProviderHost] Provider "${providerId}" 调用失败 (attempt ${attempt + 1}/${maxRestarts}): ${response.error}，正在重启...`,
      )

      this.pool.restartWorker(providerId)
      // 等待 Worker 重启
      await this._sleep(500)
      // 重新注册（主线程模式需要重新 set provider）
      const state = this.pool.getWorker(providerId)
      if (state && !state.isolated && state.provider) {
        this.pool.registerInThread(state.provider)
      }
    }

    return (
      lastResponse || {
        id: '',
        success: false,
        error: `Provider "${providerId}" 已失效`,
      }
    )
  }

  private _sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms))
  }
}
