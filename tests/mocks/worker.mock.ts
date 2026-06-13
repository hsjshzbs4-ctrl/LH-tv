// tests/mocks/worker.mock.ts — Worker Mock 工厂
// 用于测试 ProviderSandbox / WorkerPool，完全控制 Worker 生命周期

import { vi } from 'vitest'

export interface MockWorkerCall {
  type: string
  data: unknown
}

/**
 * MockWorker — 模拟 Web Worker
 *
 * 用法：
 *   const worker = new MockWorker()
 *   worker.postMessage({ type: 'search', payload: {...} })
 *   worker.simulateMessage({ type: 'search-result', payload: [...] })
 *   worker.simulateError(new Error('crash'))
 */
export class MockWorker {
  onmessage: ((ev: MessageEvent) => void) | null = null
  onerror: ((ev: ErrorEvent) => void) | null = null
  onmessageerror: ((ev: MessageEvent) => void) | null = null

  /** 记录所有 postMessage 调用 */
  calls: MockWorkerCall[] = []

  /** 是否已终止 */
  terminated = false

  postMessage(data: unknown): void {
    this.calls.push({ type: (data as Record<string, unknown>)?.type as string || 'unknown', data })
  }

  terminate(): void {
    this.terminated = true
  }

  addEventListener(_type: string, _listener: EventListener): void {
    // noop
  }

  removeEventListener(_type: string, _listener: EventListener): void {
    // noop
  }

  dispatchEvent(_event: Event): boolean {
    return true
  }

  /** 从 Worker 侧向主线程发送消息 */
  simulateMessage(data: unknown): void {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data }))
    }
  }

  /** 从 Worker 侧向主线程发送错误 */
  simulateError(error: Error): void {
    if (this.onerror) {
      // 构造一个类 ErrorEvent
      const ev = new ErrorEvent('error', { message: error.message, error })
      this.onerror(ev)
    }
  }

  /** 模拟 Worker 崩溃（无响应） */
  simulateCrash(): void {
    // 清空回调但不触发 error（模拟无响应的崩溃）
    this.onmessage = null
    this.onerror = null
  }

  /** 重置状态 */
  reset(): void {
    this.calls = []
    this.terminated = false
    this.onmessage = null
    this.onerror = null
    this.onmessageerror = null
  }
}

/**
 * MockWorkerPool — 模拟 WorkerPool
 *
 * 用法：
 *   const pool = new MockWorkerPool()
 *   pool.registerInThread('p1', mockProvider)
 *   const result = await pool.call('p1', 'search', ['keyword'])
 */
export class MockWorkerPool {
  providers = new Map<string, Record<string, unknown>>()
  workers = new Map<string, MockWorker>()
  crashed = new Set<string>()

  registerInThread(providerId: string, provider: Record<string, unknown>): void {
    this.providers.set(providerId, provider)
  }

  createWorker(_providerId: string): MockWorker {
    const w = new MockWorker()
    this.workers.set(_providerId, w)
    return w
  }

  destroyWorker(providerId: string): void {
    const w = this.workers.get(providerId)
    if (w) w.terminate()
    this.workers.delete(providerId)
  }

  getWorker(providerId: string): MockWorker | undefined {
    return this.workers.get(providerId)
  }

  markCrashed(providerId: string): void {
    this.crashed.add(providerId)
  }

  isCrashed(providerId: string): boolean {
    return this.crashed.has(providerId)
  }

  async call<T>(providerId: string, method: string, args: unknown[]): Promise<T> {
    if (this.crashed.has(providerId)) {
      throw new Error(`Provider "${providerId}" worker is crashed`)
    }
    const provider = this.providers.get(providerId)
    if (!provider) {
      throw new Error(`Provider "${providerId}" not found`)
    }
    const fn = provider[method]
    if (typeof fn !== 'function') {
      throw new Error(`Method "${method}" not found on provider "${providerId}"`)
    }
    return (fn as (...a: unknown[]) => T)(...args)
  }

  reset(): void {
    for (const w of this.workers.values()) w.reset()
    this.providers.clear()
    this.workers.clear()
    this.crashed.clear()
  }
}

/**
 * installMockWorker — 替换全局 Worker 为 MockWorker
 * 返回 restore 函数
 */
export function installMockWorker(): () => void {
  const OriginalWorker = (globalThis as Record<string, unknown>).Worker
  ;(globalThis as Record<string, unknown>).Worker = MockWorker
  return () => {
    ;(globalThis as Record<string, unknown>).Worker = OriginalWorker
  }
}
