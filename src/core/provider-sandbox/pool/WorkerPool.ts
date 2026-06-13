// src/core/provider-sandbox/pool/WorkerPool.ts - Worker 池管理
// P4.4 Provider Sandbox
//
// 职责：Worker 生命周期管理、消息路由、超时处理
// 双模支持：Worker 隔离 (isolated=true) / 主线程隔离 (isolated=false)
//
// 禁止：直接调用 Provider、UI

import type { IProvider } from '@provider-contracts'
import type {
  SandboxRequest,
  SandboxResponse,
  WorkerState,
} from '../types/sandbox.types'
import { WorkerStatus } from '../types/sandbox.types'
import { DEFAULT_HOST_CONFIG } from '../types/sandbox.types'
import type { ProviderHostConfig } from '../types/sandbox.types'

type Subscriber = (providerId: string) => void

export class WorkerPool {
  private workers = new Map<string, WorkerState>()
  private config: ProviderHostConfig
  private subscribers = new Set<Subscriber>()
  private pendingRequests = new Map<
    string,
    { resolve: (v: SandboxResponse) => void; timer: ReturnType<typeof setTimeout> }
  >()

  constructor(config?: Partial<ProviderHostConfig>) {
    this.config = { ...DEFAULT_HOST_CONFIG, ...config }
  }

  // ==================== Worker 管理 ====================

  /**
   * 注册 Provider（主线程隔离模式，用于 window.app.* 依赖的 Provider）
   */
  registerInThread(provider: IProvider): void {
    if (this.workers.has(provider.id)) return

    this.workers.set(provider.id, {
      worker: null,
      provider,
      providerId: provider.id,
      status: WorkerStatus.IDLE,
      restartCount: 0,
      totalCalls: 0,
      failedCalls: 0,
      lastUsed: Date.now(),
      isolated: false,
    })
  }

  /**
   * 创建 Worker 隔离的 Provider
   * @param providerId Provider ID
   * @param workerUrl Worker 脚本 URL
   * @param factory Worker 中创建 Provider 的工厂函数（会被序列化传递）
   */
  createWorker(
    providerId: string,
    workerUrl: URL,
    factory: () => IProvider,
  ): void {
    // 销毁已有 Worker
    this.destroyWorker(providerId)

    try {
      // 创建 Worker
      const worker = new Worker(workerUrl, { type: 'module' })

      // 注入工厂注册表
      const registry: Record<string, () => unknown> = {
        [providerId]: factory,
      }
      worker.postMessage({ type: 'init', registry })

      worker.onmessage = (event: MessageEvent<SandboxResponse>) => {
        this._handleResponse(event.data)
      }

      worker.onerror = (err: ErrorEvent) => {
        console.error(`[WorkerPool] Worker "${providerId}" error:`, err.message)
        this._handleWorkerCrash(providerId)
      }

      this.workers.set(providerId, {
        worker,
        provider: null,
        providerId,
        status: WorkerStatus.IDLE,
        restartCount: 0,
        totalCalls: 0,
        failedCalls: 0,
        lastUsed: Date.now(),
        isolated: true,
      })
    } catch (err) {
      console.error(`[WorkerPool] 创建 Worker "${providerId}" 失败:`, err)
      // 降级到主线程模式
    }
  }

  /**
   * 销毁 Worker
   */
  destroyWorker(providerId: string): void {
    const state = this.workers.get(providerId)
    if (!state) return

    if (state.worker) {
      state.worker.terminate()
      state.worker = null
    }
    state.status = WorkerStatus.TERMINATED
  }

  /**
   * 重启 Worker
   */
  restartWorker(providerId: string): void {
    const state = this.workers.get(providerId)
    if (!state) return

    state.status = WorkerStatus.RESTARTING
    state.restartCount++

    // 保留旧的 Worker URL 和 factory，但无法从已销毁的 Worker 中恢复
    // 对于主线程模式，标记状态即可
    if (!state.isolated) {
      state.status = WorkerStatus.IDLE
      this._notify(providerId)
      return
    }

    // Worker 模式：终止后需要外部重新创建
    if (state.worker) {
      state.worker.terminate()
      state.worker = null
    }
    state.status = WorkerStatus.TERMINATED
    this._notify(providerId)
  }

  // ==================== 调用 ====================

  /**
   * 调用 Provider 方法（通过 Worker 或主线程）
   * @returns Promise<SandboxResponse>
   */
  async call(
    providerId: string,
    method: SandboxRequest['method'],
    params: unknown[],
  ): Promise<SandboxResponse> {
    const state = this.workers.get(providerId)
    if (!state || state.status === WorkerStatus.TERMINATED) {
      return { id: '', success: false, error: `Provider "${providerId}" 不可用` }
    }

    const id = `${providerId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    state.status = WorkerStatus.BUSY
    state.totalCalls++
    state.lastUsed = Date.now()

    // 主线程模式：直接调用
    if (!state.isolated && state.provider) {
      return this._callInThread(id, state.provider, method, params)
    }

    // Worker 模式：发送消息
    if (state.isolated && state.worker) {
      return this._callInWorker(id, providerId, state.worker, method, params)
    }

    state.status = WorkerStatus.IDLE
    return { id, success: false, error: 'Provider 未就绪' }
  }

  /** 主线程直接调用（带超时） */
  private async _callInThread(
    id: string,
    provider: IProvider,
    method: SandboxRequest['method'],
    params: unknown[],
  ): Promise<SandboxResponse> {
    const state = this.workers.get(provider.id)!

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        state.status = WorkerStatus.IDLE
        state.failedCalls++
        resolve({ id, success: false, error: `调用超时 (${this.config.timeout}ms)` })
      }, this.config.timeout)

      Promise.resolve()
        .then(async () => {
          const fn = (provider as unknown as Record<string, unknown>)[method] as (
            ...args: unknown[]
          ) => unknown
          if (typeof fn !== 'function') {
            throw new Error(`方法 "${method}" 不存在`)
          }
          return await fn.apply(provider, params)
        })
        .then((data) => {
          clearTimeout(timer)
          state.status = WorkerStatus.IDLE
          resolve({ id, success: true, data })
        })
        .catch((err) => {
          clearTimeout(timer)
          state.status = WorkerStatus.IDLE
          state.failedCalls++
          resolve({ id, success: false, error: (err as Error).message })
        })
    })
  }

  /** Worker 消息调用 */
  private _callInWorker(
    id: string,
    providerId: string,
    worker: Worker,
    method: SandboxRequest['method'],
    params: unknown[],
  ): Promise<SandboxResponse> {
    const state = this.workers.get(providerId)!

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(id)
        state.status = WorkerStatus.IDLE
        state.failedCalls++
        resolve({ id, success: false, error: `Worker 超时 (${this.config.timeout}ms)` })
      }, this.config.timeout)

      this.pendingRequests.set(id, { resolve, timer })

      const request: SandboxRequest = { id, providerId, method, params }
      worker.postMessage(request)
    })
  }

  /** 处理 Worker 响应 */
  private _handleResponse(response: SandboxResponse): void {
    const pending = this.pendingRequests.get(response.id)
    if (!pending) return

    clearTimeout(pending.timer)
    this.pendingRequests.delete(response.id)

    // 找到对应的 Worker 状态并更新
    for (const [, state] of this.workers) {
      if (state.status === WorkerStatus.BUSY && state.isolated) {
        state.status = WorkerStatus.IDLE
        if (!response.success) state.failedCalls++
        break
      }
    }

    pending.resolve(response)
  }

  /** Worker 崩溃处理 */
  private _handleWorkerCrash(providerId: string): void {
    const state = this.workers.get(providerId)
    if (!state) return

    state.failedCalls++
    state.status = WorkerStatus.TERMINATED

    // 清理所有该 Worker 的待处理请求
    for (const [id, pending] of this.pendingRequests) {
      if (id.startsWith(providerId)) {
        clearTimeout(pending.timer)
        pending.resolve({ id, success: false, error: 'Worker 崩溃' })
        this.pendingRequests.delete(id)
      }
    }

    this._notify(providerId)
  }

  // ==================== 查询 ====================

  getWorker(providerId: string): WorkerState | undefined {
    return this.workers.get(providerId)
  }

  getAllWorkers(): WorkerState[] {
    return Array.from(this.workers.values())
  }

  /** 获取 Worker 统计（用于调试面板） */
  getDebugInfo(providerId: string) {
    const state = this.workers.get(providerId)
    if (!state) return null
    return {
      providerId: state.providerId,
      status: state.status,
      isolated: state.isolated,
      restartCount: state.restartCount,
      totalCalls: state.totalCalls,
      failedCalls: state.failedCalls,
      memoryMB: state.isolated && state.worker
        ? undefined // performance.memory API 仅在 Chrome 主线程可用
        : undefined,
    }
  }

  // ==================== 订阅 ====================

  subscribe(callback: Subscriber): () => void {
    this.subscribers.add(callback)
    return () => { this.subscribers.delete(callback) }
  }

  private _notify(providerId: string): void {
    this.subscribers.forEach((fn) => {
      try { fn(providerId) } catch { /* ignore */ }
    })
  }

  // ==================== 清理 ====================

  destroy(): void {
    for (const [id] of this.workers) {
      this.destroyWorker(id)
    }
    this.workers.clear()
    this.pendingRequests.clear()
  }
}
