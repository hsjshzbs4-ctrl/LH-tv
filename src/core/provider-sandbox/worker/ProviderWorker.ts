// src/core/provider-sandbox/worker/ProviderWorker.ts - Web Worker 中的 Provider 托管
// P4.4 Provider Sandbox
//
// 运行在 Worker 线程中：
//   1. 接收主线程消息 (SandboxRequest)
//   2. 调用 Provider 实例方法
//   3. 返回结果 (SandboxResponse)
//
// 限制：Worker 环境中无 window / DOM / Electron IPC
// 适用：纯 HTTP Provider（不依赖 window.app.*）

import type { SandboxRequest, SandboxResponse } from '../types/sandbox.types'

/** providerId → Provider 实例 */
const instances = new Map<string, unknown>()

/** 全局 Worker 域中的 self */
const workerSelf = self as unknown as Worker

/**
 * 创建 Provider 实例的工厂注册表
 * 由主线程在初始化时通过 'init' 消息注入
 */
let factoryRegistry: Record<string, () => unknown> = {}

workerSelf.onmessage = async (event: MessageEvent<SandboxRequest | { type: 'init'; registry: Record<string, () => unknown> }>) => {
  const msg = event.data

  // 初始化：注入工厂注册表
  if ('type' in msg && msg.type === 'init') {
    factoryRegistry = msg.registry
    return
  }

  const { id, providerId, method, params } = msg as SandboxRequest

  try {
    // 获取或创建 Provider 实例
    let instance = instances.get(providerId)
    if (!instance) {
      const factory = factoryRegistry[providerId]
      if (!factory) {
        throw new Error(`Provider "${providerId}" 未在 Worker 中注册`)
      }
      instance = factory()
      instances.set(providerId, instance)
    }

    // 调用方法
    const fn = (instance as Record<string, unknown>)[method]
    if (typeof fn !== 'function') {
      throw new Error(`Provider "${providerId}" 缺少方法: ${method}`)
    }

    const data = await (fn as (...args: unknown[]) => unknown).apply(instance, params)

    const response: SandboxResponse = { id, success: true, data }
    workerSelf.postMessage(response)
  } catch (err) {
    const response: SandboxResponse = {
      id,
      success: false,
      error: (err as Error).message || 'Worker 执行异常',
    }
    workerSelf.postMessage(response)
  }
}
